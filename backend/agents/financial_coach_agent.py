import json
import os
from typing import Any

from google import genai


def _get_client() -> genai.Client:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_API_KEY must be set")
    return genai.Client(api_key=api_key)

PREDICTION_PROMPT = """You are a predictive spending analyst for Spentra.
Given the user's transaction history and current budget, calculate:
1. "safe_daily_spend": how much the user can safely spend per day for the rest of the month
2. "velocity_warning": whether current spending velocity will exceed budget (true/false)
3. "projected_month_end_total": projected total spending by month end
4. "days_until_budget_exhausted": estimated days until budget runs out (null if within budget)
5. "recommendation": one-sentence actionable advice

Return ONLY valid JSON.
"""


async def predict_spending(
    transactions: list[dict[str, Any]],
    budgets: list[dict[str, Any]],
    days_remaining: int,
) -> dict[str, Any]:
    client = _get_client()
    data = json.dumps(
        {
            "transactions": transactions,
            "budgets": budgets,
            "days_remaining_in_month": days_remaining,
        },
        default=str,
    )
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"{PREDICTION_PROMPT}\n\nData:\n{data}",
    )
    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "safe_daily_spend": 0,
            "velocity_warning": False,
            "projected_month_end_total": 0,
            "days_until_budget_exhausted": None,
            "recommendation": "Unable to generate prediction.",
        }
