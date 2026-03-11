from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from typing import Any
from urllib.parse import quote_plus, urlparse

try:
    from ddgs import DDGS
except Exception:  # pragma: no cover - optional import for local setup
    DDGS = None


@dataclass(frozen=True)
class Category:
    id: str
    name: str
    icon: str


CATEGORIES = [
    Category(id="tech", name="Tech", icon="Smartphone"),
    Category(id="beauty", name="Beauty", icon="Sparkles"),
    Category(id="fragrance", name="Fragrance", icon="Wind"),
    Category(id="furniture", name="Furniture", icon="Sofa"),
    Category(id="education", name="Education", icon="BookOpen"),
    Category(id="hotels", name="Hotels", icon="Hotel"),
    Category(id="fashion", name="Fashion", icon="Shirt"),
    Category(id="skincare", name="Skincare", icon="Droplet"),
    Category(id="gadgets", name="Gadgets", icon="Zap"),
    Category(id="home", name="Home", icon="Home"),
    Category(id="fitness", name="Fitness", icon="Dumbbell"),
    Category(id="travel", name="Travel", icon="Plane"),
]

CATEGORY_NAMES = {category.id: category.name for category in CATEGORIES}

SEED_PRODUCTS: list[dict[str, Any]] = [
    {
        "id": "prod-1",
        "name": "iPhone 15 Pro",
        "price": 999,
        "rating": 4.8,
        "image": "https://images.unsplash.com/photo-1592286927505-1def25115558?w=400&h=400&fit=crop",
        "category": "Tech",
        "brand": "Apple",
        "specs": {
            "storage": "256GB",
            "ram": "8GB",
            "display": "6.1 inch",
            "battery": "3274 mAh",
            "processor": "A17 Pro",
        },
        "amazonLink": "https://amazon.com?aff=prodbot&product=iphone15pro",
        "sourceUrl": "https://amazon.com?aff=prodbot&product=iphone15pro",
        "description": "Premium smartphone with Apple silicon and pro camera system.",
    },
    {
        "id": "prod-2",
        "name": "Samsung Galaxy S24",
        "price": 899,
        "rating": 4.7,
        "image": "https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&h=400&fit=crop",
        "category": "Tech",
        "brand": "Samsung",
        "specs": {
            "storage": "256GB",
            "ram": "12GB",
            "display": "6.2 inch",
            "battery": "4000 mAh",
            "processor": "Snapdragon 8 Gen 3",
        },
        "amazonLink": "https://amazon.com?aff=prodbot&product=galaxys24",
        "sourceUrl": "https://amazon.com?aff=prodbot&product=galaxys24",
        "description": "Flagship Android phone with strong performance and camera quality.",
    },
    {
        "id": "prod-3",
        "name": "Google Pixel 8",
        "price": 799,
        "rating": 4.6,
        "image": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop",
        "category": "Tech",
        "brand": "Google",
        "specs": {
            "storage": "256GB",
            "ram": "12GB",
            "display": "6.2 inch",
            "battery": "4700 mAh",
            "processor": "Tensor G3",
        },
        "amazonLink": "https://amazon.com?aff=prodbot&product=pixel8",
        "sourceUrl": "https://amazon.com?aff=prodbot&product=pixel8",
        "description": "Google phone focused on AI features and photography.",
    },
    {
        "id": "prod-4",
        "name": "Sony WH-1000XM5",
        "price": 399,
        "rating": 4.9,
        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
        "category": "Gadgets",
        "brand": "Sony",
        "specs": {
            "noise-cancellation": "Active",
            "battery-life": "30 hours",
            "weight": "250g",
            "driver-size": "40mm",
        },
        "amazonLink": "https://amazon.com?aff=prodbot&product=sonywh1000xm5",
        "sourceUrl": "https://amazon.com?aff=prodbot&product=sonywh1000xm5",
        "description": "Noise-cancelling over-ear headphones with long battery life.",
    },
    {
        "id": "prod-5",
        "name": "Apple AirPods Pro",
        "price": 249,
        "rating": 4.7,
        "image": "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop",
        "category": "Gadgets",
        "brand": "Apple",
        "specs": {
            "noise-cancellation": "Active",
            "battery-life": "6 hours",
            "weight": "5.3g",
            "driver-size": "Custom",
        },
        "amazonLink": "https://amazon.com?aff=prodbot&product=airpodspro",
        "sourceUrl": "https://amazon.com?aff=prodbot&product=airpodspro",
        "description": "Wireless earbuds with active noise cancellation.",
    },
    {
        "id": "prod-6",
        "name": "DJI Mini 3",
        "price": 349,
        "rating": 4.6,
        "image": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
        "category": "Gadgets",
        "brand": "DJI",
        "specs": {
            "flight-time": "31 minutes",
            "max-speed": "57.6 km/h",
            "weight": "249g",
            "camera": "4K/30fps",
        },
        "amazonLink": "https://amazon.com?aff=prodbot&product=djimini3",
        "sourceUrl": "https://amazon.com?aff=prodbot&product=djimini3",
        "description": "Entry-level drone with 4K video and sub-250g form factor.",
    },
    {
        "id": "prod-7",
        "name": "Herman Miller Aeron",
        "price": 1395,
        "rating": 4.8,
        "image": "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&h=400&fit=crop",
        "category": "Furniture",
        "brand": "Herman Miller",
        "specs": {
            "material": "Mesh",
            "height-range": "16.5-20.5 inches",
            "warranty": "12 years",
            "weight-capacity": "300 lbs",
        },
        "amazonLink": "https://amazon.com?aff=prodbot&product=aeronchair",
        "sourceUrl": "https://amazon.com?aff=prodbot&product=aeronchair",
        "description": "Premium ergonomic office chair with mesh support.",
    },
    {
        "id": "prod-8",
        "name": "Steelcase Leap",
        "price": 1016,
        "rating": 4.7,
        "image": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
        "category": "Furniture",
        "brand": "Steelcase",
        "specs": {
            "material": "Mesh",
            "height-range": "17-21 inches",
            "warranty": "12 years",
            "weight-capacity": "300 lbs",
        },
        "amazonLink": "https://amazon.com?aff=prodbot&product=steelcaseleap",
        "sourceUrl": "https://amazon.com?aff=prodbot&product=steelcaseleap",
        "description": "Ergonomic office chair with flexible lumbar support.",
    },
]


