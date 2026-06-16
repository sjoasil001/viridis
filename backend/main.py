from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# =====================================================================
# PHASE 1: Initialization & Schema Setup
# =====================================================================


app = FastAPI(
   title="VIRIDIS Grid Stress API",
   description="Intelligence platform mapping data center footprint to grid stability.",
   version="1.0.0"
)


app.add_middleware(
   CORSMiddleware,
   allow_origins=["*"],  # Permits local React app access during hackathon sprint
   allow_credentials=True,
   allow_methods=["*"],
   allow_headers=["*"],
)


class GridStressResponse(BaseModel):
   hour: int
   season: str
   grid_stress_score: int          # Percentage (0-100)
   peaker_plant_risk: str          # "LOW", "MEDIUM", "HIGH"
   water_overhead_gallons: int     # Downstream consequence linkage
   actionable_insight: str         # Text to display on the UI alert card
   is_mitigated: bool              # Tracking if workload shift is active




# =====================================================================
# PHASE 2: Rules-Based Logic Engine
# =====================================================================


def calculate_grid_stress(hour: int, season: str, is_mitigated: bool) -> dict:
   """
   Deterministic evaluation engine mapped to Georgia Power tariff windows.
   Peak Window: Summer weekdays, 2:00 PM (14) to 7:00 PM (19).
   """
   # Normalize inputs to lowercase to prevent string matching bugs
   season_lower = season.lower()
  
   # 1. Establish System Baseline (The Green State)
   grid_stress_score = 15
   peaker_plant_risk = "LOW"
   water_overhead_gallons = 12000
   actionable_insight = "Grid balance optimal. Data center operating within safe local baseline margins."


   # Adjust base stress slightly for normal daytime activity outside of peak hours
   if 8 <= hour <= 22:
       grid_stress_score = 28
       water_overhead_gallons = 24000
       actionable_insight = "Standard daylight operational grid load. No capacity threats detected."


   # 2. Evaluate Peak Windows (The Red State)
   # Checks if time lands within Georgia Power's high-demand 2 PM - 7 PM summer window
   if season_lower == "summer" and (14 <= hour <= 19):
       grid_stress_score = 78
       peaker_plant_risk = "HIGH"
       water_overhead_gallons = 150000  # Water-loop calculation scaling with utility peaker plants
       actionable_insight = "CRITICAL PEAK CONFLICT: High facility draw overlaps with peak grid demand. High risk of water-intensive peaker plant activation."


   # 3. Apply Mitigation Strategy (The Workload-Shift State)
   # If the operator hits the mitigation trigger, force the system to safe margins
   if is_mitigated:
       grid_stress_score = 18
       peaker_plant_risk = "LOW"
       water_overhead_gallons = 14500  # Dramatic drop in cooling footprint
       actionable_insight = "MITIGATION ACTIVE: Non-urgent computing workloads successfully deferred to off-peak hours (11 PM - 5 AM)."


   return {
       "hour": hour,
       "season": season,
       "grid_stress_score": grid_stress_score,
       "peaker_plant_risk": peaker_plant_risk,
       "water_overhead_gallons": water_overhead_gallons,
       "actionable_insight": actionable_insight,
       "is_mitigated": is_mitigated
   }




# =====================================================================
# PHASE 3: Route Exposure
# =====================================================================


@app.get("/")
def read_root():
   return {
       "status": "online",
       "platform": "VIRIDIS Grid Stress Engine",
       "documentation_url": "/docs"
   }


@app.get("/api/grid-stress", response_model=GridStressResponse)
def get_grid_stress(hour: int = 12, season: str = "summer", mitigated: bool = False):
   """
   Exposes the logic engine over HTTP. Accepts frontend slider/toggle inputs
   and returns a clean structured data block.
   """
   result = calculate_grid_stress(hour=hour, season=season, is_mitigated=mitigated)
   return result
	
