from __future__ import annotations
from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from po_optimize import optimize_purchase_order


app = FastAPI(title="PO Optimizer API", version="1.0.0")

# Allow all origins by default for easy local dev; tighten later if needed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/optimize")
async def optimize(
    request: Request,
    solver: Optional[str] = Query(default=None, pattern="^(scip)$"),
    time_limit: Optional[float] = Query(default=None, ge=0.0),
    mip_gap: Optional[float] = Query(default=None, ge=0.0),
):
    try:
        payload = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}")

    try:
        sol = optimize_purchase_order(payload, mip_gap=mip_gap, time_limit=time_limit, solver=solver)
        return sol
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
