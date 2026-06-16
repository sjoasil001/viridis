import requests
import pandas as pd
# Path helps us create folders before saving the CSV file.
from pathlib import Path

API_KEY = "6f31r6Jf7Mf3NXJAdfTvUSvtKBR2Sjg2SQY5y4Ta"

url = "https://api.eia.gov/v2/electricity/rto/region-data/data/"

def get_grid_data(balancing_authority_code):
    # EIA uses short type codes in the API response.
    # We map those short codes to easier-to-read column names for our CSV.
    type_map = {
        "D": "Demand",
        "NG": "Net Generation",
        "DF": "Day-ahead demand forecast"
    }

    params = {
        "api_key": API_KEY,
        "frequency": "hourly",
        "data[0]": "value",
        "facets[respondent][]": balancing_authority_code,
        # Ask the API for only the three data streams we care about.
        # This is more reliable than filtering by the display names later,
        # because names can have small spelling/capitalization differences.
        "facets[type][]": list(type_map.keys()),
        "sort[0][column]": "period",
        "sort[0][direction]": "desc",
        # "length" means number of raw API rows, not number of hours.
        # We request extra rows so we have enough data after filtering/pivoting.
        "length": 500
    }

    response = requests.get(url, params=params)
    # Stop immediately if the API request failed, instead of using bad data.
    response.raise_for_status()

    data = response.json()["response"]["data"]

    df = pd.DataFrame(data)

    # Keep only the rows with type codes from type_map.
    # .copy() makes a separate DataFrame so pandas does not warn us later.
    df_filtered = df[df["type"].isin(type_map.keys())].copy()
    # Create a new column called "metric" with readable names like "Demand".
    df_filtered["metric"] = df_filtered["type"].map(type_map)

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

    # The API can skip some hours. Machine learning works better when every
    # hour is present, so we build a complete hourly timeline first.
    df_pivot = df_pivot.drop_duplicates(subset=["period"])
    earliest_period = df_pivot["period"].min()
    latest_period = df_pivot["period"].max()
    hourly_index = pd.date_range(
        start=earliest_period,
        end=latest_period,
        freq="h"
    )

    df_pivot = df_pivot.set_index("period")
    # Add rows for any missing hours. These new rows will have empty values
    # until we fill them in below.
    df_pivot = df_pivot.reindex(hourly_index)
    df_pivot.index.name = "period"
    df_pivot["respondent"] = balancing_authority_code

    # Estimate missing numeric values using nearby hours.
    # Example: if 2 PM and 4 PM exist but 3 PM is missing, interpolate creates
    # a reasonable 3 PM value between them.
    numeric_cols = df_pivot.select_dtypes(include=["number"]).columns
    df_pivot[numeric_cols] = df_pivot[numeric_cols].interpolate(method="time")

    df_pivot = df_pivot.reset_index()

    # If missing values are at the very beginning or end, interpolation cannot
    # always fill them. ffill/bfill copies the nearest known value.
    df_pivot = df_pivot.ffill().bfill()
    # After cleaning, keep only the most recent 24 hourly rows.
    df_pivot = df_pivot.tail(24)

    #-------PHASE 03: ALGORITHM AND LOGIC ENGINE IMPLEMENTATION-------------------------------------
    def phase_3(df_pivot):
        #find peak capacity 
        #---We use a benchmark peak capacity of 46,000 MW for Southern Company based on publicly reported summer peak demand ranges. VIRIDIS compares current demand against that benchmark to estimate grid stress and downstream environmental impacts.
        peak_capacity = 46000

        #current demand
        current_demand = df_pivot["Demand"].iloc[-1]
        
        #grid stress (%): how close are we to MAX grid pressure 
        stress = (current_demand/peak_capacity) * 100

        #timestamp of the latest data point
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

    # Make sure the folder exists before trying to save the CSV.
    Path("data/raw").mkdir(parents=True, exist_ok=True)
    df_pivot.to_csv(f"data/raw/{balancing_authority_code}_data.csv", index=False)

    return result
