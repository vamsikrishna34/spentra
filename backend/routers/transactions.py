import os
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agents.parser_agent import parse_transaction_input
from database.connection import get_supabase

router = APIRouter()


class TextTransactionRequest(BaseModel):
    text: str
    user_id: str


class ManualTransactionRequest(BaseModel):
    description: str
    amount: float
    currency: str = "USD"
    category: str = "other"
    date: str | None = None
    merchant: str | None = None
    user_id: str


class VoiceTransactionRequest(BaseModel):
    transcript: str
    user_id: str


@router.post("/text")
async def log_text_transaction(req: TextTransactionRequest):
    parsed = await parse_transaction_input(req.text)
    if "error" in parsed:
        raise HTTPException(status_code=422, detail=parsed["error"])

    parsed["user_id"] = req.user_id
    return await _save_transaction(parsed)


@router.post("/voice")
async def log_voice_transaction(req: VoiceTransactionRequest):
    parsed = await parse_transaction_input(req.transcript)
    if "error" in parsed:
        raise HTTPException(status_code=422, detail=parsed["error"])

    parsed["user_id"] = req.user_id
    return await _save_transaction(parsed)


@router.post("/manual")
async def log_manual_transaction(req: ManualTransactionRequest):
    data = req.model_dump()
    if data["date"] is None:
        data["date"] = datetime.now().strftime("%Y-%m-%d")
    return await _save_transaction(data)


@router.post("/ocr")
async def log_ocr_transaction(req: TextTransactionRequest):
    parsed = await parse_transaction_input(req.text)
    if "error" in parsed:
        raise HTTPException(status_code=422, detail=parsed["error"])

    parsed["user_id"] = req.user_id
    parsed["source"] = "ocr"
    return await _save_transaction(parsed)


@router.post("/csv")
async def log_csv_transactions(req: TextTransactionRequest):
    lines = req.text.strip().split("\n")
    if len(lines) < 2:
        raise HTTPException(status_code=422, detail="CSV must have a header row and at least one data row")

    headers = [h.strip().lower() for h in lines[0].split(",")]
    results = []
    supabase = get_supabase()

    for line in lines[1:]:
        values = [v.strip() for v in line.split(",")]
        row = dict(zip(headers, values))
        row["user_id"] = req.user_id
        try:
            row["amount"] = float(row.get("amount", 0))
        except (ValueError, TypeError):
            row["amount"] = 0.0
        result = supabase.table("transactions_actual").insert(row).execute()
        results.append(result.data)

    return {"imported": len(results), "transactions": results}


@router.get("/{user_id}")
async def get_transactions(user_id: str, limit: int = 100):
    supabase = get_supabase()
    result = (
        supabase.table("transactions_actual")
        .select("*")
        .eq("user_id", user_id)
        .order("date", desc=True)
        .limit(limit)
        .execute()
    )
    return {"transactions": result.data}


@router.delete("/{transaction_id}")
async def delete_transaction(transaction_id: str):
    supabase = get_supabase()
    result = supabase.table("transactions_actual").delete().eq("id", transaction_id).execute()
    return {"deleted": len(result.data)}


async def _save_transaction(data: dict[str, Any]) -> dict[str, Any]:
    supabase = get_supabase()
    result = supabase.table("transactions_actual").insert(data).execute()
    return {"transaction": result.data[0] if result.data else None}
