from __future__ import annotations

import hashlib
import logging
import os
import re
import time
from dataclasses import dataclass
from typing import Any
from urllib.parse import quote_plus, urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

try:
    from curl_cffi import requests as curl_requests
except Exception:  # pragma: no cover - optional import for local setup
    curl_requests = None

try:
    from ddgs import DDGS
except Exception:  # pragma: no cover - optional import for local setup
    DDGS = None


logger = logging.getLogger("prod_bot.catalog")


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


PRICE_RE = re.compile(r"(?:CDN\$|C\$|\$|USD\s?)(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)")
TITLE_CLEAN_RE = re.compile(r"\s+[-|:]\s+(?:buy|review|best price).*", re.IGNORECASE)
COMMERCE_HINTS = ("buy", "price", "shop", "deal", "sale", "store")
DDGS_REGION = "ca-en"
CANADIAN_SHOPPING_DOMAINS = ("amazon.ca",)
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
AMAZON_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-CA,en-US;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
}
AMAZON_BASE_URL = "https://www.amazon.ca"
AMAZON_PRODUCT_RE = re.compile(r"/(?:[^/]+/)?(?:dp|gp/product)/([A-Z0-9]{10})", re.IGNORECASE)
RATING_RE = re.compile(r"(\d(?:\.\d)?)\s*out of\s*5", re.IGNORECASE)
REVIEW_COUNT_RE = re.compile(r"([\d,]+)")
RETRIABLE_STATUS_CODES = {403, 429, 500, 502, 503, 504}
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


def extract_price(text: str) -> float | None:
    match = PRICE_RE.search(text)
    if match:
        return float(match.group(1).replace(",", ""))
    return None


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


def has_required_catalog_fields(product: dict[str, Any]) -> bool:
    name = str(product.get("name") or "").strip()
    description = str(product.get("description") or "").strip()
    image = str(product.get("image") or "").strip()
    price = product.get("price")

    if not name or not description or not image:
        return False
    if image.startswith("https://placehold.co/"):
        return False
    if not isinstance(price, (int, float)):
        return False
    return float(price) > 0


def amazon_response_looks_blocked(text: str) -> bool:
    lowered = text.lower()
    blocked_markers = (
        "enter the characters you see below",
        "sorry, we just need to make sure you're not a robot",
        "captcha",
        "api-services-support@amazon.com",
    )
    return any(marker in lowered for marker in blocked_markers)


def is_amazon_product_url(url: str) -> bool:
    parsed = urlparse(url)
    if not is_allowed_canadian_domain(parsed.netloc.lower()):
        return False
    return AMAZON_PRODUCT_RE.search(parsed.path) is not None


