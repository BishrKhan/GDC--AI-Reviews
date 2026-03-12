from __future__ import annotations

from functools import lru_cache
import json
import logging
import os
from time import perf_counter
from tempfile import TemporaryDirectory
from typing import Any, Sequence

from dotenv import load_dotenv

load_dotenv()

try:
    from langchain_chroma import Chroma
    from langchain_core.documents import Document
    from langchain_core.output_parsers import StrOutputParser
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_groq import ChatGroq
    from langchain_huggingface import HuggingFaceEmbeddings
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    LANGCHAIN_IMPORT_ERROR: Exception | None = None
except Exception as exc:
    Chroma = None
    Document = Any
    StrOutputParser = None
    ChatPromptTemplate = None
    ChatGroq = None
    HuggingFaceEmbeddings = None
    RecursiveCharacterTextSplitter = None
    LANGCHAIN_IMPORT_ERROR = exc


logger = logging.getLogger("prod_bot.langchain_flow")


@lru_cache(maxsize=1)
def get_embeddings(model_name: str):
    logger.info("Loading embeddings model into process cache: %s", model_name)
    return HuggingFaceEmbeddings(model_name=model_name)


def _build_review_documents(products: Sequence[dict[str, Any]]):
    documents: list[Document] = []
    for product in products:
        reviews = product.get("reviews") or []
        for index, review in enumerate(reviews, start=1):
            text = str(review).strip()
            if not text:
                continue
            documents.append(
                Document(
                    page_content=text,
                    metadata={
                        "product_id": product.get("id", ""),
                        "product_name": product.get("name", "Unknown product"),
                        "brand": product.get("brand", ""),
                        "review_index": index,
                    },
                )
            )

        if not reviews:
            fallback = "\n".join(
                [
                    f"Product: {product.get('name', 'Unknown product')}",
                    f"Brand: {product.get('brand', 'Unknown brand')}",
                    f"Price: ${float(product.get('price', 0)):.2f}",
                    f"Rating: {float(product.get('rating', 0)):.1f}/5 from {int(product.get('reviewCount', 0))} reviews",
                    f"Description: {product.get('description') or 'No description available.'}",
                ]
            )
            documents.append(
                Document(
                    page_content=fallback,
                    metadata={
                        "product_id": product.get("id", ""),
                        "product_name": product.get("name", "Unknown product"),
                        "brand": product.get("brand", ""),
                        "synthetic": True,
                    },
                )
            )

    return documents


def _build_product_summary(products: Sequence[dict[str, Any]]) -> str:
    lines: list[str] = []
    for product in products:
        lines.append(
            " | ".join(
                [
                    str(product.get("name", "Unknown product")),
                    f"brand={product.get('brand', 'Unknown')}",
                    f"price=${float(product.get('price', 0)):.2f}",
                    f"rating={float(product.get('rating', 0)):.1f}/5",
                    f"review_count={int(product.get('reviewCount', 0))}",
                ]
            )
        )
    return "\n".join(lines)


def _extract_json_object(raw_content: str) -> dict[str, Any] | None:
    try:
        parsed = json.loads(raw_content)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        start = raw_content.find("{")
        end = raw_content.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return None
        try:
            parsed = json.loads(raw_content[start : end + 1])
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            return None


def _build_product_detail(products: Sequence[dict[str, Any]]) -> str:
    lines: list[str] = []
    for product in products:
        specs_preview = ", ".join(
            f"{key}={value}" for key, value in list((product.get("specs") or {}).items())[:6]
        ) or "No notable specs captured."
        review_preview = " | ".join(str(item).strip() for item in (product.get("reviews") or [])[:4] if str(item).strip())
        lines.append(
            "\n".join(
                [
                    f"Product ID: {product.get('id', '')}",
                    f"Name: {product.get('name', 'Unknown product')}",
                    f"Brand: {product.get('brand', 'Unknown brand')}",
                    f"Price: ${float(product.get('price', 0)):.2f}",
                    f"Rating: {float(product.get('rating', 0)):.1f}/5 from {int(product.get('reviewCount', 0))} reviews",
                    f"Description: {product.get('description') or 'No description available.'}",
                    f"Specs: {specs_preview}",
                    f"Review snippets: {review_preview or 'No review snippets captured.'}",
                ]
            )
        )
    return "\n\n".join(lines)


