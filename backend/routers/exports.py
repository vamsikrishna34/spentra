from fastapi import APIRouter
from fastapi.responses import Response

from agents.export_agent import generate_excel, generate_pdf, generate_word
from agents.parser_agent import generate_export_summary
from database.connection import get_supabase

router = APIRouter()


@router.get("/{user_id}/excel")
async def export_excel(user_id: str):
    supabase = get_supabase()
    transactions = (
        supabase.table("transactions_actual")
        .select("*")
        .eq("user_id", user_id)
        .order("date", desc=True)
        .execute()
    )
    budgets = (
        supabase.table("budgets_planned")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    summary = await generate_export_summary(transactions.data, budgets.data)
    content = generate_excel(transactions.data, budgets.data, summary)

    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=spentra_report.xlsx"},
    )


@router.get("/{user_id}/pdf")
async def export_pdf(user_id: str):
    supabase = get_supabase()
    transactions = (
        supabase.table("transactions_actual")
        .select("*")
        .eq("user_id", user_id)
        .order("date", desc=True)
        .execute()
    )
    budgets = (
        supabase.table("budgets_planned")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    summary = await generate_export_summary(transactions.data, budgets.data)
    content = generate_pdf(transactions.data, budgets.data, summary)

    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=spentra_report.pdf"},
    )


@router.get("/{user_id}/word")
async def export_word(user_id: str):
    supabase = get_supabase()
    transactions = (
        supabase.table("transactions_actual")
        .select("*")
        .eq("user_id", user_id)
        .order("date", desc=True)
        .execute()
    )
    budgets = (
        supabase.table("budgets_planned")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    summary = await generate_export_summary(transactions.data, budgets.data)
    content = generate_word(transactions.data, budgets.data, summary)

    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": "attachment; filename=spentra_report.docx"},
    )
