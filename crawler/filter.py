from dataclasses import dataclass
from typing import Optional
from scraper import AuctionItem


@dataclass
class FilterConfig:
    regions: list[str]
    types: list[str]
    appraise_min: Optional[int]   # 만원
    appraise_max: Optional[int]   # 만원
    bid_min: Optional[int]        # 만원
    bid_max: Optional[int]        # 만원
    special_conditions: list[str]


def apply_filters(items: list[AuctionItem], config: FilterConfig) -> list[AuctionItem]:
    result = items

    if config.regions:
        result = [i for i in result if any(r in i.region for r in config.regions)]

    if config.types:
        result = [i for i in result if any(t in i.item_type for t in config.types)]

    if config.appraise_min is not None:
        result = [i for i in result if i.appraise_price >= config.appraise_min]

    if config.appraise_max is not None:
        result = [i for i in result if i.appraise_price <= config.appraise_max]

    if config.bid_min is not None:
        result = [i for i in result if i.bid_price >= config.bid_min]

    if config.bid_max is not None:
        result = [i for i in result if i.bid_price <= config.bid_max]

    if config.special_conditions:
        result = [i for i in result if any(c in i.tags for c in config.special_conditions)]

    return result
