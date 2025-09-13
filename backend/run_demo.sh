#!/usr/bin/env bash
set -euo pipefail

# Run locally with Pyomo + SCIP only.
set -e

python3 - << 'PY'
import sys
try:
    import pyomo.environ as pyo
except Exception:
    sys.exit(2)
from pyomo.opt import SolverFactory
sys.exit(0 if SolverFactory('scip').available(False) else 3)
PY
rc=$?
if [ $rc -eq 2 ]; then
  echo "Pyomo not installed. Install with: pip install -r backend/requirements.txt" >&2
  exit 1
elif [ $rc -eq 3 ]; then
  echo "SCIP solver not available to Pyomo. Ensure 'scip' is installed and on PATH." >&2
  exit 1
fi

echo "Running locally with Pyomo + SCIP..."
python3 backend/po_optimize.py --input backend/tests/test_payload.json --solver scip
