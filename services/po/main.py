from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional

try:
    import pyomo.environ as pyo
except Exception:
    pyo = None

app = FastAPI(title="PO Design Service (Pyomo)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class POItem(BaseModel):
    sku: str
    shortfall: float  # units needed
    case_pack: Optional[int] = None  # units per case
    moq: Optional[int] = None        # minimum order qty (units)

class SolveRequest(BaseModel):
    items: List[POItem]
    solver: str = "glpk"  # user may toggle 'scip' or 'cplex', we'll try to honor

class SolveResponse(BaseModel):
    quantities: Dict[str, int]
    provider: str
    note: Optional[str] = None

@app.get("/health")
def health():
    return {"ok": True, "pyomo": bool(pyo is not None)}

@app.post("/solve")
def solve(req: SolveRequest):
    try:
        if pyo is None:
            # Fallback heuristic
            return fallback_solution(req)

        m = pyo.ConcreteModel()
        skus = [it.sku for it in req.items]
        data = {it.sku: it for it in req.items}

        m.S = pyo.Set(initialize=skus)
        # decision variables: number of cases to order (integer >=0)
        def init_lb(s):
            return 0
        m.cases = pyo.Var(m.S, within=pyo.NonNegativeIntegers, bounds=(0, None))

        # constraints: meet shortfall with case packs, and MOQ
        m.meet_shortfall = pyo.Constraint(m.S, rule=lambda m, s: m.cases[s] * (data[s].case_pack or 1) >= max(0, data[s].shortfall))
        def moq_rule(m, s):
            moq = data[s].moq or 0
            if moq <= 0:
                return pyo.Constraint.Skip
            return m.cases[s] * (data[s].case_pack or 1) >= moq
        m.moq = pyo.Constraint(m.S, rule=moq_rule)

        # objective: minimize total ordered units (simple)
        m.obj = pyo.Objective(expr=sum(m.cases[s] * (data[s].case_pack or 1) for s in m.S), sense=pyo.minimize)

        # try solver
        try:
            opt = pyo.SolverFactory(req.solver)
        except Exception:
            opt = None
        if opt is None or not opt.available(False):
            # try a common free solver
            for cand in ["glpk", "cbc"]:
                try:
                    opt = pyo.SolverFactory(cand)
                except Exception:
                    continue
                if opt and opt.available(False):
                    break
        if opt is None or not opt.available(False):
            return fallback_solution(req, note="No solver available; used heuristic")

        res = opt.solve(m, tee=False)
        # build result
        qty: Dict[str, int] = {}
        for s in skus:
            cases_val = int(round(pyo.value(m.cases[s]) or 0))
            qty[s] = max(0, cases_val * (data[s].case_pack or 1))
        return SolveResponse(quantities=qty, provider=f"pyomo:{opt.name}")
    except Exception as e:
        return fallback_solution(req, note=str(e))

def fallback_solution(req: SolveRequest, note: Optional[str] = None):
    qty: Dict[str, int] = {}
    for it in req.items:
        cp = it.case_pack or 1
        need = max(0, it.shortfall)
        # round up to case pack and satisfy MOQ
        units = int(((need + cp - 1) // cp) * cp)
        if it.moq:
            units = max(units, int(it.moq))
        qty[it.sku] = units
    return SolveResponse(quantities=qty, provider="heuristic", note=note)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)

