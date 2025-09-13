# PO Optimizer (Easy Setup)

This backend script optimizes a simple purchase order payload with pack multiples, supplier MOQ/Max, bundle multiples, and pack ratios. It chooses the closest feasible plan to your requested units, preferring adjustments on cheaper SKUs.

Quick start (SCIP via Pyomo)
- Install SCIP and ensure the `scip` executable is on your PATH.
- Create venv and install Python deps:
  - `python -m venv .venv && source .venv/bin/activate`
  - `pip install -r backend/requirements.txt`
- Run demo:
  - `python backend/po_optimize.py --input backend/tests/test_payload.json --solver scip`

Docker
- The provided Dockerfile does not install SCIP. Use a base image that already has SCIP installed, or mount it in at runtime. Then:
  - `docker build -t po-opt backend`
  - `docker run --rm -p 8000:8000 po-opt`
  - POST `http://localhost:8000/optimize`

SCIP (optional, faster/stronger)
- Install SCIP and PySCIPOpt (system-specific)
- Then just run without forcing solver:
  - `python backend/po_optimize.py --input backend/tests/test_payload.json`

Input JSON schema
- `skus`: [{ sku, supplier, pack_size, unit_price, requested_units, min_units?, max_units? }]
- `suppliers`: { supplier_id: { moq_units?, max_units? } }
- `bundles`: [{ name, skus: [sku...], bundle_pack_multiple }]
- `ratios`: [{ name, items: [{ sku, weight }, ...] }]

Cases handled
- Case 1: Within supplier MOQ/Max → only basic constraints (packs/bundles/ratios)
- Case 2: Below supplier MOQ → increase smartly (cheaper SKUs favored)
- Case 3: Above supplier Max → decrease smartly (minimal deviation)

Test
- `python backend/test_po_optimize.py`

Run the included demos
- Local (SCIP via Pyomo):
  - `python backend/run_demos.py`
- API mode (after starting the API):
  - `uvicorn backend.api:app --reload`
  - `python backend/run_demos.py --api http://127.0.0.1:8000`

API quickstart (local)
- `python -m venv .venv && source .venv/bin/activate`
- `pip install -r backend/requirements.txt`
- Ensure SCIP is installed and available as `scip`
- `uvicorn backend.api:app --reload`
- POST to `http://127.0.0.1:8000/optimize`

Outputs
- Prints JSON solution with per-SKU packs/units and supplier totals.

Notes
- This is a MILP; all constraints are linear. If you need quadratic penalties (true MINLP/MIQP), we can add that behind a flag with SCIP or another MIQP-capable solver.
