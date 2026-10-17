import os
from typing import Any

import httpx


async def get_exchange_rates(base_currency: str = "USD") -> dict[str, float]:
    api_key = os.getenv("EXCHANGE_RATE_API_KEY", "")
    if not api_key:
        return {base_currency: 1.0}

    url = f"https://v6.exchangerate-api.com/v6/{api_key}/latest/{base_currency}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=10)
        response.raise_for_status()
        data: dict[str, Any] = response.json()
        return data.get("conversion_rates", {base_currency: 1.0})


async def convert_amount(
    amount: float,
    from_currency: str,
    to_currency: str = "USD",
) -> dict[str, Any]:
    if from_currency == to_currency:
        return {"original_amount": amount, "converted_amount": amount, "rate": 1.0}

    rates = await get_exchange_rates(to_currency)
    rate = rates.get(from_currency)
    if rate is None:
        return {"original_amount": amount, "converted_amount": amount, "rate": 1.0, "warning": "Rate not found"}

    converted = amount / rate
    return {"original_amount": amount, "converted_amount": round(converted, 2), "rate": rate}
