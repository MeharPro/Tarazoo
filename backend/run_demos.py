from __future__ import annotations
import json
import os
import sys
import argparse
from typing import Dict, Any, List


def _load_json(path: str) -> Dict[str, Any]:
    with open(path, "r") as f:
        return json.load(f)


def _call_api(url: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    import urllib.request
    import urllib.error

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"API error {e.code}: {body}")


def _run_local(payload: Dict[str, Any]) -> Dict[str, Any]:
    from po_optimize import optimize_purchase_order
    return optimize_purchase_order(payload, solver="scip")


def summarize(title: str, sol: Dict[str, Any]) -> None:
    print(f"\n== {title} ==")
    print(f"status={sol.get('status')}  objective={sol.get('objective')}")
    orders: List[Dict[str, Any]] = sol.get("orders", [])
    if not orders:
        print("No orders returned.")
        return
    print("- Orders:")
    for r in orders:
        print(
            f"  {r['sku']} (sup={r['supplier']}): packs={r['packs']} units={r['units']} "
            f"req={r['requested_units']} dev+=(%0.1f) dev-(%0.1f) cost=%0.2f" % (r['deviation_up'], r['deviation_down'], r['purchase_cost'])
        )
    print("- Supplier totals:")
    for sid, agg in sol.get("suppliers", {}).items():
        print(f"  {sid}: total_units={agg['total_units']} moq={agg.get('moq_units')} max={agg.get('max_units')}")


def main():
    ap = argparse.ArgumentParser(description="Run demo payloads and summarize outputs")
    ap.add_argument("--api", help="Base URL for API (e.g., http://127.0.0.1:8000)")
    args = ap.parse_args()

    here = os.path.dirname(__file__)
    demos = [
        ("Mixed (MOQ/Max/Bundle/Ratio)", os.path.join(here, "tests", "test_payload.json")),
        ("MOQ with Ratio", os.path.join(here, "tests", "demo_ratio_moq.json")),
        ("Bundle Multiple + Max", os.path.join(here, "tests", "demo_bundle_max.json")),
    ]

    for title, path in demos:
        payload = _load_json(path)
        if args.api:
            url = args.api.rstrip("/") + "/optimize?solver=scip"
            sol = _call_api(url, payload)
        else:
            sol = _run_local(payload)
        summarize(title, sol)


if __name__ == "__main__":
    main()

