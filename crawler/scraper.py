import re
import json
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from playwright.sync_api import sync_playwright, Page

COOKIES_FILE = Path(__file__).parent / "cookies.json"

REGION_MAP = {
    "서울": "서울특별시",
    "경기": "경기도",
    "인천": "인천광역시",
    "부산": "부산광역시",
    "대구": "대구광역시",
    "대전": "대전광역시",
    "광주": "광주광역시",
    "울산": "울산광역시",
    "세종": "세종특별자치시",
    "강원": "강원도",
    "충북": "충청북도",
    "충남": "충청남도",
    "전북": "전라북도",
    "전남": "전라남도",
    "경북": "경상북도",
    "경남": "경상남도",
    "제주": "제주특별자치도",
}

KNOWN_TAGS = [
    "유치권", "지분경매", "재매각", "반값물건", "대항력 있는 임차인",
    "위반건축물", "1년전감정가", "오늘신건", "HUG 대항력 포기", "초보자 경매",
]


@dataclass
class AuctionItem:
    case_number: str
    region: str           # 정식 지역명 (서울특별시 등)
    address: str          # 상세주소
    item_type: str        # 물건 종류
    appraise_price: int   # 감정가 (만원)
    bid_price: int        # 최저입찰가 (만원)
    bid_ratio: float      # 최저가율 (%)
    bid_date: date        # 입찰기일
    area_building: float  # 건물 면적 (㎡)
    area_land: float      # 토지/대지권 면적 (㎡)
    fail_count: int       # 유찰 횟수
    tags: list[str] = field(default_factory=list)
    tags_raw: str = ""    # 특수물건 전체 텍스트 (분묘기지권, 농지취득 등 포함)


def scrape_hauction(start_date: date) -> list[AuctionItem]:
    items: list[AuctionItem] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        page.goto("https://www.hauction.co.kr/search/auction", wait_until="networkidle")
        page.wait_for_timeout(2000)

        _apply_view_settings(page)
        page.wait_for_selector("tr.info-row", timeout=15000)

        page_num = 1
        while True:
            page_items = _parse_page(page)
            if not page_items:
                break

            new_items = [i for i in page_items if i.bid_date >= start_date]
            items.extend(new_items)

            if any(i.bid_date < start_date for i in page_items):
                break

            if not _go_next_page(page, page_num):
                break
            page_num += 1

        browser.close()

    return items


def _apply_view_settings(page: Page) -> None:
    try:
        # 매각기일 ↓ 정렬
        page.click("button.menu-button:has-text('매각기일')")
        page.wait_for_timeout(500)
        page.click("button[value='bid_desc']")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
    except Exception:
        pass

    try:
        # 페이지당 100개
        page.click("button.menu-button:has-text('개')")
        page.wait_for_timeout(500)
        page.get_by_role("menuitemradio").filter(has_text="100개").click()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
    except Exception:
        pass


def _login(page: Page, hauction_id: str, hauction_pw: str) -> None:
    page.click("p#login")
    page.wait_for_timeout(2000)
    page.type("input[placeholder='아이디']", hauction_id, delay=80)
    page.type("input[placeholder='비밀번호']", hauction_pw, delay=80)
    page.wait_for_timeout(500)
    page.get_by_role("button", name="로그인").last.click()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)


def _parse_page(page: Page) -> list[AuctionItem]:
    items = []
    rows = page.query_selector_all("tr.info-row")

    for row in rows:
        tds = row.query_selector_all("td")
        if len(tds) < 5:
            continue
        try:
            item = _parse_row(tds)
            if item:
                items.append(item)
        except Exception:
            continue

    return items