PRICE_RE = re.compile(r"(?:\$|USD\s?)(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)")
TITLE_CLEAN_RE = re.compile(r"\s+[-|:]\s+(?:buy|review|best price).*", re.IGNORECASE)
COMMERCE_HINTS = ("buy", "price", "shop", "deal", "sale", "store")
DDGS_REGION = "ca-en"
CANADIAN_SHOPPING_DOMAINS = (
    "amazon.ca",
    "bestbuy.ca",
    "walmart.ca",
    "costco.ca",
    "canadiantire.ca",
    "thebay.com",
    "indigo.ca",
    "sportchek.ca",
    "visions.ca",
    "canadacomputers.com",
    "memoryexpress.com",
    "mec.ca",
    "well.ca",
    "sephora.com",
    "simons.ca",
    "staples.ca",
)
NOISY_RESULT_HINTS = (
    "top 10",
    "top 5",
    "best ",
    "roundup",
    "review",
    "reviews",
    "gift guide",
)
DISALLOWED_PAGE_HINTS = (
    "support",
    "rules",
    "template",
    "faq",
    "help",
    "account",
)
IGNORED_QUERY_TOKENS = {
    "buy",
    "shop",
    "for",
    "with",
    "and",
    "the",
    "under",
    "over",
    "best",
    "canada",
    "online",
}


def stable_rating(identifier: str) -> float:
    seed = int(hashlib.sha1(identifier.encode("utf-8")).hexdigest()[:2], 16)
    return round(4.1 + (seed % 9) / 10, 1)


def extract_price(text: str, identifier: str) -> float:
    match = PRICE_RE.search(text)
    if match:
        return float(match.group(1).replace(",", ""))

    seed = int(hashlib.sha1(identifier.encode("utf-8")).hexdigest()[2:6], 16)
    return float(49 + (seed % 1150))


def infer_brand(title: str, domain: str) -> str:
    cleaned = title.replace("|", " ").replace("-", " ").strip()
    tokens = [token for token in cleaned.split() if token and token[0].isalnum()]
    if tokens:
        candidate = tokens[0].strip("(),")
        if candidate and candidate[0].isupper():
            return candidate

    host = domain.split(":", 1)[0]
    root = host.split(".")
    return root[-2].capitalize() if len(root) >= 2 else host.capitalize()


def normalize_title(title: str, domain: str) -> str:
    cleaned = TITLE_CLEAN_RE.sub("", title).strip()
    if cleaned:
        return cleaned
    return domain.split(":", 1)[0]


