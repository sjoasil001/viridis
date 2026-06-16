import requests
import pandas as pd

API_KEY = "6f31r6Jf7Mf3NXJAdfTvUSvtKBR2Sjg2SQY5y4Ta"

url = "https://api.eia.gov/v2/electricity/rto/region-data/data/"

def get_grid_data(balancing_authority_code):
    params = {
    "api_key": API_KEY,
    "frequency": "hourly",
    "data[0]": "value",
    "facets[respondent][]": balancing_authority_code,
    "sort[0][column]": "period",
    "sort[0][direction]": "desc",
    "length": 24
    }

    response = requests.get(url, params=params)

    data = response.json()["response"]["data"]

    df = pd.DataFrame(data)

    #keeping only relevant standard streams
    standard_streams = [
        "Demand",
        "Net Generation",
        "Day-ahead demand forecast"
    ]


    df_filtered = df[df["type-name"].isin(standard_streams)]

    #renaming for clarity
    df_filtered = df_filtered.rename(columns={"type-name": "metric"})

    # ensure numeric values
    df_filtered["value"] = pd.to_numeric(df_filtered["value"], errors="coerce")

    #formatting to prepare for ML
    df_pivot = df_filtered.pivot_table(
        index=["period", "respondent"],
        columns="metric",
        values="value",
        aggfunc="mean"
    ).reset_index()

    #converting timestamp to real datetime
    df_pivot["period"] = pd.to_datetime(df_pivot["period"])

    #conversion to EST
    df_pivot["period"] = (
        df_pivot["period"].dt.tz_localize("UTC", nonexistent="shift_forward")
        .dt.tz_convert("US/Eastern")
    )
    #sorting time period
    df_pivot = df_pivot.sort_values("period")

    #print(df_pivot.columns)

    
    #---------PHASE 02: HANDLING MISSING VALUES-------------------------------------

    #using interpolation to fill missing data using estimation from nearby values
    #period (row) --> becomes column
    df_pivot = df_pivot.set_index("period")
    #time estimation
    numeric_cols = df_pivot.select_dtypes(include=["number"]).columns
    df_pivot[numeric_cols] = df_pivot[numeric_cols].interpolate(method="time")

    df_pivot = df_pivot.reset_index()

    #clean duplicate values 
    df_pivot = df_pivot.drop_duplicates(subset=["period"])

    #fill missing values by copying the most recent value above it
    df_pivot = df_pivot.ffill()

    #-------PHASE 03: ALGORITHM AND LOGIC ENGINE IMPLEMENTATION-------------------------------------
    def phase_3(df_pivot):
        #find peak capacity 
        #---We use a benchmark peak capacity of 46,000 MW for Southern Company based on publicly reported summer peak demand ranges. VIRIDIS compares current demand against that benchmark to estimate grid stress and downstream environmental impacts.
        peak_capacity = 46000

        #current demand
        current_demand = df_pivot["Demand"].iloc[-1]
        
        #grid stress (%): how close are we to MAX grid pressure 
        stress = (current_demand/peak_capacity) * 100

        #timestamp
        latest_timestamp = str(df_pivot["period"].iloc[-1])

        #logic for risk level
        if stress >= 90:
            risk_level = "CRITICAL"
        elif stress >= 75:
            risk_level = "HIGH"
        elif stress >= 50:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        #signifier for peaker plant active status
        #---if grid stress is above 75 then peaker is considered active 
        peaker_active = stress > 75

        #how much water is used when the grid getsc 1% more stressed
        #---1 unit of energy Mwh = 1923 gallons of water 
        #---energy per 1% = peak capacity /100
        #---water per stress unit = energy per 1% * water per Megawatt hours
        water_per_stress_unit = (peak_capacity * 1923) / 100
        
        #total water impact
        water_usage = stress * water_per_stress_unit

        #output 
        result = {
            "timestamp": latest_timestamp,
            "current_demand": float(current_demand),
            "peak_capacity": float(peak_capacity),
            "grid_stress_percent (%)": round(float(stress),2),
            "risk_level": risk_level,
            "peaker_active_status": bool(peaker_active),
            "water_usage_gallon": round(float(water_usage))
        }
        return result


    #run result
    result = phase_3(df_pivot)
    print(result)

    df_pivot.to_csv(f"data/raw/{balancing_authority_code}_data.csv", index=False)

    return result


