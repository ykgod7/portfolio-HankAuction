import os
import sys
from datetime import date

from dotenv import load_dotenv
from supabase import create_client

from scraper import scrape_hauction
from filter import apply_filters, FilterConfig
from kakao import send_summary, send_no_items, send_item_card, send_error

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
FIXED_ID = "00000000-0000-0000-0000-000000000001"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_filter_config() -> FilterConfig:
    res = supabase.table("filters").select("*").eq("id", FIXED_ID).single().execute()
    data = res.data
    return FilterConfig(
        regions=data.get("regions") or [],
        types=data.get("types") or [],
        appraise_min=data.get("appraise_min"),
        appraise_max=data.get("appraise_max"),
        bid_min=data.get("bid_min"),
        bid_max=data.get("bid_max"),
        special_conditions=data.get("special_conditions") or [],
    )


INITIAL_START_DATE = date(2026, 6, 18)  # 최초 크롤링 기준일


def get_start_date() -> date:
    res = (
        supabase.table("sent_items")
        .select("bid_date")
        .order("bid_date", desc=True)
        .limit(1)
        .execute()
    )
    if res.data and res.data[0].get("bid_date"):
        return date.fromisoformat(res.data[0]["bid_date"])
    return INITIAL_START_DATE


def get_sent_keys() -> set[tuple[str, str]]:
    res = supabase.table("sent_items").select("case_number, bid_date").execute()
    return {(row["case_number"], row["bid_date"]) for row in res.data}


def save_sent_item(case_number: str, bid_date: date) -> None:
    supabase.table("sent_items").upsert({
        "case_number": case_number,
        "bid_date": bid_date.isoformat(),
    }).execute()


def update_last_crawled_at() -> None:
    supabase.table("filters").update(
        {"last_crawled_at": date.today().isoformat()}
    ).eq("id", FIXED_ID).execute()


def main(dry_run: bool = False) -> None:
    try:
        config = get_filter_config()
        start_date = get_start_date()

        print(f"크롤링 시작: {start_date} 이후 물건 (매각기일 최신순)")
        items = scrape_hauction(start_date=start_date)
        print(f"크롤링 완료: {len(items)}건")

        filtered = apply_filters(items, config)
        print(f"필터 적용 후: {len(filtered)}건")

        sent = get_sent_keys()
        new_items = [i for i in filtered if (i.case_number, i.bid_date.isoformat()) not in sent]
        print(f"신규 물건: {len(new_items)}건")

        for item in new_items:
            print(f"  [{item.bid_date}] {item.region} {item.item_type} | {item.address}")
            print(f"    감정가: {item.appraise_price * 10000:,}원 / 최저: {item.bid_price * 10000:,}원 ({item.bid_ratio}%)")
            if item.tags_raw:
                print(f"    특수조건: {item.tags_raw}")

        if dry_run:
            print("\n[DRY RUN] DB 저장 및 카톡 발송 건너뜀")
            return

        if new_items:
            send_summary(len(new_items), config.regions, config.types)
            for item in new_items:
                send_item_card(item)
                save_sent_item(item.case_number, item.bid_date)
                print(f"발송 완료: {item.case_number}")
        else:
            send_no_items()
            print("신규 물건 없음 알림 발송")

        update_last_crawled_at()
        print("완료")

    except Exception as e:
        error_msg = str(e)
        print(f"에러: {error_msg}", file=sys.stderr)
        try:
            send_error(error_msg)
        except Exception:
            pass
        sys.exit(1)


if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    main(dry_run=dry_run)
