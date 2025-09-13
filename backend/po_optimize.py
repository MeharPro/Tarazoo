from __future__ import annotations
import json
import argparse
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

# Pyomo + SCIP only (no fallbacks)
try:
    import pyomo.environ as pyo
except Exception:
    pyo = None  # type: ignore


@dataclass
class SKU:
    sku: str
    supplier: str
    pack_size: int
    unit_price: float
    requested_units: int
    sku_min_units: Optional[int] = None
    sku_max_units: Optional[int] = None


@dataclass
class SupplierRule:
    supplier: str
    moq_units: Optional[int] = None
    max_units: Optional[int] = None


@dataclass
class BundleRule:
    name: str
    skus: List[str]
    pack_multiple: int


@dataclass
class RatioRule:
    name: str
    items: List[Tuple[str, int]]  # (sku, weight)


def _parse_payload(data: dict) -> Tuple[Dict[str, SKU], Dict[str, SupplierRule], List[BundleRule], List[RatioRule]]:
    skus: Dict[str, SKU] = {}
    for item in data.get("skus", []):
        sku = SKU(
            sku=str(item["sku"]),
            supplier=str(item.get("supplier", "default")),
            pack_size=int(item["pack_size"]),
            unit_price=float(item.get("unit_price", 0.0)),
            requested_units=int(item.get("requested_units", 0)),
            sku_min_units=(int(item["min_units"]) if item.get("min_units") is not None else None),
            sku_max_units=(int(item["max_units"]) if item.get("max_units") is not None else None),
        )
        skus[sku.sku] = sku

    suppliers: Dict[str, SupplierRule] = {}
    for sid, rule in data.get("suppliers", {}).items():
        suppliers[str(sid)] = SupplierRule(
            supplier=str(sid),
            moq_units=(int(rule["moq_units"]) if rule.get("moq_units") is not None else None),
            max_units=(int(rule["max_units"]) if rule.get("max_units") is not None else None),
        )

    bundles: List[BundleRule] = []
    for b in data.get("bundles", []):
        bundles.append(BundleRule(
            name=str(b.get("name", "bundle")),
            skus=[str(x) for x in b.get("skus", [])],
            pack_multiple=int(b["bundle_pack_multiple"]) if b.get("bundle_pack_multiple") is not None else 1,
        ))

    ratios: List[RatioRule] = []
    for r in data.get("ratios", []):
        items = []
        for it in r.get("items", []):
            items.append((str(it["sku"]), int(it.get("weight", 1))))
        ratios.append(RatioRule(name=str(r.get("name", "ratio")), items=items))

    return skus, suppliers, bundles, ratios


# Remove direct PySCIPOpt path; we standardize on Pyomo+SCIP


