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

    print(df.columns)

    #keeping only relevant standard streams
    standard_streams = [
        "Demand",
        "Net Generation",
        "Forecast Demand"
    ]

    df_filtered = df[df["type-name"].isin(standard_streams)]

    #renaming for clarity
    df_filtered = df_filtered.rename(columns={"type-name": "metric"})

    print(df_filtered.columns)
    print(df_filtered.head())
    print(df.head(20))

    # ensure numeric values
    df_filtered["value"] = pd.to_numeric(df_filtered["value"], errors="coerce")

    #formatting to prepare for ML
    df_pivot = df_filtered.pivot_table(
        index=["period", "respondent"],
        columns="metric",
        values="value",
        aggfunc="mean"
    ).reset_index()
    

    #output 
    print(df.head())
    print(f"Rows downloaded: {len(df)}")

    df_pivot.to_csv(f"data/raw/{balancing_authority_code}_data.csv", index=False)

    return df_pivot
get_grid_data("SOCO")

print(get_grid_data("SOCO").columns)
print(get_grid_data("SOCO").head())



# The above code defines a function `get_grid_data` that takes a `balancing_authority_code` as an argument, makes a GET request to the EIA API to retrieve electricity data for that balancing authority, and then processes the response into a pandas DataFrame. The DataFrame is printed to the console, and the data is also saved as a CSV file in the `data/raw/` directory. Finally, the function is called with the "SOCO" balancing authority code, and the columns and head of the resulting DataFrame are printed.

# Note: The API key used in the code is a placeholder and should be replaced with a valid API key from the EIA. Additionally, ensure that the `data/raw/` directory exists before running the code to avoid any file saving errors.


