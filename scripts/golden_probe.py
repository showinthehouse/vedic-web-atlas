import json
from vedic_engine import compute

samples = {
    "chennai_gregorian": {
        "date": "1996-12-07", "time": "10:34", "calendar": "GREGORIAN", "placeName": "Chennai, India",
        "latitude": 13.0878, "longitude": 80.2785, "timezone": 5.5, "ayanamsa": "LAHIRI", "divisionalFactor": 9,
    },
    "new_york_gregorian": {
        "date": "2000-01-01", "time": "12:00", "calendar": "GREGORIAN", "placeName": "New York, USA",
        "latitude": 40.7128, "longitude": -74.006, "timezone": -5, "ayanamsa": "LAHIRI", "divisionalFactor": 1,
    },
    "london_julian": {
        "date": "1582-10-04", "time": "12:00", "calendar": "JULIAN", "placeName": "London, UK",
        "latitude": 51.5072, "longitude": -0.1276, "timezone": 0, "ayanamsa": "LAHIRI", "divisionalFactor": 1,
    },
}

for name, payload in samples.items():
    result = compute(payload)
    summary = {
        "ascendant": next(item for item in result["rasi"] if item["body"] == "Ascendant"),
        "moon": next(item for item in result["rasi"] if item["body"] == "Moon"),
        "nakshatra": result["panchanga"]["nakshatra"],
        "dasa": result["vimsottari"][0],
        "sarvaTotal": sum(item["points"] for item in result["sarvashtakavarga"]),
    }
    print(name, json.dumps(summary, ensure_ascii=False))