def create_http_session() -> Any:
    if curl_requests is not None:
        impersonate = os.getenv("AMAZON_IMPERSONATE", "chrome")
        session = curl_requests.Session(impersonate=impersonate)
        session.headers.update(AMAZON_HEADERS)
        logger.info("Using curl_cffi session for Amazon scraping with impersonate=%s", impersonate)
        return session

    session = requests.Session()
    retry = Retry(
        total=2,
        connect=2,
        read=2,
        backoff_factor=0.8,
        status_forcelist=sorted(RETRIABLE_STATUS_CODES),
        allowed_methods=frozenset({"GET"}),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update(AMAZON_HEADERS)
    logger.info("Using requests session with retry adapter for Amazon scraping")
    return session


def warm_amazon_session(session: Any) -> None:
    try:
        response = session.get(AMAZON_BASE_URL, timeout=10, allow_redirects=True)
        logger.info("Amazon session warmup: status=%s final_url=%s", response.status_code, response.url)
    except Exception:
        logger.exception("Amazon session warmup failed")


def fetch_with_backoff(session: Any, url: str, *, referer: str | None = None, context: str) -> Any | None:
    headers: dict[str, str] = {}
    if referer:
        headers["Referer"] = referer

    for attempt in range(1, 4):
        try:
            response = session.get(url, timeout=12, allow_redirects=True, headers=headers or None)
            logger.info(
                "%s response: url=%s status=%s final_url=%s attempt=%s",
                context,
                url,
                response.status_code,
                response.url,
                attempt,
            )
            if response.status_code in RETRIABLE_STATUS_CODES and attempt < 3:
                sleep_seconds = 0.8 * attempt
                logger.warning(
                    "%s got retriable status=%s for url=%s; sleeping %.1fs before retry",
                    context,
                    response.status_code,
                    url,
                    sleep_seconds,
                )
                time.sleep(sleep_seconds)
                continue
            response.raise_for_status()
            return response
        except Exception:
            if attempt < 3:
                sleep_seconds = 0.8 * attempt
                logger.exception(
                    "%s request failed for url=%s on attempt=%s; retrying after %.1fs",
                    context,
                    url,
                    attempt,
                    sleep_seconds,
                )
                time.sleep(sleep_seconds)
                continue
            logger.exception("%s request failed for url=%s after %s attempts", context, url, attempt)
            return None

    return None


def extract_review_count(text: str) -> int:
    match = REVIEW_COUNT_RE.search(text or "")
    if not match:
        return 0
    try:
        return int(match.group(1).replace(",", ""))
    except ValueError:
        return 0


def parse_rating(text: str | None, fallback_key: str) -> float:
    rating_match = RATING_RE.search(text or "")
    if rating_match:
        return float(rating_match.group(1))
    return stable_rating(fallback_key)


def clean_brand_text(text: str) -> str:
    normalized = text.replace("Brand:", "").replace("Visit the", "").replace("Store", "")
    normalized = " ".join(normalized.split()).strip(" -:")
    return normalized


def normalize_amazon_url(url: str) -> str:
    parsed = urlparse(url)
    asin_match = AMAZON_PRODUCT_RE.search(parsed.path)
    if asin_match:
        return f"https://www.amazon.ca/dp/{asin_match.group(1).upper()}"
    return url


def extract_amazon_image(html: str, soup: BeautifulSoup) -> str | None:
    og_image = soup.find("meta", attrs={"property": "og:image"})
    if og_image and og_image.get("content"):
        return og_image["content"]

    for key in ("landingImageUrl", "hiRes", "large"):
        marker = f'"{key}":"'
        if marker in html:
            fragment = html.split(marker, 1)[1].split('"', 1)[0]
            if fragment:
                return fragment.replace("\\u0026", "&").replace("\\/", "/")

    image_tag = soup.select_one("#landingImage")
    if image_tag and image_tag.get("src"):
        return image_tag["src"]
    return None


def extract_amazon_description(soup: BeautifulSoup, fallback: str) -> str:
    bullets: list[str] = []
    for item in soup.select("#feature-bullets li span.a-list-item"):
        text = " ".join(item.get_text(" ", strip=True).split())
        if text and text not in bullets and len(text) > 10:
            bullets.append(text)
        if len(bullets) >= 4:
            break

    if bullets:
        return " ".join(bullets)

    description = soup.select_one("#productDescription")
    if description:
        text = " ".join(description.get_text(" ", strip=True).split())
        if text:
            return text

    og_description = soup.find("meta", attrs={"property": "og:description"})
    if og_description and og_description.get("content"):
        return og_description["content"].strip()

    return fallback.strip()


def extract_amazon_reviews(soup: BeautifulSoup, limit: int = 3) -> list[str]:
    reviews: list[str] = []
    for node in soup.select('[data-hook="review-body"] span'):
        text = " ".join(node.get_text(" ", strip=True).split())
        if text and text not in reviews and len(text) > 20:
            reviews.append(text)
        if len(reviews) >= limit:
            break
    return reviews


def scrape_amazon_product(
    session: requests.Session,
    url: str,
    fallback_title: str,
    fallback_body: str,
    query: str | None,
    category: str | None,
) -> dict[str, Any] | None:
    if not is_amazon_product_url(url):
        logger.warning("Skipping non-product Amazon URL during product scrape: url=%s", url)
        return None

    logger.info("Fetching Amazon product page: url=%s", url)
    response = fetch_with_backoff(
        session,
        url,
        referer=AMAZON_BASE_URL,
        context="Amazon product",
    )
    if response is None:
        return None

    html = response.text
    if amazon_response_looks_blocked(html):
        logger.warning("Amazon product page looks blocked or captcha-protected: url=%s", response.url)
        return None

    soup = BeautifulSoup(html, "html.parser")
    final_url = normalize_amazon_url(str(response.url))
    final_domain = urlparse(final_url).netloc.lower()
    if not is_allowed_canadian_domain(final_domain):
        logger.warning("Amazon product page redirected to a disallowed domain: url=%s domain=%s", final_url, final_domain)
        return None

    title_node = soup.select_one("#productTitle")
    rating_node = soup.select_one("[data-hook='rating-out-of-text']") or soup.select_one(".a-icon-alt")
    review_count_node = soup.select_one("#acrCustomerReviewText") or soup.select_one("[data-hook='total-review-count']")
    price_node = soup.select_one(".a-price .a-offscreen") or soup.select_one("#corePrice_feature_div .a-offscreen")
    brand_node = soup.select_one("#bylineInfo")

    title = " ".join(title_node.get_text(" ", strip=True).split()) if title_node else fallback_title
    rating_text = rating_node.get_text(" ", strip=True) if rating_node else ""
    review_count_text = review_count_node.get_text(" ", strip=True) if review_count_node else ""
    price_text = price_node.get_text(" ", strip=True) if price_node else fallback_body
    brand_text = brand_node.get_text(" ", strip=True) if brand_node else ""
    description = extract_amazon_description(soup, fallback_body)
    reviews = extract_amazon_reviews(soup)
    image = extract_amazon_image(html, soup)
    price = extract_price(price_text or fallback_body)

    identifier = hashlib.sha1(final_url.encode("utf-8")).hexdigest()
    asin_match = AMAZON_PRODUCT_RE.search(urlparse(final_url).path)

    product = {
        "id": f"search-{identifier[:12]}",
        "name": normalize_title(title or fallback_title, final_domain),
        "price": price,
        "rating": parse_rating(rating_text, identifier),
        "reviewCount": extract_review_count(review_count_text),
        "reviews": reviews,
        "image": image,
        "category": infer_category(query, category),
        "brand": clean_brand_text(brand_text) or infer_brand(title, final_domain),
        "specs": {
            "source": final_domain,
            "store": "amazon.ca",
            "match": "Amazon.ca search",
            "asin": asin_match.group(1).upper() if asin_match else "",
        },
        "amazonLink": final_url,
        "sourceUrl": final_url,
        "description": description or fallback_body or f"Result from {final_domain}",
    }
    if has_required_catalog_fields(product):
        logger.info(
            "Amazon product page parsed successfully: asin=%s price=%s has_image=%s description_len=%s",
            product["specs"].get("asin", ""),
            product["price"],
            bool(product["image"]),
            len(str(product["description"])),
        )
        return product

    logger.warning(
        "Amazon product page missing required fields: asin=%s has_name=%s price=%s has_image=%s description_len=%s",
        product["specs"].get("asin", ""),
        bool(product.get("name")),
        product.get("price"),
        bool(product.get("image")),
        len(str(product.get("description") or "")),
    )
    return None


def is_allowed_canadian_domain(domain: str) -> bool:
    host = domain.split(":", 1)[0]
    return any(host == allowed or host.endswith(f".{allowed}") for allowed in CANADIAN_SHOPPING_DOMAINS)


def extract_query_tokens(query: str | None, category: str | None) -> list[str]:
    raw = " ".join(part for part in (query, CATEGORY_NAMES.get(category, category)) if part)
    tokens = re.findall(r"[a-z0-9]+", raw.lower())
    return [token for token in tokens if len(token) >= 3 and token not in IGNORED_QUERY_TOKENS]


def parse_search_result_price(card: BeautifulSoup) -> float | None:
    price_node = card.select_one(".a-price .a-offscreen")
    if price_node:
        text = price_node.get_text(" ", strip=True)
        if text:
            return extract_price(text)

    whole = card.select_one(".a-price-whole")
    fraction = card.select_one(".a-price-fraction")
    if whole:
        price_text = whole.get_text("", strip=True).replace(",", "")
        if fraction:
            price_text = f"{price_text}.{fraction.get_text('', strip=True)}"
        try:
            return float(price_text)
        except ValueError:
            pass

    return None


def parse_search_result_review_count(card: BeautifulSoup) -> int:
    selectors = (
        ".a-row.a-size-small .s-underline-text",
        ".a-size-base.s-underline-text",
        "[aria-label$='ratings']",
    )
    for selector in selectors:
        node = card.select_one(selector)
        if node:
            count = extract_review_count(node.get_text(" ", strip=True))
            if count:
                return count
    return 0


def parse_search_result_brand(title: str) -> str:
    separators = (" | ", " - ", ",")
    for separator in separators:
        if separator in title:
            prefix = title.split(separator, 1)[0].strip()
            if prefix and len(prefix.split()) <= 4:
                return prefix
    return infer_brand(title, "amazon.ca")


def normalize_search_card(
    session: requests.Session,
    card: BeautifulSoup,
    query: str | None,
    category: str | None,
) -> dict[str, Any] | None:
    asin = (card.get("data-asin") or "").strip().upper()
    if not asin or not re.fullmatch(r"[A-Z0-9]{10}", asin):
        return None

    title_node = card.select_one("h2 a span") or card.select_one("h2 span")
    link_node = card.select_one("h2 a")
    image_node = card.select_one("img.s-image")
    rating_node = card.select_one(".a-icon-alt")
    subtitle_node = card.select_one(".a-color-secondary")

    title = " ".join(title_node.get_text(" ", strip=True).split()) if title_node else ""
    if not title:
        return None

    product_url = urljoin(AMAZON_BASE_URL, link_node.get("href", f"/dp/{asin}")) if link_node else f"{AMAZON_BASE_URL}/dp/{asin}"
    normalized_url = normalize_amazon_url(product_url)
    image = image_node.get("src") if image_node and image_node.get("src") else ""
    review_count = parse_search_result_review_count(card)
    description = ""
    if subtitle_node:
        description = " ".join(subtitle_node.get_text(" ", strip=True).split())

    product = {
        "id": f"search-{asin.lower()}",
        "name": title,
        "price": parse_search_result_price(card),
        "rating": parse_rating(rating_node.get_text(" ", strip=True) if rating_node else "", asin),
        "reviewCount": review_count,
        "reviews": [],
        "image": image,
        "category": infer_category(query, category),
        "brand": parse_search_result_brand(title),
        "specs": {
            "source": "www.amazon.ca",
            "store": "amazon.ca",
            "match": "Amazon.ca search results",
            "asin": asin,
        },
        "amazonLink": normalized_url,
        "sourceUrl": normalized_url,
        "description": description,
    }

    if has_required_catalog_fields(product):
        logger.info(
            "Amazon search card accepted directly: asin=%s price=%s has_image=%s description_len=%s",
            asin,
            product["price"],
            bool(product["image"]),
            len(product["description"]),
        )
        return product

    logger.info(
        "Amazon search card incomplete, trying product page enrichment: asin=%s price=%s has_image=%s description_len=%s",
        asin,
        product["price"],
        bool(product["image"]),
        len(product["description"]),
    )

    scraped = scrape_amazon_product(
        session,
        normalized_url,
        title,
        description,
        query,
        category,
    )
    if scraped is not None:
        logger.info("Amazon search card recovered via product page enrichment: asin=%s", asin)
        return {
            **product,
            **scraped,
            "id": product["id"],
            "specs": {
                **product.get("specs", {}),
                **scraped.get("specs", {}),
            },
        }

    logger.warning("Amazon search card skipped after failed enrichment: asin=%s", asin)
    return None


def scrape_amazon_search_results(query: str | None, category: str | None, limit: int) -> list[dict[str, Any]]:
    search_terms = " ".join(
        part for part in (query, CATEGORY_NAMES.get(category, category)) if part
    ).strip()
    if not search_terms:
        return []

    session = create_http_session()
    warm_amazon_session(session)

    collected: list[dict[str, Any]] = []
    seen_asins: set[str] = set()

    logger.info("Starting Amazon search scrape: query=%r category=%r limit=%s", query, category, limit)

    for page in (1, 2):
        search_url = f"{AMAZON_BASE_URL}/s?k={quote_plus(search_terms)}&page={page}"
        response = fetch_with_backoff(
            session,
            search_url,
            referer=AMAZON_BASE_URL,
            context="Amazon search",
        )
        if response is None:
            break

        if amazon_response_looks_blocked(response.text):
            logger.warning("Amazon search page looks blocked or captcha-protected: url=%s", search_url)
            break

        soup = BeautifulSoup(response.text, "html.parser")
        cards = soup.select('[data-component-type="s-search-result"]')
        logger.info("Amazon search page parsed: page=%s cards=%s", page, len(cards))
        if not cards:
            continue

        for card in cards:
            product = normalize_search_card(session, card, query, category)
            if not product:
                continue

            asin = str(product["specs"].get("asin", ""))
            if not asin or asin in seen_asins:
                continue

            seen_asins.add(asin)
            collected.append(product)
            if len(collected) >= limit:
                logger.info("Amazon search scrape reached limit with %s complete products", len(collected))
                return collected

    logger.info("Amazon search scrape finished with %s complete products", len(collected))
    return collected


def refresh_products_from_amazon(products: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not products:
        return []

    session = create_http_session()
    warm_amazon_session(session)

    refreshed_products: list[dict[str, Any]] = []
    for product in products:
        amazon_url = str(product.get("amazonLink") or product.get("sourceUrl") or "").strip()
        if not amazon_url:
            refreshed_products.append(product)
            continue

        scraped = scrape_amazon_product(
            session,
            amazon_url,
            str(product.get("name") or ""),
            str(product.get("description") or ""),
            None,
            None,
        )
        if not scraped:
            refreshed_products.append(product)
            continue

        refreshed_products.append(
            {
                **product,
                **scraped,
                "id": product.get("id", scraped.get("id", "")),
                "category": product.get("category") or scraped.get("category", "Tech"),
                "specs": {
                    **product.get("specs", {}),
                    **scraped.get("specs", {}),
                },
            }
        )

    return refreshed_products


def normalize_search_result(
    result: dict[str, Any],
    query: str | None,
    category: str | None,
    session: requests.Session,
) -> dict[str, Any] | None:
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

    if "amazon" not in domain and not any(hint in haystack for hint in COMMERCE_HINTS):
        return None

    normalized_url = normalize_amazon_url(url)
    if not is_amazon_product_url(normalized_url):
        logger.info("Skipping DDGS result because it is not a direct Amazon product URL: url=%s", normalized_url)
        return None

    scraped = scrape_amazon_product(session, normalized_url, title, body, query, category)
    if scraped is not None:
        return scraped
    return None


def search_ddgs_products(query: str | None, category: str | None, limit: int) -> list[dict[str, Any]]:
    if DDGS is None:
        logger.warning("DDGS is unavailable; cannot use search fallback")
        return []

    direct_results = scrape_amazon_search_results(query, category, limit)
    if direct_results:
        logger.info("Using direct Amazon search results with %s products", len(direct_results))
        return direct_results

    logger.warning("Direct Amazon search returned no complete products; falling back to DDGS")

    search_terms = " ".join(
        part for part in (query, CATEGORY_NAMES.get(category, category)) if part
    ).strip()
    if not search_terms:
        return []

    normalized: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    session = create_http_session()
    warm_amazon_session(session)

    try:
        with DDGS() as ddgs:
            site_query = f"site:amazon.ca {search_terms}"
            try:
                logger.info("Starting DDGS fallback query: %r", site_query)
                results = ddgs.text(
                    site_query,
                    region=DDGS_REGION,
                    safesearch="off",
                    max_results=max(limit * 3, 12),
                )
            except Exception:
                logger.exception("DDGS fallback query failed: %r", site_query)
                return []

            for result in results:
                product = normalize_search_result(result, query, category, session)
                if not product or product["id"] in seen_ids:
                    continue
                seen_ids.add(product["id"])
                normalized.append(product)
                if len(normalized) >= limit:
                    logger.info("DDGS fallback produced %s complete products", len(normalized))
                    return normalized
    except Exception:
        logger.exception("DDGS fallback failed unexpectedly")
        return []

    logger.info("DDGS fallback finished with %s complete products", len(normalized))
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
