#!/usr/bin/env python3
"""Resolve an IANA timezone and historical UTC offset for coordinates and local birth time."""

import json
import sys
from datetime import datetime

import pytz
import swisseph as swe
from pytz import AmbiguousTimeError, NonExistentTimeError
from timezonefinder import TimezoneFinder


def convert_to_gregorian(year, month, day, calendar):
    if calendar == "JULIAN":
        jd = swe.julday(year, month, day, 0, swe.JUL_CAL)
        gregorian_year, gregorian_month, gregorian_day, _ = swe.revjul(jd, swe.GREG_CAL)
        return int(gregorian_year), int(gregorian_month), int(gregorian_day)
    return year, month, day


def resolve(payload):
    latitude = float(payload["latitude"])
    longitude = float(payload["longitude"])
    date = payload["date"]
    time = payload["time"]
    calendar = str(payload.get("calendar", "GREGORIAN")).upper()
    year, month, day = [int(part) for part in date.split("-")]
    hour, minute = [int(part) for part in time.split(":" )]
    zone_name = TimezoneFinder().timezone_at(lat=latitude, lng=longitude)
    if not zone_name:
        zone_name = TimezoneFinder().certain_timezone_at(lat=latitude, lng=longitude)
    if not zone_name:
        raise ValueError("无法从该坐标确定 IANA 时区，请手动输入 UTC 偏移。")
    if calendar not in {"GREGORIAN", "JULIAN"}:
        raise ValueError("历法必须为 GREGORIAN 或 JULIAN。")

    gy, gm, gd = convert_to_gregorian(year, month, day, calendar)
    local_naive = datetime(gy, gm, gd, hour, minute)
    zone = pytz.timezone(zone_name)
    warning = None
    try:
        local = zone.localize(local_naive, is_dst=None)
    except AmbiguousTimeError:
        local = zone.localize(local_naive, is_dst=False)
        warning = "该当地时间处于夏令时回拨的歧义区间，当前按标准时解析；请结合出生记录核验。"
    except NonExistentTimeError:
        local = zone.localize(local_naive, is_dst=True)
        warning = "该当地时间落在夏令时前跳的不存在区间，当前按夏令时解析；请结合出生记录核验。"

    seconds = int(local.utcoffset().total_seconds())
    offset_hours = seconds / 3600
    absolute = abs(seconds)
    sign = "+" if seconds >= 0 else "-"
    formatted = f"UTC{sign}{absolute // 3600:02d}:{(absolute % 3600) // 60:02d}"
    return {
        "timeZoneId": zone_name,
        "offsetHours": offset_hours,
        "formattedOffset": formatted,
        "dstApplied": bool(local.dst() and local.dst().total_seconds()),
        "resolvedGregorianDate": f"{gy:04d}-{gm:02d}-{gd:02d}",
        "warning": warning,
    }


if __name__ == "__main__":
    try:
        print(json.dumps(resolve(json.load(sys.stdin)), ensure_ascii=False))
    except Exception as error:
        print(json.dumps({"error": str(error)}, ensure_ascii=False))
        sys.exit(1)