def _parse_row(tds) -> AuctionItem | None:
    # td[0]: 사진
    # td[1]: 물건종류 / 사건번호 / 주소 / 면적 / 태그
    # td[2]: 감정가 / 최저가
    # td[3]: 진행상태 (유찰 N회, %)
    # td[4]: 입찰기일
    # td[5]: 조회수

    info_td = tds[1]
    price_td = tds[2]
    status_td = tds[3]
    date_td = tds[4]

    # 물건 종류 (회색 텍스트)
    type_el = info_td.query_selector("p.grey-color")
    item_type = type_el.inner_text().strip() if type_el else ""

    # 사건번호 (굵은 텍스트)
    bold_els = info_td.query_selector_all("p.text-16-m-2")
    case_number = ""
    for el in bold_els:
        text = el.inner_text().strip()
        if re.search(r"\d{4}-\d+", text):
            case_number = text
            break

    # 주소 → 지역 추출
    address = ""
    for el in bold_els:
        text = el.inner_text().strip()
        if not re.search(r"\d{4}-\d+", text) and "grey-color" not in (el.get_attribute("class") or ""):
            address = text
            break
    region = _extract_region(address)

    # 면적 (건물 / 토지·대지권)
    area_building = 0.0
    area_land = 0.0
    area_spans = info_td.query_selector_all("span")
    for span in area_spans:
        t = span.inner_text()
        m_b = re.search(r"건물\s*([\d,.]+)㎡", t)
        m_l = re.search(r"(?:토지|대지권)\s*([\d,.]+)㎡", t)
        if m_b:
            area_building = float(m_b.group(1).replace(",", ""))
        if m_l:
            area_land = float(m_l.group(1).replace(",", ""))

    # 특수조건 태그 (빨간 텍스트)
    tag_el = info_td.query_selector("p.red-color")
    tags = []
    tags_raw = ""
    if tag_el:
        tag_text = tag_el.inner_text()
        tags_raw = tag_text.strip()
        tags = [t for t in KNOWN_TAGS if t in tag_text]

    # 감정가 / 최저가 (원 → 만원)
    price_texts = price_td.query_selector_all("p")
    appraise_price = _parse_won(price_texts[0].inner_text()) if len(price_texts) > 0 else 0
    bid_price = _parse_won(price_texts[1].inner_text()) if len(price_texts) > 1 else 0
    bid_ratio = round(bid_price / appraise_price * 100, 1) if appraise_price > 0 else 0.0

    # 유찰 횟수
    status_text = status_td.inner_text()
    fail_match = re.search(r"유찰\s*(\d+)회", status_text)
    fail_count = int(fail_match.group(1)) if fail_match else 0

    # 입찰기일 (예: 26.03.27(금))
    date_text = date_td.inner_text().strip()
    bid_date = _parse_date(date_text)
    if not bid_date:
        return None

    if not case_number:
        return None

    return AuctionItem(
        case_number=case_number,
        region=region,
        address=address,
        item_type=item_type,
        appraise_price=appraise_price,
        bid_price=bid_price,
        bid_ratio=bid_ratio,
        bid_date=bid_date,
        area_building=area_building,
        area_land=area_land,
        fail_count=fail_count,
        tags=tags,
        tags_raw=tags_raw,
    )


def _extract_region(address: str) -> str:
    for key, full_name in REGION_MAP.items():
        if address.startswith(key) or address.startswith(full_name):
            return full_name
    return address.split()[0] if address else ""


def _parse_won(text: str) -> int:
    digits = re.sub(r"[^\d]", "", text)
    return int(digits) // 10000 if digits else 0


def _parse_date(text: str) -> date | None:
    m = re.search(r"(\d{2})\.(\d{2})\.(\d{2})", text)
    if not m:
        return None
    year = 2000 + int(m.group(1))
    month = int(m.group(2))
    day = int(m.group(3))
    return date(year, month, day)


def _go_next_page(page: Page, current_page: int) -> bool:
    try:
        next_page_num = str(current_page + 1)
        # li.button-wrap 안의 div[role="button"] 중 텍스트가 다음 페이지 번호인 것 클릭
        page_btns = page.query_selector_all("li.button-wrap div[role='button']")
        for btn in page_btns:
            if btn.inner_text().strip() == next_page_num:
                btn.click()
                page.wait_for_load_state("networkidle")
                page.wait_for_timeout(1000)
                return True
    except Exception:
        pass
    return False
