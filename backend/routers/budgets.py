from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database.connection import get_supabase

router = APIRouter()


class BudgetRequest(BaseModel):
    user_id: str
    category: str
    planned_amount: float
    period: str = "monthly"


class BudgetUpdateRequest(BaseModel):
    planned_amount: float


@router.post("/")
async def create_budget(req: BudgetRequest):
    supabase = get_supabase()
    result = supabase.table("budgets_planned").insert(req.model_dump()).execute()
    return {"budget": result.data[0] if result.data else None}


@router.get("/{user_id}")
async def get_budgets(user_id: str):
    supabase = get_supabase()
    budgets = (
        supabase.table("budgets_planned")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    transactions = (
        supabase.table("transactions_actual")
        .select("category,amount")
        .eq("user_id", user_id)
        .execute()
    )

    actual_by_category: dict[str, float] = {}
    for tx in transactions.data:
        cat = tx.get("category", "other")
        actual_by_category[cat] = actual_by_category.get(cat, 0) + float(tx.get("amount", 0))

    enriched = []
    for b in budgets.data:
        actual = actual_by_category.get(b["category"], 0)
        remaining = float(b["planned_amount"]) - actual
        if remaining < 0:
            health = "red"
        elif remaining < float(b["planned_amount"]) * 0.2:
            health = "yellow"
        else:
            health = "green"
        enriched.append({
            **b,
            "actual_amount": actual,
            "remaining": remaining,
            "health": health,
        })

    return {"budgets": enriched}


@router.put("/{budget_id}")
async def update_budget(budget_id: str, req: BudgetUpdateRequest):
    supabase = get_supabase()
    result = (
        supabase.table("budgets_planned")
        .update({"planned_amount": req.planned_amount})
        .eq("id", budget_id)
        .execute()
    )
    return {"budget": result.data[0] if result.data else None}


@router.delete("/{budget_id}")
async def delete_budget(budget_id: str):
    supabase = get_supabase()
    result = supabase.table("budgets_planned").delete().eq("id", budget_id).execute()
    return {"deleted": len(result.data)}
