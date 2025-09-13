import json
import os
from po_optimize import optimize_purchase_order


def main():
    here = os.path.dirname(__file__)
    payload_path = os.path.join(here, "tests", "test_payload.json")
    with open(payload_path, "r") as f:
        data = json.load(f)

    sol = optimize_purchase_order(data, solver="scip")
    print(json.dumps(sol, indent=2))

    # Simple sanity checks for the three cases in this single payload
    # Case 1 (S2): within MOQ/Max, expect exact packs
    s2 = sol["suppliers"].get("S2")
    assert s2 and s2["total_units"] == 240

    # Case 2 (S1): requested 180 < MOQ 240; expect increase to >= 240
    s1 = sol["suppliers"].get("S1")
    assert s1 and s1["total_units"] >= 240

    # Case 3 (S3): requested 350 > Max 300; expect decrease to <= 300
    s3 = sol["suppliers"].get("S3")
    assert s3 and s3["total_units"] <= 300

    print("All sanity checks passed.")


if __name__ == "__main__":
    main()
