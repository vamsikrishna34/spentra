import calendar
from datetime import datetime
from typing import Any

from fastapi import APIRouter

from agents.financial_coach_agent import predict_spending
from agents.parser_agent import generate_coaching_nudge
from database.connection import get_supabase

router = APIRouter()


@router.get("/predict/{user_id}")
async def get_prediction(user_id: str):
    supabase = get_supabase()
    transactions = (
        supabase.table("transactions_actual")
        .select("*")
        .eq("user_id", user_id)
        .order("date", desc=True)
        .limit(200)
        .execute()
    )
    budgets = (
        supabase.table("budgets_planned")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    now = datetime.now()
    _, days_in_month = calendar.monthrange(now.year, now.month)
    days_remaining = days_in_month - now.day

    prediction = await predict_spending(transactions.data, budgets.data, days_remaining)
    return {"prediction": prediction}


@router.get("/coach/{user_id}")
async def get_coaching_nudge(user_id: str):
    supabase = get_supabase()
    transactions = (
        supabase.table("transactions_actual")
        .select("*")
        .eq("user_id", user_id)
        .order("date", desc=True)
        .limit(50)
        .execute()
    )
    budgets = (
        supabase.table("budgets_planned")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    nudge = await generate_coaching_nudge(transactions.data, budgets.data)
    return {"nudge": nudge}


@router.get("/summary/{user_id}")
async def get_spending_summary(user_id: str):
    supabase = get_supabase()
    transactions = (
        supabase.table("transactions_actual")
        .select("category,amount,currency,date")
        .eq("user_id", user_id)
        .execute()
    )

    total = sum(float(tx.get("amount", 0)) for tx in transactions.data)
    by_category: dict[str, float] = {}
    for tx in transactions.data:
        cat = tx.get("category", "other")
        by_category[cat] = by_category.get(cat, 0) + float(tx.get("amount", 0))

    return {
        "total_spent": total,
        "transaction_count": len(transactions.data),
        "by_category": by_category,
    }
