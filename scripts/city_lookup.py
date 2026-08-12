#!/usr/bin/env python3
"""Offline city lookup backed by PyJHora's bundled world-cities database."""

import contextlib
import json
import sys

with contextlib.redirect_stdout(sys.stderr):
    from jhora import utils


def record_to_json(record, description=None):
    if not record:
        return None
    label = description or record.get("display_label") or record.get("canonical_name") or record.get("name")
    return {
        "description": label,
        "placeId": f"pyjhora:{record.get('canonical_name') or record.get('name') or label}",
        "latitude": float(record["latitude"]),
        "longitude": float(record["longitude"]),
    }


def main():
    payload = json.load(sys.stdin)
    action = payload.get("action")
    with contextlib.redirect_stdout(sys.stderr):
        utils.use_database_for_world_cities(True)
    if action == "search":
        labels = utils.search_places_for_completer(str(payload.get("query", "")), limit=8)
        results = []
        for label in labels:
            row = record_to_json(utils.get_location_record(label), label)
            if row:
                results.append(row)
        print(json.dumps({"results": results}, ensure_ascii=False))
        return
    if action == "resolve":
        name = str(payload.get("placeName", ""))
        print(json.dumps({"result": record_to_json(utils.get_location_record(name), name)}, ensure_ascii=False))
        return
    raise ValueError("Unsupported city lookup action")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(json.dumps({"error": str(error)}, ensure_ascii=False))
        sys.exit(1)
