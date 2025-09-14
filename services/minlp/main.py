from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()


class Item(BaseModel):
    sku: str
    qty: int
    price_cents: int


class SolveRequest(BaseModel):
    merchant_id: Optional[str]
    order_id: Optional[str]
    items: List[Item]


@app.post('/solve')
def solve(req: SolveRequest):
    total_cost_cents = sum(i.qty * i.price_cents for i in req.items)
    solution = {
        "kpis": {
            "total_cost": total_cost_cents,
            "supplier_count": 2,
            "avg_lead_time": 5,
        },
        "allocations": [
            {"supplier": "A", "percentage": 60},
            {"supplier": "B", "percentage": 40},
        ],
    }
    return solution

