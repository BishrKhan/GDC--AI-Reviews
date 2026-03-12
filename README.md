# PROD-BOT — AI-Powered Product Review & Comparison Platform

> Discover, compare, and buy products — powered by AI and real customer reviews.

---

## 🧠 The Problem

The way people research products is changing. Instead of scrolling through endless review sites, consumers are increasingly turning to AI chatbots to ask for product suggestions and buying links. But those AI responses are limited — they rely on outdated training data, can't show real-time pricing, and have no structured way for brands to list their products.

**PROD-BOT bridges that gap.**

---

## 💡 What Is PROD-BOT?

PROD-BOT is an AI-powered product discovery and comparison platform where:

- **Brands & sellers** can list and advertise their products
- **Consumers** can browse, compare, and buy based on AI-curated reviews and ratings
- **An AI chatbot** helps users find exactly what they're looking for through natural conversation

Think of it as the next evolution of product reviews — instead of reading 200 user reviews yourself, you get an intelligent summary, side-by-side comparison, and a direct link to buy.

---

## ✨ Features

- **Product Listings** — Brands advertise their products with pricing, images, and specs
- **AI-Powered Reviews** — Aggregated customer sentiment and ratings powered by LLMs
- **Product Comparison** — Side-by-side comparison of similar products
- **AI Chatbot** — Ask anything: *"What's the best ergonomic chair under $500?"* and get a direct answer with links
- **Wishlist** — Save products you're interested in for later
- **Q&A** — Community and AI-answered questions about any product
- **User Profiles** — Personalized recommendations based on your interests

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Backend | Node.js |
| AI / LLM | Claude API (Anthropic) |
| Package Manager | pnpm |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- pnpm (`npm install -g pnpm`)

### Installation

```bash
# Clone the repo
git clone https://github.com/BishrKhan/GDC--AI-Reviews.git
cd GDC--AI-Reviews

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Fill in your API keys in .env

# Start the development server
pnpm dev
```

### Docker Compose

Run the frontend and FastAPI backend together with Docker Compose:

```bash
docker compose up --build
```

This starts:

- Frontend on `http://localhost:3000`
- FastAPI API on `http://localhost:8000`

If you use Groq for chat responses, export your key before starting Compose:

```bash
export GROQ_API_KEY=your_key_here
docker compose up --build
```

Stop the stack with:

```bash
docker compose down
```

---

## 👥 Team

Built as part of the GDC AI Reviews project.