def infer_category(query: str | None, category: str | None) -> str:
    if category:
        return CATEGORY_NAMES.get(category, category.title())

    text = (query or "").lower()
    if any(term in text for term in ("chair", "desk", "sofa", "furniture")):
        return "Furniture"
    if any(term in text for term in ("earbuds", "headphones", "drone", "watch", "speaker")):
        return "Gadgets"
    return "Tech"


def build_placeholder_image(name: str) -> str:
    return f"https://placehold.co/600x600/e8f4ea/1f2937?text={quote_plus(name[:42])}"


def is_allowed_canadian_domain(domain: str) -> bool:
    host = domain.split(":", 1)[0]
    return any(host == allowed or host.endswith(f".{allowed}") for allowed in CANADIAN_SHOPPING_DOMAINS)


def extract_query_tokens(query: str | None, category: str | None) -> list[str]:
    raw = " ".join(part for part in (query, CATEGORY_NAMES.get(category, category)) if part)
    tokens = re.findall(r"[a-z0-9]+", raw.lower())
    return [token for token in tokens if len(token) >= 3 and token not in IGNORED_QUERY_TOKENS]


def normalize_search_result(result: dict[str, Any], query: str | None, category: str | None) -> dict[str, Any] | None:
    url = result.get("href") or result.get("url")
    title = (result.get("title") or "").strip()
    body = (result.get("body") or result.get("snippet") or "").strip()

    if not url or not title:
        return None

    parsed_url = urlparse(url)
    domain = parsed_url.netloc.lower()
    if not is_allowed_canadian_domain(domain):
        return None

    haystack = f"{title} {body}".lower()
    title_and_path = f"{title} {parsed_url.path}".lower()
    if any(hint in haystack for hint in NOISY_RESULT_HINTS):
        return None
    if any(hint in title_and_path for hint in DISALLOWED_PAGE_HINTS):
        return None

    query_tokens = extract_query_tokens(query, category)
    if query_tokens:
        matched_token_count = sum(1 for token in query_tokens if token in title_and_path)
        required_token_count = min(len(query_tokens), 2)
        if matched_token_count < required_token_count:
            return None

    if not any(hint in haystack for hint in COMMERCE_HINTS) and not any(
        commerce_domain in domain
        for commerce_domain in ("amazon", "bestbuy", "walmart", "costco", "canadiantire", "indigo", "sportchek")
    ):
        return None

    identifier = hashlib.sha1(url.encode("utf-8")).hexdigest()
    normalized_title = normalize_title(title, domain)

    return {
        "id": f"search-{identifier[:12]}",
        "name": normalized_title,
        "price": extract_price(f"{title} {body}", identifier),
        "rating": stable_rating(identifier),
        "image": build_placeholder_image(normalized_title),
        "category": infer_category(query, category),
        "brand": infer_brand(normalized_title, domain),
        "specs": {
            "source": domain,
            "store": domain.split(":", 1)[0],
            "match": "DDGS search",
        },
        "amazonLink": url,
        "sourceUrl": url,
        "description": body or f"Result from {domain}",
    }


def search_ddgs_products(query: str | None, category: str | None, limit: int) -> list[dict[str, Any]]:
    if DDGS is None:
        return []

    search_terms = " ".join(
        part for part in (query, CATEGORY_NAMES.get(category, category)) if part
    ).strip()
    if not search_terms:
        return []

    normalized: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    try:
        with DDGS() as ddgs:
            for domain in CANADIAN_SHOPPING_DOMAINS:
                site_query = f"site:{domain} {search_terms}"
                try:
                    results = ddgs.text(
                        site_query,
                        region=DDGS_REGION,
                        safesearch="off",
                        max_results=4,
                    )
                except Exception:
                    continue

                for result in results:
                    product = normalize_search_result(result, query, category)
                    if not product or product["id"] in seen_ids:
                        continue
                    seen_ids.add(product["id"])
                    normalized.append(product)
                    if len(normalized) >= limit:
                        return normalized
    except Exception:
        return []

    return normalized


def filter_seed_products(query: str | None, category: str | None, limit: int) -> list[dict[str, Any]]:
    filtered = SEED_PRODUCTS

    if category:
        category_name = CATEGORY_NAMES.get(category, category).lower()
        filtered = [product for product in filtered if product["category"].lower() == category_name]

    if query:
        lowered = query.lower()
        filtered = [
            product
            for product in filtered
            if lowered in product["name"].lower()
            or lowered in product["brand"].lower()
            or lowered in product["category"].lower()
        ]

    return filtered[:limit]
