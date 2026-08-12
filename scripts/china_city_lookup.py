#!/usr/bin/env python3
"""Fast, dependency-free lookup for Chinese cities from PyJHora's bundled CSV."""

import base64
import csv
import json
import re
import sys
import sysconfig
import unicodedata
from pathlib import Path


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(char for char in value if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9\u4e00-\u9fff]+", "", value.lower())


def bundled_csv_path() -> Path:
    candidates = []
    for key in ("purelib", "platlib"):
        root = sysconfig.get_paths().get(key)
        if root:
            candidates.append(Path(root) / "jhora" / "data" / "geonames_places_5k.csv")
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError("PyJHora bundled Chinese city data is unavailable.")


def make_place_id(description: str, latitude: float, longitude: float) -> str:
    payload = json.dumps(
        {"description": description, "latitude": latitude, "longitude": longitude},
        ensure_ascii=False,
        separators=(",", ":"),
    ).encode("utf-8")
    return "china:" + base64.urlsafe_b64encode(payload).decode("ascii").rstrip("=")


def to_result(row: dict) -> dict:
    name = (row.get("place_name") or "").strip()
    state = (row.get("state") or "").strip()
    description = ", ".join(part for part in (name, state, "China") if part)
    latitude = float(row["latitude"])
    longitude = float(row["longitude"])
    return {
        "description": description,
        "placeId": make_place_id(description, latitude, longitude),
        "latitude": latitude,
        "longitude": longitude,
    }


def search(query: str, limit: int = 8) -> list[dict]:
    normalized_query = normalize(query)
    if not normalized_query:
        return []

    exact_or_prefix = []
    contains = []
    seen = set()
    with bundled_csv_path().open("r", encoding="utf-8-sig", newline="") as file:
        for row in csv.DictReader(file):
            if (row.get("country") or "").strip() != "China":
                continue
            aliases = [row.get("place_name") or "", *(row.get("alternate_names") or "").split("|")]
            normalized_aliases = [normalize(alias) for alias in aliases]
            if normalized_query in normalized_aliases or any(alias.startswith(normalized_query) for alias in normalized_aliases):
                target = exact_or_prefix
            elif any(normalized_query in alias for alias in normalized_aliases):
                target = contains
            else:
                continue

            result = to_result(row)
            if result["description"] not in seen:
                target.append(result)
                seen.add(result["description"])

    return (exact_or_prefix + contains)[:limit]


def main():
    payload = json.load(sys.stdin)
    if payload.get("action") != "search":
        raise ValueError("Unsupported China city lookup action")
    print(json.dumps({"results": search(str(payload.get("query", "")))}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"error": str(error)}, ensure_ascii=False))
        sys.exit(1)
