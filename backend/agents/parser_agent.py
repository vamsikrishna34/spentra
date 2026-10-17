import json
import os
from typing import Any

from google import genai


def _get_client() -> genai.Client:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY must be set")
    return genai.Client(api_key=api_key)


PARSE_PROMPT = """You are a financial transaction parser. Extract structured data from the user's input.

The input may be:
- A voice transcript (conversational, possibly with filler words)
- Typed natural language text
- OCR text extracted from a receipt image

Return ONLY valid JSON with these fields:
{
  "description": "short description of the expense",
  "amount": float (positive number),
  "currency": "3-letter ISO code (default USD)",
  "category": "one of: food, transport, shopping, bills, entertainment, health, education, travel, other",
  "date": "YYYY-MM-DD (default today if not mentioned)",
  "merchant": "merchant/store name if identifiable, or null"
}

If the input is not a valid expense, return: {"error": "reason"}
"""

COACH_PROMPT = """You are Spentra's AI Financial Coach — friendly, concise, and actionable.
Analyze the user's recent transactions, budget status, and spending patterns.
Provide a brief, personalized nudge (2-3 sentences max) that:
1. Highlights one positive habit or a spending risk
2. Suggests one concrete action

Tone: encouraging, never preachy. Use plain language.
"""

EXPORT_PROMPT = """You are a document generation assistant. Based on the provided transaction and budget data,
produce a concise summary section (2-3 paragraphs) suitable for inclusion in a financial report.
Cover: total spending, top categories, budget adherence, and one recommendation.
"""


async def parse_transaction_input(raw_text: str) -> dict[str, Any]:
    client = _get_client()
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"{PARSE_PROMPT}\n\nUser input: {raw_text}",
    )
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"error": "Failed to parse transaction"}


async def generate_coaching_nudge(
    transactions: list[dict[str, Any]],
    budgets: list[dict[str, Any]],
    user_context: dict[str, Any] | None = None,
) -> str:
    client = _get_client()
    context = json.dumps(
        {"transactions": transactions, "budgets": budgets, "context": user_context or {}},
        default=str,
    )
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"{COACH_PROMPT}\n\nUser financial data:\n{context}",
    )
    return response.text.strip()


async def generate_export_summary(
    transactions: list[dict[str, Any]],
    budgets: list[dict[str, Any]],
) -> str:
    client = _get_client()
    data = json.dumps(
        {"transactions": transactions, "budgets": budgets},
        default=str,
    )
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"{EXPORT_PROMPT}\n\nFinancial data:\n{data}",
    )
    return response.text.strip()