def _build_comparison_context(vector_store: Any, products: Sequence[dict[str, Any]], chunk_count: int) -> str:
    sections: list[str] = []
    for product in products:
        product_name = str(product.get("name", "Unknown product"))
        product_id = str(product.get("id", ""))
        query = f"{product_name} strengths weaknesses pros cons reliability comfort value"
        try:
            retrieved_docs = vector_store.similarity_search(query, k=min(4, chunk_count))
        except Exception:
            logger.exception("Failed to retrieve comparison context for product_id=%s", product_id)
            retrieved_docs = []

        review_context = "\n".join(
            f"- {doc.page_content.strip()}" for doc in retrieved_docs if doc.page_content.strip()
        ) or "- No focused review snippets retrieved."
        sections.append(
            "\n".join(
                [
                    f"Product ID: {product_id}",
                    f"Product name: {product_name}",
                    "Retrieved review evidence:",
                    review_context,
                ]
            )
        )
    return "\n\n".join(sections)


def run_review_rag(question: str, products: Sequence[dict[str, Any]], *, model: str | None = None) -> str | None:
    started_at = perf_counter()
    api_key = os.getenv("GROQ_API_KEY")
    question = question.strip()
    if not api_key:
        logger.warning("Skipping review RAG because GROQ_API_KEY is not set")
        return None
    if not question:
        logger.warning("Skipping review RAG because the question is empty")
        return None
    if not products:
        logger.warning("Skipping review RAG because no products were provided")
        return None

    if LANGCHAIN_IMPORT_ERROR is not None:
        logger.exception("Skipping review RAG because LangChain imports failed", exc_info=LANGCHAIN_IMPORT_ERROR)
        return None

    logger.info(
        "Starting review RAG for %s products with model=%s",
        len(products),
        model or os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
    )

    documents = _build_review_documents(products)
    if not documents:
        logger.warning("Skipping review RAG because no review documents were built")
        return None

    logger.info("Built %s review documents for RAG", len(documents))

    embeddings_model = os.getenv("LANGCHAIN_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    llm_model = model or os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=80)
    chunks = splitter.split_documents(documents)
    if not chunks:
        logger.warning("Skipping review RAG because text splitting produced no chunks")
        return None

    logger.info("Split review corpus into %s chunks using embedding model=%s", len(chunks), embeddings_model)

    try:
        llm = ChatGroq(
            model=llm_model,
            api_key=api_key,
            temperature=0,
            max_tokens=350,
        )
        embeddings = get_embeddings(embeddings_model)
    except Exception:
        logger.exception("Failed to initialize LLM or embeddings for review RAG")
        return None

    with TemporaryDirectory(prefix="prod-bot-rag-") as temp_dir:
        logger.info("Creating temporary Chroma vector store at %s", temp_dir)
        try:
            vector_store = Chroma.from_documents(
                documents=chunks,
                embedding=embeddings,
                persist_directory=temp_dir,
            )
        except Exception:
            logger.exception("Failed to create Chroma vector store")
            return None

        try:
            retrieved_docs = vector_store.similarity_search(question, k=min(6, len(chunks)))
            logger.info("Retrieved %s context documents for question=%r", len(retrieved_docs), question)
            context = "\n\n".join(doc.page_content for doc in retrieved_docs)
            product_summary = _build_product_summary(products)
            prompt = ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        "You are a concise shopping assistant. Answer only from the provided product review context. "
                        "Focus on tradeoffs, review sentiment, reliability signals, and fit for the user's request. "
                        "If the evidence is weak or missing, say that plainly.",
                    ),
                    (
                        "human",
                        "Selected products:\n{product_summary}\n\nRetrieved review context:\n{context}\n\nQuestion: {question}",
                    ),
                ]
            )
            chain = prompt | llm | StrOutputParser()
            response = chain.invoke(
                {
                    "product_summary": product_summary,
                    "context": context,
                    "question": question,
                }
            ).strip()
            logger.info(
                "Review RAG completed successfully with %s characters in the response over %.2fs",
                len(response),
                perf_counter() - started_at,
            )
            return response
        except Exception:
            logger.exception("Review RAG failed during retrieval or generation")
            return None
        finally:
            try:
                vector_store.delete_collection()
            except Exception:
                logger.exception("Failed to delete temporary Chroma collection")


