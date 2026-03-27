import os
import json
import requests
from datetime import date
from scraper import AuctionItem

KAKAO_API_URL = "https://kapi.kakao.com/v2/api/talk/memo/default/send"
HAUCTION_URL = "https://www.hauction.co.kr/search/auction"


def _send(template: dict) -> None:
    token = os.environ["KAKAO_ACCESS_TOKEN"]
    requests.post(
        KAKAO_API_URL,
        headers={"Authorization": f"Bearer {token}"},
        data={"template_object": json.dumps(template, ensure_ascii=False)},
    )


def send_summary(count: int, regions: list[str], types: list[str]) -> None:
    today = date.today()
    region_text = ", ".join(regions) if regions else "전국"
    type_text = ", ".join(types) if types else "전체"

    _send({
        "object_type": "text",
        "text": f"🏠 경매 알림 — {today.month}월 {today.day}일\n이번 주 신규 물건 {count}건 발견\n{region_text} | {type_text}",
        "link": {
            "web_url": HAUCTION_URL,
            "mobile_web_url": HAUCTION_URL,
        },
    })


def send_no_items() -> None:
    today = date.today()
    _send({
        "object_type": "text",
        "text": f"🏠 경매 알림 — {today.month}월 {today.day}일\n조건에 맞는 신규 물건이 없습니다.",
        "link": {
            "web_url": HAUCTION_URL,
            "mobile_web_url": HAUCTION_URL,
        },
    })


def send_item_card(item: AuctionItem) -> None:
    fail_tag = f"유찰 {item.fail_count}회" if item.fail_count > 0 else "신건"

    area_parts = []
    if item.area_building:
        area_parts.append(f"건물 {item.area_building:,}㎡")
    if item.area_land:
        area_parts.append(f"토지 {item.area_land:,}㎡")
    area_text = " / ".join(area_parts) if area_parts else "-"

    tags_line = f"⚠️ {item.tags_raw}\n" if item.tags_raw else ""

    text = (
        f"🏠 {item.region} 경매 [{fail_tag}]\n"
        f"{item.item_type} | {item.address}\n"
        f"{tags_line}"
        f"─────────────────\n"
        f"감정가:     {item.appraise_price * 10000:,}원\n"
        f"최저입찰가: {item.bid_price * 10000:,}원 ({item.bid_ratio}%)\n"
        f"입찰기일:   {item.bid_date.strftime('%Y.%m.%d')}\n"
        f"면적:       {area_text}"
    )

    _send({
        "object_type": "text",
        "text": text,
        "link": {
            "web_url": HAUCTION_URL,
            "mobile_web_url": HAUCTION_URL,
        },
    })


def send_error(message: str) -> None:
    _send({
        "object_type": "text",
        "text": f"⚠️ 크롤러 에러\n{message}",
        "link": {"web_url": HAUCTION_URL},
    })
