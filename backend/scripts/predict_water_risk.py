import pandas as pd
import csv
from datetime import datetime
import matplotlib.pyplot as plt
import numpy as np


#Function to score pH values, returns a score between 0 and 100 based on how close the value is to the ideal range of 6.5-9.0
def score_ph(value):
    if 6.5 <= value <= 9.0:
        return 100
    
    distance = abs(value - 7.5)
    score = 100 - distance * 25

    return max(0, min(100, score))

measurements = []

water_data = pd.read_csv("data/raw/ph.csv")

with open("data/raw/ph.csv", newline="") as file:
    reader = csv.DictReader(file)
    
    for row in reader:
        try:   
             #convert date and value, skip if conversion fails
             #ex: takes "2020-01-15" and converts to datetime object, takes "7.5" and converts to float
             date = datetime.strptime(row["ActivityStartDate"], "%Y-%m-%d")

             #converts pH value to float
             value = float(row["ResultMeasureValue"])
        except ValueError:
            continue
        
        #measurements is a list of dictionaries, each dictionary has keys: date, month, metric, value
        measurements.append({
            "date": date,
            "month": date.strftime("%Y-%m"),
            "metric": row["CharacteristicName"],
            "value": value,
            "score": score_ph(value),
        })

# summarize the measurements
scores = []

for measurement in measurements:
    scores.append(measurement["score"])
averate_score = sum(scores) / len(scores)
print("Average pH score:", averate_score)

#find the monthly average pH score
monthly_scores = {}
for measurement in measurements:
    month = measurement["month"]
    score = measurement["score"]
    if month not in monthly_scores:
        monthly_scores[month] = []
    monthly_scores[month].append(score)
monthly_averages = {}

for month, scores, in monthly_scores.items():
    monthly_averages[month] = sum(scores) / len(scores)

for month in sorted(monthly_averages):
    print(month, round(monthly_averages[month], 2))




#total number of clean pH readings
print("Total clean pH readings:", len(measurements))
#measurment of first clean pH reading
print("First clean reading:", measurements[0])

#first pH value and its score
first_value = measurements[0]["value"]
print("First pH value:", first_value)
print("First pH score:", score_ph(first_value))




    