def run_comparison_rag(
    products: Sequence[dict[str, Any]],
    *,
    fallback_winner: str,
    fallback_insights: Sequence[str],
    model: str | None = None,
) -> dict[str, Any] | None:
    started_at = perf_counter()
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.warning("Skipping comparison RAG because GROQ_API_KEY is not set")
        return None
    if len(products) < 2:
        logger.warning("Skipping comparison RAG because fewer than two products were provided")
        return None
    if LANGCHAIN_IMPORT_ERROR is not None:
        logger.exception("Skipping comparison RAG because LangChain imports failed", exc_info=LANGCHAIN_IMPORT_ERROR)
        return None

    documents = _build_review_documents(products)
    if not documents:
        logger.warning("Skipping comparison RAG because no review documents were built")
        return None

    embeddings_model = os.getenv("LANGCHAIN_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    llm_model = model or os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=80)
    chunks = splitter.split_documents(documents)
    if not chunks:
        logger.warning("Skipping comparison RAG because text splitting produced no chunks")
        return None

    try:
        llm = ChatGroq(
            model=llm_model,
            api_key=api_key,
            temperature=0,
            max_tokens=700,
        )
        embeddings = get_embeddings(embeddings_model)
    except Exception:
        logger.exception("Failed to initialize LLM or embeddings for comparison RAG")
        return None

    with TemporaryDirectory(prefix="prod-bot-comparison-rag-") as temp_dir:
        try:
            vector_store = Chroma.from_documents(
                documents=chunks,
                embedding=embeddings,
                persist_directory=temp_dir,
            )
        except Exception:
            logger.exception("Failed to create Chroma vector store for comparison RAG")
            return None

        try:
            product_summary = _build_product_summary(products)
            product_detail = _build_product_detail(products)
            comparison_context = _build_comparison_context(vector_store, products, len(chunks))
            product_ids = [str(product.get("id", "")).strip() for product in products]
            prompt = ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        "You are a concise shopping comparison analyst. Use only the provided product summaries and retrieved review evidence. "
                        "Return JSON only with keys winner, insights, and product_highlights. winner must be one of the provided product IDs. "
                        "insights must be an array of exactly 2 or 3 short strings about the comparison overall. "
                        "product_highlights must be an object keyed by product ID, and each value must be an array of exactly 2 or 3 short strings explaining why that specific product stands out. "
                        "Make the product_highlights distinct from each other and mention tradeoffs when evidence supports it. Do not use markdown."
                    ),
                    (
                        "human",
                        "Fallback winner: {fallback_winner}\n"
                        "Fallback insights: {fallback_insights}\n"
                        "Allowed product IDs: {product_ids}\n\n"
                        "Selected products summary:\n{product_summary}\n\n"
                        "Detailed product context:\n{product_detail}\n\n"
                        "Retrieved review evidence by product:\n{comparison_context}",
                    ),
                ]
            )
            chain = prompt | llm | StrOutputParser()
            response = chain.invoke(
                {
                    "fallback_winner": fallback_winner,
                    "fallback_insights": json.dumps(list(fallback_insights)),
                    "product_ids": json.dumps(product_ids),
                    "product_summary": product_summary,
                    "product_detail": product_detail,
                    "comparison_context": comparison_context,
                }
            ).strip()
            parsed = _extract_json_object(response)
            if not parsed:
                logger.warning("Comparison RAG returned no valid JSON")
                return None
            logger.info(
                "Comparison RAG completed successfully for %s products over %.2fs",
                len(products),
                perf_counter() - started_at,
            )
            return parsed
        except Exception:
            logger.exception("Comparison RAG failed during retrieval or generation")
            return None
        finally:
            try:
                vector_store.delete_collection()
            except Exception:
                logger.exception("Failed to delete temporary Chroma collection for comparison RAG")