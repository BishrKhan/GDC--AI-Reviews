from __future__ import annotations

import json
import os
import sqlite3
import time
from contextlib import closing
from pathlib import Path
from typing import Any

import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.catalog import CATEGORIES, SEED_PRODUCTS, search_ddgs_products


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "prod_bot.sqlite3"
CACHE_TTL_SECONDS = 60 * 30
SEARCH_CACHE_VERSION = "amazon-ca-v4-direct-search"
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


class Product(BaseModel):
    id: str
    name: str
    price: float
    rating: float
    image: str
    category: str
    brand: str
    specs: dict[str, Any] = Field(default_factory=dict)
    amazonLink: str
    sourceUrl: str
    description: str = ""
    reviewCount: int = 0
    reviews: list[str] = Field(default_factory=list)


class ComparisonResult(BaseModel):
    products: list[Product]
    winner: str
    scores: dict[str, int]
    insights: list[str]
    facts: int


class UserProfile(BaseModel):
    id: str
    email: str | None = None
    name: str | None = None
    dob: str | None = None
    gender: str | None = None
    interests: list[str] = Field(default_factory=list)
    isGuest: bool = True


class ChatMessage(BaseModel):
    id: str
    role: str
    content: str
    timestamp: int


class ChatThread(BaseModel):
    id: str
    title: str
    messages: list[ChatMessage]
    createdAt: int
    updatedAt: int


class UserState(BaseModel):
    user: UserProfile
    wishlist: list[str]
    threads: list[ChatThread]


class UserUpdateRequest(BaseModel):
    email: str | None = None
    name: str | None = None
    dob: str | None = None
    gender: str | None = None
    interests: list[str] = Field(default_factory=list)
    isGuest: bool = True


class CompareRequest(BaseModel):
    product_ids: list[str] = Field(default_factory=list)


class ChatRequest(BaseModel):
    thread_id: str | None = None
    title: str | None = None
    message: str
    selected_product_ids: list[str] = Field(default_factory=list)
    interests: list[str] = Field(default_factory=list)


class ChatResponse(BaseModel):
    assistant_message: str
    thread: ChatThread
    products: list[Product] = Field(default_factory=list)
    comparison: ComparisonResult | None = None


