#!/usr/bin/env python3
"""AGPL-compatible JSON adapter around PyJHora and Swiss Ephemeris.

This process reads one JSON payload from stdin and writes one JSON result to stdout.
All diagnostic output is sent to stderr so the Node adapter can parse stdout safely.
"""

import contextlib
import datetime as dt
import json
import sys
import traceback

with contextlib.redirect_stdout(sys.stderr):
    import swisseph as swe
    from jhora import const, utils
    from jhora.horoscope.chart import charts
    from jhora.horoscope.chart import ashtakavarga
    from jhora.horoscope.chart import strength
    from jhora.horoscope.dhasa.graha import vimsottari
    from jhora.horoscope.match import compatibility
    from jhora.panchanga import drik


SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]
PLANETS = {
    "L": "Ascendant", 0: "Sun", 1: "Moon", 2: "Mars", 3: "Mercury",
    4: "Jupiter", 5: "Venus", 6: "Saturn", 7: "Rahu", 8: "Ketu",
}
NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishtha", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
]
WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
AYANAMSA = {"LAHIRI": "LAHIRI", "RAMAN": "RAMAN", "KP": "KP", "TRUE_PUSHYA": "TRUE_PUSHYA"}


def decimal_to_dms(value):
    degrees = int(value)
    minutes_float = (value - degrees) * 60
    minutes = int(minutes_float)
    seconds = int(round((minutes_float - minutes) * 60))
    if seconds == 60:
        minutes += 1
        seconds = 0
    if minutes == 60:
        degrees += 1
        minutes = 0
    return f"{degrees}°{minutes:02d}′{seconds:02d}″"


def local_time_string(hour):
    hour = hour % 24
    h = int(hour)
    m = int((hour - h) * 60)
    return f"{h:02d}:{m:02d}"


def jd_to_iso(jd):
    year, month, day, hour = utils.jd_to_gregorian(jd)
    return f"{year:04d}-{month:02d}-{day:02d} {local_time_string(hour)}"


def chart_items(jd, place, factor):
    raw = charts.divisional_chart(jd, place, divisional_chart_factor=factor)
    items = []
    for body, position in raw:
        sign, degree = position
        items.append({
            "body": PLANETS.get(body, str(body)),
            "key": str(body),
            "signIndex": int(sign),
            "sign": SIGNS[int(sign)],
            "degree": round(float(degree), 6),
            "formattedDegree": decimal_to_dms(float(degree)),
        })
    return items


def panchanga(jd, place):
    tithi = drik.tithi(jd, place)
    nakshatra = drik.nakshatra(jd, place)
    sunrise = drik.sunrise(jd, place)
    sunset = drik.sunset(jd, place)
    weekday = int(drik.vaara(jd, place))
    tithi_num = int(tithi[0])
    return {
        "weekday": WEEKDAYS[weekday],
        "tithi": {
            "number": tithi_num,
            "paksha": "Krishna" if tithi_num > 15 else "Shukla",
            "endTime": local_time_string(float(tithi[2])),
        },
        "nakshatra": {
            "number": int(nakshatra[0]),
            "name": NAKSHATRAS[int(nakshatra[0]) - 1],
            "pada": int(nakshatra[1]),
            "endTime": local_time_string(float(nakshatra[3])),
        },
        "sunrise": sunrise[1],
        "sunset": sunset[1],
    }


def dasa_periods(jd, place):
    maha = vimsottari.vimsottari_mahadasa(jd, place)
    entries = list(maha.items())
    periods = []
    for index, (lord, start_jd) in enumerate(entries):
        next_start = entries[index + 1][1] if index + 1 < len(entries) else start_jd + vimsottari.vimsottari_dict[lord] * const.sidereal_year
        periods.append({
            "lord": PLANETS.get(lord, str(lord)),
            "start": jd_to_iso(start_jd),
            "end": jd_to_iso(next_start),
            "years": round(float(vimsottari.vimsottari_dict[lord]), 2),
        })
    return periods


def fine_dasa(jd, place):
    maha = vimsottari.vimsottari_mahadasa(jd, place)
    maha_lord = next((lord for lord, start in reversed(list(maha.items())) if start <= jd), list(maha.keys())[0])
    maha_start = maha[maha_lord]
    bhuktis = vimsottari._vimsottari_bhukti(maha_lord, maha_start)
    bhukti_lord = next((lord for lord, start in reversed(list(bhuktis.items())) if start <= jd), list(bhuktis.keys())[0])
    bhukti_start = bhuktis[bhukti_lord]
    antaras = vimsottari._vimsottari_antara(maha_lord, bhukti_lord, bhukti_start)
    antara_lord = next((lord for lord, start in reversed(list(antaras.items())) if start <= jd), list(antaras.keys())[0])
    entries = []
    pairs = list(antaras.items())
    for index, (lord, start) in enumerate(pairs):
        next_start = pairs[index + 1][1] if index + 1 < len(pairs) else start
        entries.append({"lord": PLANETS.get(lord, str(lord)), "start": jd_to_iso(start), "end": jd_to_iso(next_start), "current": lord == antara_lord})
    return {"maha": PLANETS.get(maha_lord, str(maha_lord)), "bhukti": PLANETS.get(bhukti_lord, str(bhukti_lord)), "antara": PLANETS.get(antara_lord, str(antara_lord)), "antaras": entries}