def _solve_with_pyomo(skus, suppliers, bundles, ratios, mip_gap, time_limit) -> dict:
    if pyo is None:
        raise RuntimeError("Pyomo is not available. Install: pip install pyomo")

    m = pyo.ConcreteModel()
    S = list(skus.keys())
    m.S = pyo.Set(initialize=S)

    m.Q = pyo.Var(m.S, domain=pyo.NonNegativeIntegers)
    m.Up = pyo.Var(m.S, domain=pyo.NonNegativeReals)
    m.Down = pyo.Var(m.S, domain=pyo.NonNegativeReals)

    # helper expression for units
    def units_expr(s):
        return skus[s].pack_size * m.Q[s]

    # Per-SKU bounds
    m.sku_min_cons = pyo.ConstraintList()
    m.sku_max_cons = pyo.ConstraintList()
    for s in S:
        item = skus[s]
        if item.sku_min_units is not None:
            m.sku_min_cons.add(units_expr(s) >= item.sku_min_units)
        if item.sku_max_units is not None:
            m.sku_max_cons.add(units_expr(s) <= item.sku_max_units)

    # Supplier constraints
    suppliers_skus: Dict[str, List[str]] = {}
    for s in S:
        suppliers_skus.setdefault(skus[s].supplier, []).append(s)

    m.supplier_cons = pyo.ConstraintList()
    for sid, rule in suppliers.items():
        if sid not in suppliers_skus:
            continue
        total_units = sum(skus[s].pack_size * m.Q[s] for s in suppliers_skus[sid])
        if rule.moq_units is not None:
            m.supplier_cons.add(total_units >= rule.moq_units)
        if rule.max_units is not None:
            m.supplier_cons.add(total_units <= rule.max_units)

    # Bundles
    m.bundle_cons = pyo.ConstraintList()
    m.B = pyo.Var(range(len(bundles)), domain=pyo.NonNegativeIntegers) if bundles else None
    for i, b in enumerate(bundles):
        if b.pack_multiple is None or b.pack_multiple <= 1:
            continue
        lhs = sum(m.Q[s] for s in b.skus if s in skus)
        m.bundle_cons.add(lhs == b.pack_multiple * m.B[i])

    # Ratios
    m.ratio_cons = pyo.ConstraintList()
    m.T = pyo.Var(range(len(ratios)), domain=pyo.NonNegativeIntegers) if ratios else None
    for i, rr in enumerate(ratios):
        if not rr.items:
            continue
        for (sku_id, w) in rr.items:
            if sku_id in skus:
                m.ratio_cons.add(m.Q[sku_id] == int(w) * m.T[i])

    # Deviation balance
    m.dev_cons = pyo.ConstraintList()
    for s in S:
        m.dev_cons.add(units_expr(s) - int(skus[s].requested_units) == m.Up[s] - m.Down[s])

    # Objective
    m.obj = pyo.Objective(
        expr=sum(skus[s].unit_price * (m.Up[s] + m.Down[s]) for s in S),
        sense=pyo.minimize,
    )

    # Choose solver
    from pyomo.opt import SolverFactory
    if not SolverFactory("scip").available(False):
        raise RuntimeError("Pyomo 'scip' solver is not available. Ensure SCIP is installed and 'scip' is on PATH.")
    opt = SolverFactory("scip")
    opts = {}
    if time_limit is not None:
        opts["limits/time"] = float(time_limit)
    if mip_gap is not None:
        opts["limits/gap"] = float(mip_gap)

    result = opt.solve(m, tee=False, options=opts)
    status = str(result.solver.status)

    sol = {
        "status": status,
        "orders": [],
        "suppliers": {},
        "objective": pyo.value(m.obj) if m.obj is not None else None,
    }

    supplier_totals_units: Dict[str, float] = {}
    for s, item in skus.items():
        packs = pyo.value(m.Q[s])
        packs = 0 if packs is None else packs
        units_val = packs * item.pack_size
        up = pyo.value(m.Up[s]) or 0
        down = pyo.value(m.Down[s]) or 0
        sol["orders"].append({
            "sku": s,
            "supplier": item.supplier,
            "packs": int(round(packs)),
            "units": int(round(units_val)),
            "requested_units": int(item.requested_units),
            "deviation_up": float(up),
            "deviation_down": float(down),
            "unit_price": float(item.unit_price),
            "purchase_cost": float(item.unit_price) * float(units_val),
        })
        supplier_totals_units[item.supplier] = supplier_totals_units.get(item.supplier, 0.0) + float(units_val)

    for sid, total_u in supplier_totals_units.items():
        rule = suppliers.get(sid)
        sol["suppliers"][sid] = {
            "total_units": int(round(total_u)),
            "moq_units": rule.moq_units if rule else None,
            "max_units": rule.max_units if rule else None,
        }
    return sol


def optimize_purchase_order(data: dict, mip_gap: Optional[float] = None, time_limit: Optional[float] = None, solver: Optional[str] = None) -> dict:
    skus, suppliers, bundles, ratios = _parse_payload(data)
    # Single path: Pyomo + SCIP only
    if solver is not None and solver != "scip":
        raise RuntimeError("Only 'scip' is supported. Set --solver scip or omit the flag.")
    return _solve_with_pyomo(skus, suppliers, bundles, ratios, mip_gap, time_limit)


def main():
    ap = argparse.ArgumentParser(description="Optimize a purchase order payload (MILP on case packs, MOQ, bundles, ratios)")
    ap.add_argument("--input", required=True, help="Path to JSON payload")
    ap.add_argument("--mip_gap", type=float, default=None)
    ap.add_argument("--time_limit", type=float, default=None)
    ap.add_argument("--output", default=None, help="Optional path to write solution JSON")
    ap.add_argument("--solver", choices=["scip"], default=None, help="Solver selection (only 'scip' supported)")
    args = ap.parse_args()

    with open(args.input, "r") as f:
        data = json.load(f)

    sol = optimize_purchase_order(data, mip_gap=args.mip_gap, time_limit=args.time_limit, solver=args.solver)

    if args.output:
        with open(args.output, "w") as f:
            json.dump(sol, f, indent=2)
    else:
        print(json.dumps(sol, indent=2))


if __name__ == "__main__":
    main()
