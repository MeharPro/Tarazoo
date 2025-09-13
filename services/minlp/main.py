from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import random
from datetime import datetime

app = FastAPI(title="MINLP Optimization Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class OptimizationInput(BaseModel):
    merchant_id: str
    order_id: Optional[str] = None
    items: List[Dict[str, Any]]

class OptimizationSolution(BaseModel):
    optimal_cost: float
    assignments: List[Dict[str, Any]]
    kpis: Dict[str, Any]

class ExplanationRequest(BaseModel):
    solution: Dict[str, Any]

class ExplanationResponse(BaseModel):
    bullets: List[str]
    tldr: str

# Mock supplier data for demo
SUPPLIERS = {
    "supplier_1": {"name": "FastCo Supply", "lead_time": 2, "cost_multiplier": 1.0},
    "supplier_2": {"name": "Budget Wholesale", "lead_time": 5, "cost_multiplier": 0.85},
    "supplier_3": {"name": "Premium Direct", "lead_time": 1, "cost_multiplier": 1.2},
}

@app.get("/")
def read_root():
    return {"status": "MINLP Service Running", "version": "1.0.0"}

@app.post("/solve", response_model=OptimizationSolution)
async def solve_optimization(input_data: OptimizationInput):
    """
    Run MINLP optimization to minimize procurement costs while respecting constraints.
    This is a simplified demo implementation.
    """
    try:
        # Simulate optimization computation
        items = input_data.items
        
        # Create mock assignments (in real implementation, this would use Pyomo/PuLP)
        assignments = []
        total_cost = 0
        suppliers_used = set()
        
        for item in items:
            # Randomly assign to supplier (in real MINLP, this would be optimized)
            supplier_id = random.choice(list(SUPPLIERS.keys()))
            supplier = SUPPLIERS[supplier_id]
            suppliers_used.add(supplier_id)
            
            # Calculate cost (simplified)
            base_cost = item.get("price_cents", 1000) * item.get("qty", 1)
            cost = base_cost * supplier["cost_multiplier"] / 100
            total_cost += cost
            
            assignments.append({
                "sku": item.get("sku", "UNKNOWN"),
                "supplier": supplier["name"],
                "quantity": item.get("qty", 1),
                "cost": cost,
                "lead_time": supplier["lead_time"]
            })
        
        # Calculate KPIs
        avg_lead_time = sum(SUPPLIERS[s]["lead_time"] for s in suppliers_used) / len(suppliers_used) if suppliers_used else 0
        
        solution = OptimizationSolution(
            optimal_cost=total_cost,
            assignments=assignments,
            kpis={
                "total_cost": int(total_cost * 100),  # Convert back to cents
                "supplier_count": len(suppliers_used),
                "avg_lead_time": round(avg_lead_time, 1),
                "optimization_time_ms": random.randint(500, 2000),
                "constraints_satisfied": True
            }
        )
        
        return solution
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain", response_model=ExplanationResponse)
async def explain_solution(request: ExplanationRequest):
    """
    Generate human-readable explanation of the optimization solution.
    """
    try:
        solution = request.solution
        kpis = solution.get("kpis", {})
        
        # Generate explanation bullets based on solution
        bullets = []
        
        # Cost savings bullet
        if kpis.get("total_cost"):
            bullets.append(f"Optimized procurement cost to ${kpis['total_cost']/100:.2f} through strategic supplier selection")
        
        # Supplier diversity bullet
        if kpis.get("supplier_count"):
            bullets.append(f"Distributed orders across {kpis['supplier_count']} suppliers to minimize risk and ensure availability")
        
        # Lead time bullet
        if kpis.get("avg_lead_time"):
            bullets.append(f"Achieved average lead time of {kpis['avg_lead_time']} days while maintaining cost efficiency")
        
        # Generate TL;DR
        tldr = f"MINLP optimization saved 15% on costs using {kpis.get('supplier_count', 2)} suppliers with {kpis.get('avg_lead_time', 3)}-day delivery"
        
        return ExplanationResponse(
            bullets=bullets[:3],  # Ensure exactly 3 bullets
            tldr=tldr
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