def yoga_results(rasi):
    signs = {item["body"]: item["signIndex"] for item in rasi}
    def kendra(first, second): return (signs[first] - signs[second]) % 12 in [0, 3, 6, 9]
    result = []
    if signs.get("Sun") == signs.get("Mercury"):
        result.append({"name": "Budha Aditya Yoga", "matched": True, "rule": "Sun and Mercury occupy the same Rasi."})
    if "Jupiter" in signs and "Moon" in signs and kendra("Jupiter", "Moon"):
        result.append({"name": "Gaja Kesari Yoga", "matched": True, "rule": "Jupiter is in a kendra from the Moon."})
    if "Mars" in signs and "Moon" in signs and kendra("Mars", "Moon"):
        result.append({"name": "Chandra Mangala Yoga", "matched": True, "rule": "Mars is in a kendra from the Moon."})
    return result


def muhurta_windows(jd, place):
    return {
        "abhijit": drik.abhijit_muhurta(jd, place),
        "rahuKalam": drik.raahu_kaalam(jd, place),
        "yamaganda": drik.yamaganda_kaalam(jd, place),
        "gulikai": drik.gulikai_kaalam(jd, place),
        "durmuhurtam": drik.durmuhurtam(jd, place),
    }


def compatibility_result(left, right):
    left_nak = left["panchanga"]["nakshatra"]
    right_nak = right["panchanga"]["nakshatra"]
    ashta = compatibility.Ashtakoota(left_nak["number"], left_nak["pada"], right_nak["number"], right_nak["pada"])
    values = ashta.compatibility_score()
    labels = ["Varna", "Vashya", "Gana", "Tara", "Yoni", "Graha Maitri", "Bhakoot", "Nadi"]
    return {"method": "Ashta Koota / North", "leftNakshatra": left_nak, "rightNakshatra": right_nak, "score": float(values[8]), "maximum": 36, "components": [{"name": labels[index], "score": float(values[index])} for index in range(8)], "additional": {"mahendra": bool(values[9]), "vedha": bool(values[10]), "rajju": bool(values[11]), "sthreeDheerga": bool(values[12])}}


def shadbala_scores(jd, place):
    raw = strength.shad_bala(jd, place)
    total_virupas, total_rupas, is_strong = raw[6], raw[7], raw[8]
    return [
        {
            "planet": PLANETS[index],
            "virupas": round(float(total_virupas[index]), 2),
            "rupas": round(float(total_rupas[index]), 2),
            "isStrong": bool(is_strong[index]),
        }
        for index in range(7)
    ]


def sarvashtakavarga_scores(jd, place):
    rasi_chart = charts.rasi_chart(jd, place)
    house_to_planets = utils.get_house_planet_list_from_planet_positions(rasi_chart)
    _, sarva, _ = ashtakavarga.get_ashtaka_varga(house_to_planets)
    return [{"sign": SIGNS[index], "signIndex": index, "points": int(points)} for index, points in enumerate(sarva)]


def compute(payload):
    date = payload["date"]
    time = payload["time"]
    year, month, day = [int(part) for part in date.split("-")]
    hour, minute = [int(part) for part in time.split(":")]
    latitude = float(payload["latitude"])
    longitude = float(payload["longitude"])
    timezone = float(payload["timezone"])
    place_name = str(payload.get("placeName") or "Custom location")
    ayanamsa = AYANAMSA.get(str(payload.get("ayanamsa", "LAHIRI")).upper(), "LAHIRI")
    calendar = str(payload.get("calendar", "GREGORIAN")).upper()
    factor = int(payload.get("divisionalFactor", 1))

    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise ValueError("Latitude or longitude is outside its valid range.")
    if factor < 1 or factor > 300:
        raise ValueError("Divisional factor must be between 1 and 300.")
    if calendar not in {"GREGORIAN", "JULIAN"}:
        raise ValueError("Calendar must be GREGORIAN or JULIAN.")

    with contextlib.redirect_stdout(sys.stderr):
        drik.set_ayanamsa_mode(ayanamsa)
        place = drik.Place(place_name, latitude, longitude, timezone)
        calendar_flag = swe.JUL_CAL if calendar == "JULIAN" else swe.GREG_CAL
        jd = swe.julday(year, month, day, hour + minute / 60, calendar_flag)
        selected_chart = chart_items(jd, place, factor)
        rasi = selected_chart if factor == 1 else chart_items(jd, place, 1)
        navamsa = selected_chart if factor == 9 else chart_items(jd, place, 9)
        now = dt.datetime.now() + dt.timedelta(hours=timezone)
        transit_jd = utils.julian_day_number((now.year, now.month, now.day), (now.hour, now.minute, 0))

    return {
        "engine": {"name": "PyJHora + Swiss Ephemeris", "license": "AGPL-3.0", "ayanamsa": ayanamsa},
        "input": {"date": date, "time": time, "calendar": calendar, "placeName": place_name, "latitude": latitude, "longitude": longitude, "timezone": timezone},
        "selectedChart": {"factor": factor, "label": f"D-{factor}", "items": selected_chart},
        "rasi": rasi,
        "navamsa": navamsa,
        "panchanga": panchanga(jd, place),
        "vimsottari": dasa_periods(jd, place),
        "fineDasa": fine_dasa(jd, place),
        "yogas": yoga_results(rasi),
        "muhurta": muhurta_windows(jd, place),
        "shadbala": shadbala_scores(jd, place),
        "sarvashtakavarga": sarvashtakavarga_scores(jd, place),
        "transits": chart_items(transit_jd, place, 1),
    }


def main():
    try:
        payload = json.load(sys.stdin)
        if payload.get("mode") == "compatibility":
            left = compute(payload["left"])
            right = compute(payload["right"])
            print(json.dumps({"left": left, "right": right, "compatibility": compatibility_result(left, right)}, ensure_ascii=False))
        else:
            print(json.dumps(compute(payload), ensure_ascii=False))
    except Exception as error:
        print(json.dumps({"error": str(error), "trace": traceback.format_exc(limit=2)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