app = FastAPI(title="PROD-BOT MVP API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def now_ms() -> int:
    return int(time.time() * 1000)


def connect_db() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with closing(connect_db()) as connection:
        cursor = connection.cursor()
        cursor.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT,
                name TEXT,
                dob TEXT,
                gender TEXT,
                interests_json TEXT NOT NULL DEFAULT '[]',
                is_guest INTEGER NOT NULL DEFAULT 1,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                rating REAL NOT NULL,
                image TEXT NOT NULL,
                category TEXT NOT NULL,
                brand TEXT NOT NULL,
                specs_json TEXT NOT NULL DEFAULT '{}',
                amazon_link TEXT NOT NULL,
                source_url TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                updated_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS wishlist (
                user_id TEXT NOT NULL,
                product_id TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                PRIMARY KEY (user_id, product_id)
            );

            CREATE TABLE IF NOT EXISTS chat_threads (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY,
                thread_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS search_cache (
                cache_key TEXT PRIMARY KEY,
                results_json TEXT NOT NULL,
                created_at INTEGER NOT NULL
            );
            """
        )
        product_columns = {
            row["name"] for row in connection.execute("PRAGMA table_info(products)").fetchall()
        }
        if "review_count" not in product_columns:
            connection.execute(
                "ALTER TABLE products ADD COLUMN review_count INTEGER NOT NULL DEFAULT 0"
            )
        if "reviews_json" not in product_columns:
            connection.execute(
                "ALTER TABLE products ADD COLUMN reviews_json TEXT NOT NULL DEFAULT '[]'"
            )
        connection.commit()
        seed_products(connection)


@app.on_event("startup")
def handle_startup() -> None:
    init_db()


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": "PROD-BOT MVP API",
        "status": "ok",
        "frontend": "http://localhost:3000",
        "health": "/api/health",
        "docs": "/docs",
    }


def seed_products(connection: sqlite3.Connection) -> None:
    cursor = connection.execute("SELECT COUNT(*) AS count FROM products")
    if cursor.fetchone()["count"] > 0:
        return

    for product in SEED_PRODUCTS:
        upsert_product(connection, product)
    connection.commit()


def ensure_user(connection: sqlite3.Connection, user_id: str) -> sqlite3.Row:
    row = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if row:
        return row

    timestamp = now_ms()
    connection.execute(
        """
        INSERT INTO users (id, interests_json, is_guest, created_at, updated_at)
        VALUES (?, '[]', 1, ?, ?)
        """,
        (user_id, timestamp, timestamp),
    )
    connection.commit()
    return connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


def row_to_product(row: sqlite3.Row) -> Product:
    return Product(
        id=row["id"],
        name=row["name"],
        price=row["price"],
        rating=row["rating"],
        image=row["image"],
        category=row["category"],
        brand=row["brand"],
        specs=json.loads(row["specs_json"] or "{}"),
        amazonLink=row["amazon_link"],
        sourceUrl=row["source_url"],
        description=row["description"] or "",
        reviewCount=row["review_count"] if "review_count" in row.keys() else 0,
        reviews=json.loads(row["reviews_json"] or "[]") if "reviews_json" in row.keys() else [],
    )


def row_to_user(row: sqlite3.Row) -> UserProfile:
    return UserProfile(
        id=row["id"],
        email=row["email"],
        name=row["name"],
        dob=row["dob"],
        gender=row["gender"],
        interests=json.loads(row["interests_json"] or "[]"),
        isGuest=bool(row["is_guest"]),
    )


def upsert_product(connection: sqlite3.Connection, product: dict[str, Any]) -> None:
    connection.execute(
        """
        INSERT INTO products (
            id, name, price, rating, image, category, brand,
            specs_json, amazon_link, source_url, description, review_count, reviews_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            price = excluded.price,
            rating = excluded.rating,
            image = excluded.image,
            category = excluded.category,
            brand = excluded.brand,
            specs_json = excluded.specs_json,
            amazon_link = excluded.amazon_link,
            source_url = excluded.source_url,
            description = excluded.description,
            review_count = excluded.review_count,
            reviews_json = excluded.reviews_json,
            updated_at = excluded.updated_at
        """,
        (
            product["id"],
            product["name"],
            float(product["price"]),
            float(product["rating"]),
            product["image"],
            product["category"],
            product["brand"],
            json.dumps(product.get("specs", {})),
            product["amazonLink"],
            product.get("sourceUrl", product["amazonLink"]),
            product.get("description", ""),
            int(product.get("reviewCount", 0)),
            json.dumps(product.get("reviews", [])),
            now_ms(),
        ),
    )


def get_products_by_ids(connection: sqlite3.Connection, product_ids: list[str]) -> list[Product]:
    if not product_ids:
        return []

    placeholders = ",".join("?" for _ in product_ids)
    rows = connection.execute(
        f"SELECT * FROM products WHERE id IN ({placeholders})",
        product_ids,
    ).fetchall()
    by_id = {row["id"]: row_to_product(row) for row in rows}
    return [by_id[product_id] for product_id in product_ids if product_id in by_id]


def load_cached_results(connection: sqlite3.Connection, cache_key: str) -> list[Product] | None:
    row = connection.execute(
        "SELECT results_json, created_at FROM search_cache WHERE cache_key = ?",
        (cache_key,),
    ).fetchone()
    if not row:
        return None
    if now_ms() - row["created_at"] > CACHE_TTL_SECONDS * 1000:
        return None
    return [Product(**item) for item in json.loads(row["results_json"])]


def save_cached_results(connection: sqlite3.Connection, cache_key: str, products: list[Product]) -> None:
    connection.execute(
        """
        INSERT INTO search_cache (cache_key, results_json, created_at)
        VALUES (?, ?, ?)
        ON CONFLICT(cache_key) DO UPDATE SET
            results_json = excluded.results_json,
            created_at = excluded.created_at
        """,
        (cache_key, json.dumps([product.model_dump() for product in products]), now_ms()),
    )
    connection.commit()


def search_products(connection: sqlite3.Connection, query: str | None, category: str | None, limit: int) -> list[Product]:
    cache_key = json.dumps(
        {
            "version": SEARCH_CACHE_VERSION,
            "query": query or "",
            "category": category or "",
            "limit": limit,
        },
        sort_keys=True,
    )
    cached = load_cached_results(connection, cache_key)
    if cached is not None:
        return cached

    results = search_ddgs_products(query, category, limit)
    products = [Product(**item) for item in results[:limit]]
    for product in products:
        upsert_product(connection, product.model_dump())
    connection.commit()
    save_cached_results(connection, cache_key, products)
    return products


def load_threads(connection: sqlite3.Connection, user_id: str) -> list[ChatThread]:
    thread_rows = connection.execute(
        "SELECT * FROM chat_threads WHERE user_id = ? ORDER BY updated_at DESC",
        (user_id,),
    ).fetchall()

    threads: list[ChatThread] = []
    for thread_row in thread_rows:
        message_rows = connection.execute(
            "SELECT * FROM chat_messages WHERE thread_id = ? ORDER BY timestamp ASC",
            (thread_row["id"],),
        ).fetchall()
        messages = [
            ChatMessage(
                id=message_row["id"],
                role=message_row["role"],
                content=message_row["content"],
                timestamp=message_row["timestamp"],
            )
            for message_row in message_rows
        ]
        threads.append(
            ChatThread(
                id=thread_row["id"],
                title=thread_row["title"],
                messages=messages,
                createdAt=thread_row["created_at"],
                updatedAt=thread_row["updated_at"],
            )
        )
    return threads


def get_or_create_thread(connection: sqlite3.Connection, user_id: str, thread_id: str | None, title: str | None) -> ChatThread:
    if thread_id:
        row = connection.execute(
            "SELECT * FROM chat_threads WHERE id = ? AND user_id = ?",
            (thread_id, user_id),
        ).fetchone()
        if row:
            return next(thread for thread in load_threads(connection, user_id) if thread.id == thread_id)

    resolved_thread_id = thread_id or f"thread-{now_ms()}"
    conflicting_row = connection.execute(
        "SELECT user_id FROM chat_threads WHERE id = ?",
        (resolved_thread_id,),
    ).fetchone()
    if conflicting_row and conflicting_row["user_id"] != user_id:
        resolved_thread_id = f"thread-{now_ms()}"

    timestamp = now_ms()
    resolved_title = title or "Shopping Assistant"
    connection.execute(
        """
        INSERT OR IGNORE INTO chat_threads (id, user_id, title, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (resolved_thread_id, user_id, resolved_title, timestamp, timestamp),
    )
    connection.commit()
    return next(thread for thread in load_threads(connection, user_id) if thread.id == resolved_thread_id)


def save_message(connection: sqlite3.Connection, thread_id: str, role: str, content: str) -> ChatMessage:
    message = ChatMessage(
        id=f"msg-{now_ms()}-{role}",
        role=role,
        content=content,
        timestamp=now_ms(),
    )
    connection.execute(
        "INSERT INTO chat_messages (id, thread_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)",
        (message.id, thread_id, message.role, message.content, message.timestamp),
    )
    connection.execute(
        "UPDATE chat_threads SET updated_at = ? WHERE id = ?",
        (message.timestamp, thread_id),
    )
    connection.commit()
    return message


def build_comparison(products: list[Product]) -> ComparisonResult:
    if not products:
        return ComparisonResult(products=[], winner="", scores={}, insights=[], facts=0)

    scores: dict[str, int] = {}
    winner = products[0].id
    best_score = -1

    for product in products:
        price_score = max(0, 100 - int(product.price / 20))
        rating_score = int(product.rating * 20)
        review_score = min(100, int(product.reviewCount / 50))
        score = int(price_score * 0.25 + rating_score * 0.55 + review_score * 0.20)
        scores[product.id] = score
        if score > best_score:
            best_score = score
            winner = product.id

    winner_name = next((product.name for product in products if product.id == winner), "This product")
    insights = [
        f"{winner_name} offers the strongest overall mix of rating, review depth, and price.",
        f"Price range: ${min(product.price for product in products):.0f} - ${max(product.price for product in products):.0f}",
        f"Average rating: {(sum(product.rating for product in products) / len(products)):.1f}/5",
        f"Review count range: {min(product.reviewCount for product in products)} - {max(product.reviewCount for product in products)}",
    ]

    return ComparisonResult(
        products=products,
        winner=winner,
        scores=scores,
        insights=insights,
        facts=len(products) * 12,
    )


def infer_search_query(message: str) -> str:
    lowered = message.lower().strip()
    for prefix in ("find", "search", "show me", "look for", "i need", "i want", "recommend"):
        if lowered.startswith(prefix):
            return message[len(prefix):].strip() or message
    return message.strip()


def build_product_context(products: list[Product]) -> str:
    sections: list[str] = []
    for product in products:
        reviews = " | ".join(product.reviews[:3]) if product.reviews else "No review snippets captured."
        sections.append(
            "\n".join(
                [
                    f"Product: {product.name}",
                    f"Brand: {product.brand}",
                    f"Price: ${product.price:.2f}",
                    f"Rating: {product.rating:.1f}/5 from {product.reviewCount} reviews",
                    f"Description: {product.description or 'No description available.'}",
                    f"Review snippets: {reviews}",
                    f"Specs: {json.dumps(product.specs)}",
                    f"Amazon URL: {product.amazonLink}",
                ]
            )
        )
    return "\n\n".join(sections)


def groq_chat(message: str, products: list[Product]) -> str | None:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None

    system_prompt = (
        "You are a concise shopping advisor. Use only the provided Amazon.ca product context. "
        "Help the user choose between products by comparing tradeoffs, reviews, rating strength, and fit for needs. "
        "If evidence is missing, say so plainly. Keep it short and decision-oriented."
    )
    payload = {
        "model": GROQ_MODEL,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Context:\n{build_product_context(products)}\n\nQuestion: {message}"},
        ],
    }

    try:
        response = requests.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=25,
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return None


def build_selected_product_response(message: str, products: list[Product]) -> str:
    llm_response = groq_chat(message, products)
    if llm_response:
        return llm_response

    highest_rated = max(products, key=lambda product: (product.rating, product.reviewCount))
    most_reviewed = max(products, key=lambda product: product.reviewCount)
    return (
        f"For the selected products, {highest_rated.name} has the strongest rating signal, while "
        f"{most_reviewed.name} has the most review volume. Ask me to compare comfort, value, pros/cons, "
        "or which one fits your budget and priorities best."
    )


def generate_chat_response(
    connection: sqlite3.Connection,
    message: str,
    selected_product_ids: list[str],
    interests: list[str],
) -> tuple[str, list[Product], ComparisonResult | None]:
    lowered = message.lower()

    if selected_product_ids:
        products = get_products_by_ids(connection, selected_product_ids)
        if products:
            comparison = build_comparison(products) if len(products) >= 2 else None
            return build_selected_product_response(message, products), products, comparison

    if any(keyword in lowered for keyword in ("compare", "versus", " vs ")) and len(selected_product_ids) >= 2:
        products = get_products_by_ids(connection, selected_product_ids)
        comparison = build_comparison(products)
        winner_name = next((product.name for product in products if product.id == comparison.winner), "that option")
        response = (
            f"I compared {len(products)} products. {winner_name} came out on top based on rating and value. "
            "Open the comparison view to inspect the detailed breakdown."
        )
        return response, products, comparison

    search_query = infer_search_query(message)
    category = interests[0] if interests else None
    products = search_products(connection, search_query, category, 10)

    if products:
        top_names = ", ".join(product.name for product in products[:3])
        response = (
            f"I found {len(products)} Amazon.ca products that match \"{search_query}\". "
            f"Strong candidates are {top_names}."
        )
        return response, products, None

    response = "I could not find a good match yet. Try naming the product type, budget, or brand you want."
    return response, [], None


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/meta/categories")
def get_categories() -> list[dict[str, str]]:
    return [{"id": category.id, "name": category.name, "icon": category.icon} for category in CATEGORIES]


@app.get("/api/products/trending", response_model=list[Product])
def get_trending_products(limit: int = Query(default=8, ge=1, le=24)) -> list[Product]:
    with closing(connect_db()) as connection:
        rows = connection.execute(
            "SELECT * FROM products ORDER BY updated_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
        if not rows:
            return [Product(**product) for product in SEED_PRODUCTS[:limit]]
        return [row_to_product(row) for row in rows]


@app.get("/api/products/search", response_model=list[Product])
def search_products_endpoint(
    query: str | None = Query(default=None),
    category: str | None = Query(default=None),
    limit: int = Query(default=8, ge=1, le=24),
) -> list[Product]:
    with closing(connect_db()) as connection:
        return search_products(connection, query, category, limit)


@app.get("/api/products/by-ids", response_model=list[Product])
def get_products_by_ids_endpoint(ids: str = Query(default="")) -> list[Product]:
    product_ids = [item for item in ids.split(",") if item]
    with closing(connect_db()) as connection:
        return get_products_by_ids(connection, product_ids)


@app.post("/api/products/compare", response_model=ComparisonResult)
def compare_products_endpoint(request: CompareRequest) -> ComparisonResult:
    with closing(connect_db()) as connection:
        products = get_products_by_ids(connection, request.product_ids)
        return build_comparison(products)


@app.get("/api/users/{user_id}/state", response_model=UserState)
def get_user_state(user_id: str) -> UserState:
    with closing(connect_db()) as connection:
        user_row = ensure_user(connection, user_id)
        wishlist_rows = connection.execute(
            "SELECT product_id FROM wishlist WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
        return UserState(
            user=row_to_user(user_row),
            wishlist=[row["product_id"] for row in wishlist_rows],
            threads=load_threads(connection, user_id),
        )


@app.put("/api/users/{user_id}", response_model=UserProfile)
def update_user(user_id: str, request: UserUpdateRequest) -> UserProfile:
    with closing(connect_db()) as connection:
        ensure_user(connection, user_id)
        connection.execute(
            """
            UPDATE users
            SET email = ?, name = ?, dob = ?, gender = ?, interests_json = ?, is_guest = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                request.email,
                request.name,
                request.dob,
                request.gender,
                json.dumps(request.interests),
                1 if request.isGuest else 0,
                now_ms(),
                user_id,
            ),
        )
        connection.commit()
        row = connection.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return row_to_user(row)


@app.get("/api/users/{user_id}/wishlist", response_model=list[str])
def get_wishlist(user_id: str) -> list[str]:
    with closing(connect_db()) as connection:
        ensure_user(connection, user_id)
        rows = connection.execute(
            "SELECT product_id FROM wishlist WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
        return [row["product_id"] for row in rows]


@app.post("/api/users/{user_id}/wishlist/{product_id}")
def add_wishlist_item(user_id: str, product_id: str) -> dict[str, str]:
    with closing(connect_db()) as connection:
        ensure_user(connection, user_id)
        product = get_products_by_ids(connection, [product_id])
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        connection.execute(
            "INSERT OR IGNORE INTO wishlist (user_id, product_id, created_at) VALUES (?, ?, ?)",
            (user_id, product_id, now_ms()),
        )
        connection.commit()
        return {"status": "ok"}


@app.delete("/api/users/{user_id}/wishlist/{product_id}")
def remove_wishlist_item(user_id: str, product_id: str) -> dict[str, str]:
    with closing(connect_db()) as connection:
        connection.execute(
            "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?",
            (user_id, product_id),
        )
        connection.commit()
        return {"status": "ok"}


@app.post("/api/users/{user_id}/chat", response_model=ChatResponse)
def chat_with_bot(user_id: str, request: ChatRequest) -> ChatResponse:
    with closing(connect_db()) as connection:
        ensure_user(connection, user_id)
        thread = get_or_create_thread(connection, user_id, request.thread_id, request.title)
        save_message(connection, thread.id, "user", request.message)
        assistant_message, products, comparison = generate_chat_response(
            connection,
            request.message,
            request.selected_product_ids,
            request.interests,
        )
        save_message(connection, thread.id, "assistant", assistant_message)
        refreshed_thread = next(item for item in load_threads(connection, user_id) if item.id == thread.id)
        return ChatResponse(
            assistant_message=assistant_message,
            thread=refreshed_thread,
            products=products,
            comparison=comparison,
        )


@app.delete("/api/users/{user_id}/threads/{thread_id}")
def delete_thread(user_id: str, thread_id: str) -> dict[str, str]:
    with closing(connect_db()) as connection:
        connection.execute("DELETE FROM chat_messages WHERE thread_id = ?", (thread_id,))
        connection.execute("DELETE FROM chat_threads WHERE id = ? AND user_id = ?", (thread_id, user_id))
        connection.commit()
        return {"status": "ok"}