from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import json
from pathlib import Path

try:
    import torch
    import torch.nn as nn
except Exception as e:
    torch = None
    nn = None


app = FastAPI(title="Forecast Service (PyTorch)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Series(BaseModel):
    sku: str
    demand52: List[float]


class ForecastRequest(BaseModel):
    items: List[Series]
    output_weeks: int = 12  # next ~3 months


class ForecastResponse(BaseModel):
    forecasts: Dict[str, List[float]]


def _default_catalog_path() -> Path:
    # Resolve path relative to the repository root regardless of current working directory
    here = Path(__file__).resolve()
    # services/forecast/main.py -> repo root is parents[2]
    repo_root = here.parents[2]
    return repo_root / "backend" / "data" / "catalog.json"


def _load_catalog(path: Optional[Path] = None) -> Dict[str, Any]:
    p = path or _default_catalog_path()
    if not p.exists():
        return {"items": []}
    with p.open("r", encoding="utf-8") as f:
        return json.load(f)


def _save_catalog(data: Dict[str, Any], path: Optional[Path] = None) -> None:
    p = path or _default_catalog_path()
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


if torch is not None and nn is not None:
    class MLP(nn.Module):
        def __init__(self, input_dim: int = 52, output_dim: int = 12):
            super().__init__()
            self.net = nn.Sequential(
                nn.Linear(input_dim, 128),
                nn.ReLU(),
                nn.Linear(128, 64),
                nn.ReLU(),
                nn.Linear(64, output_dim),
            )

        def forward(self, x):
            return self.net(x)
else:
    class MLP:  # dummy placeholder when torch is unavailable
        def __init__(self, *args, **kwargs):
            pass


def train_and_forecast(items: List[Series], output_weeks: int = 12):
    # Fallback to naive if torch unavailable
    if torch is None or nn is None:
        result: Dict[str, List[float]] = {}
        for it in items:
            hist = it.demand52[-output_weeks:]
            result[it.sku] = list(hist)
        meta = {
            "framework": "naive",
            "model": "average_tail",
            "epochs": 0,
            "loss": None,
            "layers": []
        }
        return result, meta

    # Prepare a tiny dataset: For each SKU, input=full 52 vector, target=last `output_weeks` of that vector
    X = []
    Y = []
    for it in items:
        seq = it.demand52
        if len(seq) < 52:
            # pad if needed
            seq = ([seq[0]] * (52 - len(seq))) + seq
        x = torch.tensor(seq[:52], dtype=torch.float32)
        y = torch.tensor(seq[-output_weeks:], dtype=torch.float32)
        X.append(x)
        Y.append(y)

    X = torch.stack(X) if X else torch.zeros((1, 52), dtype=torch.float32)
    Y = torch.stack(Y) if Y else torch.zeros((1, output_weeks), dtype=torch.float32)

    model = MLP(input_dim=52, output_dim=output_weeks)
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-2)

    # Train briefly (demo)
    model.train()
    last_loss = None
    epochs = 300
    for _ in range(epochs):
        optimizer.zero_grad()
        pred = model(X)
        loss = criterion(pred, Y)
        loss.backward()
        optimizer.step()
        last_loss = float(loss.detach().cpu().item())

    # Forecast: use the latest 52 weeks as input
    model.eval()
    with torch.no_grad():
        preds = model(X).cpu().numpy()

    forecasts: Dict[str, List[float]] = {}
    for i, it in enumerate(items):
        yhat = [float(max(0.0, v)) for v in preds[i].tolist()]
        forecasts[ it.sku ] = yhat

    meta = {
        "framework": "pytorch",
        "model": "MLP",
        "epochs": epochs,
        "loss": last_loss,
        "layers": [52, 128, 64, output_weeks]
    }
    return forecasts, meta


@app.get("/")
def root():
    return {"status": "ok", "framework": "pytorch" if torch is not None else "naive"}


@app.post("/forecast")
def forecast(req: ForecastRequest):
    try:
        forecasts, meta = train_and_forecast(req.items, req.output_weeks)
        return {"forecasts": forecasts, "meta": meta}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/forecast_catalog")
def forecast_catalog():
    try:
        catalog = _load_catalog()
        items = catalog.get("items", [])
        series = []
        for it in items:
            demand = it.get("demand52") or it.get("demand_52") or it.get("demand") or []
            if isinstance(demand, list) and len(demand) >= 1:
                # normalize to 52
                d = [float(x) for x in demand]
                if len(d) < 52:
                    d = ([d[0]] * (52 - len(d))) + d
                else:
                    d = d[-52:]
                series.append(Series(sku=str(it.get("sku")), demand52=d))

        fc, meta = train_and_forecast(series, 12)

        # write back to catalog
        for it in items:
            sku = str(it.get("sku"))
            if sku in fc:
                it["forecasted_demand"] = fc[sku]

        _save_catalog({"items": items})
        framework = "pytorch" if torch is not None and nn is not None else "naive"
        return {"ok": True, "updated": len(fc), "framework": framework, "meta": meta}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
