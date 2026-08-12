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
    from jhora.horoscope.chart import charts, house, sphuta, yoga as pyjhora_yoga, raja_yoga
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
NAKSHATRA_LORDS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"] * 3
LUNAR_MONTHS = ["Chaitra", "Vaisakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada", "Ashwin", "Kartika", "Margashirsha", "Pausha", "Magha", "Phalguna"]
TITHI_NAMES = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima"]
YOGA_NAMES = ["Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarman", "Dhriti", "Shoola", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"]
KARANA_CYCLE = ["Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti"]
KARAKA_NAMES = ["Atma Karaka", "Amatya Karaka", "Bhratri Karaka", "Maitri Karaka", "Pitri Karaka", "Putra Karaka", "Jnati Karaka", "Dara Karaka"]
VARGA_FACTORS = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60]
BAV_BODIES = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Ascendant"]
WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
AYANAMSA = {"LAHIRI": "LAHIRI", "RAMAN": "RAMAN", "KP": "KP", "TRUE_PUSHYA": "TRUE_PUSHYA"}
VARNADA_METHODS = {
    1: "B. V. Raman",
    2: "Sharma / Santhanam",
    3: "Sanjay Rath",
    4: "Sitaram Jha / R. Pandey",
}
DASA_LEVELS = ["Mahadasa", "Bhukti", "Antara"]
DASA_THEMES = {
    "Sun": "可见性、责任与自我表达",
    "Moon": "情绪节律、照顾与适应",
    "Mars": "行动、边界与执行",
    "Mercury": "学习、沟通与交易",
    "Jupiter": "学习、价值与扩展",
    "Venus": "关系、审美与资源",
    "Saturn": "结构、纪律与长期责任",
    "Rahu": "非常规方向、欲望与放大效应",
    "Ketu": "简化、抽离与内省",
}
YOGA_SOURCE_URL = "https://github.com/naturalstupid/PyJHora/blob/master/src/jhora/horoscope/chart/yoga.py"
RAJA_YOGA_SOURCE_URL = "https://github.com/naturalstupid/PyJHora/blob/master/src/jhora/horoscope/chart/raja_yoga.py"
COMPATIBILITY_SOURCE_URL = "https://github.com/naturalstupid/PyJHora/blob/master/src/jhora/horoscope/match/compatibility.py"
VIMSOTTARI_SOURCE_URL = "https://github.com/naturalstupid/PyJHora/blob/master/src/jhora/horoscope/dhasa/graha/vimsottari.py"


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


def coordinate_dms(value, positive, negative):
    hemisphere = positive if value >= 0 else negative
    return f"{decimal_to_dms(abs(value))} {hemisphere}"


def interval_fraction_left(start, end, current_hour):
    start = float(start)
    end = float(end)
    current = float(current_hour)
    if end <= start:
        end += 24
    while current < start:
        current += 24
    while current > end:
        current -= 24
    duration = end - start
    return round(max(0, min(1, (end - current) / duration)) * 100, 2) if duration else None


def nakshatra_details(sign_index, degree):
    absolute = (float(sign_index) * 30 + float(degree)) % 360
    star_span = 360 / 27
    number = int(absolute / star_span) + 1
    pada = int((absolute % star_span) / (star_span / 4)) + 1
    return {"number": number, "name": NAKSHATRAS[number - 1], "pada": pada, "lord": NAKSHATRA_LORDS[number - 1]}


def position_record(label, key, sign_index, degree, asc_sign_index):
    sign_index = int(sign_index)
    degree = float(degree)
    return {
        "body": label,
        "key": str(key),
        "signIndex": sign_index,
        "sign": SIGNS[sign_index],
        "degree": round(degree, 6),
        "formattedDegree": decimal_to_dms(degree),
        "house": ((sign_index - int(asc_sign_index)) % 12) + 1,
        "nakshatra": nakshatra_details(sign_index, degree),
    }


def jd_to_iso(jd):
    year, month, day, hour = utils.jd_to_gregorian(jd)
    return f"{year:04d}-{month:02d}-{day:02d} {local_time_string(hour)}"


def chart_items(jd, place, factor):
    raw = charts.divisional_chart(jd, place, divisional_chart_factor=factor)
    asc_sign = raw[0][1][0]
    items = []
    for body, position in raw:
        sign, degree = position
        items.append(position_record(PLANETS.get(body, str(body)), body, sign, degree, asc_sign))
    return items


def panchanga(jd, place):
    tithi = drik.tithi(jd, place)
    nakshatra = drik.nakshatra(jd, place)
    yoga = drik.yogam(jd, place)
    karana = drik.karana(jd, place)
    lunar_month, is_adhika, is_nija = drik.lunar_month(jd, place)
    sunrise = drik.sunrise(jd, place)
    sunset = drik.sunset(jd, place)
    weekday = int(drik.vaara(jd, place))
    tithi_num = int(tithi[0])
    _, _, _, birth_hour = utils.jd_to_gregorian(jd)
    tithi_name = "Amavasya" if tithi_num == 30 else TITHI_NAMES[(tithi_num - 1) % 15]
    karana_num = int(karana[0])
    if karana_num == 1:
        karana_name = "Kimstughna"
    elif karana_num >= 57:
        karana_name = ["Shakuni", "Chatushpada", "Naga", "Kimstughna"][min(karana_num - 57, 3)]
    else:
        karana_name = KARANA_CYCLE[(karana_num - 2) % len(KARANA_CYCLE)]
    return {
        "weekday": WEEKDAYS[weekday],
        "tithi": {
            "number": tithi_num,
            "paksha": "Krishna" if tithi_num > 15 else "Shukla",
            "name": tithi_name,
            "startTime": local_time_string(float(tithi[1])),
            "endTime": local_time_string(float(tithi[2])),
            "percentLeft": interval_fraction_left(tithi[1], tithi[2], birth_hour),
        },
        "nakshatra": {
            "number": int(nakshatra[0]),
            "name": NAKSHATRAS[int(nakshatra[0]) - 1],
            "pada": int(nakshatra[1]),
            "lord": NAKSHATRA_LORDS[int(nakshatra[0]) - 1],
            "startTime": local_time_string(float(nakshatra[2])),
            "endTime": local_time_string(float(nakshatra[3])),
            "percentLeft": interval_fraction_left(nakshatra[2], nakshatra[3], birth_hour),
        },
        "yoga": {"number": int(yoga[0]), "name": YOGA_NAMES[int(yoga[0]) - 1], "startTime": local_time_string(float(yoga[1])), "endTime": local_time_string(float(yoga[2])), "percentLeft": round(float(yoga[3]) * 100, 2)},
        "karana": {"number": karana_num, "name": karana_name, "startTime": local_time_string(float(karana[1])), "endTime": local_time_string(float(karana[2])), "percentLeft": interval_fraction_left(karana[1], karana[2], birth_hour)},
        "lunarMonth": {"number": int(lunar_month) + 1, "name": LUNAR_MONTHS[int(lunar_month)], "isAdhika": bool(is_adhika), "isNija": bool(is_nija)},
        "sunrise": sunrise[1],
        "sunset": sunset[1],
        "dayLength": local_time_string(float(drik.day_length(jd, place))),
        "nightLength": local_time_string(float(drik.night_length(jd, place))),
    }


def chara_karakas(jd, place):
    raw = charts.rasi_chart(jd, place)
    order = house.chara_karakas(raw)
    return [{"karaka": KARAKA_NAMES[index], "planet": PLANETS.get(planet, str(planet))} for index, planet in enumerate(order)]


def special_lagnas(jd, place, rasi):
    asc_sign = next(item["signIndex"] for item in rasi if item["body"] == "Ascendant")
    calculators = [
        ("Bhava Lagna", drik.bhava_lagna), ("Hora Lagna", drik.hora_lagna), ("Ghati Lagna", drik.ghati_lagna),
        ("Vighati Lagna", drik.vighati_lagna), ("Pranapada Lagna", drik.pranapada_lagna), ("Indu Lagna", drik.indu_lagna),
        ("Bhrigu Bindu", drik.bhrigu_bindhu_lagna), ("Kunda Lagna", drik.kunda_lagna), ("Sree Lagna", drik.sree_lagna),
    ]
    values = []
    for label, calculator in calculators:
        sign, degree = calculator(jd, place)
        values.append(position_record(label, label, sign, degree, asc_sign))
    return values


def solar_upagrahas(jd, place, rasi):
    raw = charts.rasi_chart(jd, place)
    asc_sign = raw[0][1][0]
    sun_sign, sun_degree = raw[1][1]
    sun_longitude = sun_sign * 30 + sun_degree
    calculators = [("Dhuma", "dhuma"), ("Vyatipaata", "vyatipaata"), ("Parivesha", "parivesha"), ("Indrachaapa", "indrachaapa"), ("Upaketu", "upaketu")]
    values = []
    for label, upagraha in calculators:
        sign, degree = drik.solar_upagraha_longitudes(sun_longitude, upagraha)
        values.append(position_record(label, label, sign, degree, asc_sign))
    return values


def traditional_points(jd, place, rasi, varnada_method):
    """Return optional points whose calculation method is explicitly selected by the user."""
    asc_sign = next(item["signIndex"] for item in rasi if item["body"] == "Ascendant")
    year, month, day, decimal_hour = utils.jd_to_gregorian(jd)
    hour = int(decimal_hour)
    minute = int((decimal_hour - hour) * 60)
    second = int(round((((decimal_hour - hour) * 60) - minute) * 60))
    dob = (year, month, day)
    tob = (hour, minute, min(second, 59))
    varnada_sign, varnada_degree = charts.varnada_lagna(dob, tob, place, varnada_method=varnada_method)
    yogi_sign, yogi_degree = sphuta.yogi_sphuta(dob, tob, place)
    avayogi_sign, avayogi_degree = sphuta.avayogi_sphuta(dob, tob, place)
    return [
        position_record("Varnada Lagna", "varnada", varnada_sign, varnada_degree, asc_sign),
        position_record("Yogi Sphuta", "yogi", yogi_sign, yogi_degree, asc_sign),
        position_record("Avayogi Sphuta", "avayogi", avayogi_sign, avayogi_degree, asc_sign),
    ]


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
    parent_end = bhukti_start + (vimsottari.vimsottari_dict[bhukti_lord] * vimsottari.vimsottari_dict[maha_lord] / 120**2) * const.sidereal_year
    for index, (lord, start) in enumerate(pairs):
        next_start = pairs[index + 1][1] if index + 1 < len(pairs) else parent_end
        entries.append({"lord": PLANETS.get(lord, str(lord)), "start": jd_to_iso(start), "end": jd_to_iso(next_start), "current": lord == antara_lord})
    return {"maha": PLANETS.get(maha_lord, str(maha_lord)), "bhukti": PLANETS.get(bhukti_lord, str(bhukti_lord)), "antara": PLANETS.get(antara_lord, str(antara_lord)), "antaras": entries}


def _dasa_period_rows(entries, parent_end):
    pairs = list(entries.items())
    return [(lord, start, pairs[index + 1][1] if index + 1 < len(pairs) else parent_end) for index, (lord, start) in enumerate(pairs)]


def _dasa_node(lord, start, end, path, level, active_jd, rasi_by_body, strength_by_planet):
    planet = PLANETS.get(lord, str(lord))
    position = rasi_by_body.get(planet)
    strength = strength_by_planet.get(planet)
    placement = "D1 中未提供该主宰的行星位置。"
    if position:
        placement = f"D1：{position['sign']} 第 {position['house']} 宫，{position['formattedDegree']}。"
    strength_summary = "六力未提供该主宰数据。"
    if strength:
        strength_summary = f"Shadbala：{strength['rupas']:.2f} Rupa（{'达标' if strength['isStrong'] else '较弱'}）。"
    is_current = start <= active_jd < end
    return {
        "id": "-".join(str(value) for value in path),
        "path": [PLANETS.get(value, str(value)) for value in path],
        "level": DASA_LEVELS[level],
        "lord": planet,
        "start": jd_to_iso(start),
        "end": jd_to_iso(end),
        "years": round((end - start) / const.sidereal_year, 4),
        "status": "当前" if is_current else ("未来" if start > active_jd else "已结束"),
        "current": is_current,
        "analysis": {
            "traditionalTheme": DASA_THEMES.get(planet, "传统周期研究"),
            "placement": placement,
            "strength": strength_summary,
            "scope": "此节点仅展示传统规则化研究提示；不构成对事件结果、人生运势或重大决定的保证。",
        },
        "children": [],
    }


def dasa_timeline(jd, place, timezone, rasi, shadbala):
    now = dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=timezone)
    active_jd = swe.julday(now.year, now.month, now.day, now.hour + now.minute / 60 + now.second / 3600, swe.GREG_CAL)
    rasi_by_body = {item["body"]: item for item in rasi}
    strength_by_planet = {item["planet"]: item for item in shadbala}
    maha_entries = vimsottari.vimsottari_mahadasa(jd, place)
    maha_pairs = list(maha_entries.items())
    maha_end = maha_pairs[-1][1] + vimsottari.vimsottari_dict[maha_pairs[-1][0]] * const.sidereal_year
    nodes = []
    for maha_lord, maha_start, maha_finish in _dasa_period_rows(maha_entries, maha_end):
        maha_node = _dasa_node(maha_lord, maha_start, maha_finish, [maha_lord], 0, active_jd, rasi_by_body, strength_by_planet)
        bhukti_entries = vimsottari._vimsottari_bhukti(maha_lord, maha_start)
        for bhukti_lord, bhukti_start, bhukti_finish in _dasa_period_rows(bhukti_entries, maha_finish):
            bhukti_node = _dasa_node(bhukti_lord, bhukti_start, bhukti_finish, [maha_lord, bhukti_lord], 1, active_jd, rasi_by_body, strength_by_planet)
            antara_entries = vimsottari._vimsottari_antara(maha_lord, bhukti_lord, bhukti_start)
            bhukti_node["children"] = [
                _dasa_node(antara_lord, antara_start, antara_finish, [maha_lord, bhukti_lord, antara_lord], 2, active_jd, rasi_by_body, strength_by_planet)
                for antara_lord, antara_start, antara_finish in _dasa_period_rows(antara_entries, bhukti_finish)
            ]
            maha_node["children"].append(bhukti_node)
        nodes.append(maha_node)
    current_path = []
    current_maha = next((node for node in nodes if node["current"]), None)
    if current_maha:
        current_path.append(current_maha["id"])
        current_bhukti = next((node for node in current_maha["children"] if node["current"]), None)
        if current_bhukti:
            current_path.append(current_bhukti["id"])
            current_antara = next((node for node in current_bhukti["children"] if node["current"]), None)
            if current_antara:
                current_path.append(current_antara["id"])
    return {
        "nodes": nodes,
        "currentPath": current_path,
        "asOf": jd_to_iso(active_jd),
        "source": {"label": "PyJHora Vimsottari implementation", "url": VIMSOTTARI_SOURCE_URL},
        "scope": "点击周期可逐层查看 Mahadasa、Bhukti 与 Antara 的真实起止日、D1 位置与 Shadbala 参照；传统主题不是确定性运势承诺。",
    }


def yoga_results(jd, place):
    result = []
    sources = []
    catalog_count = 0
    for category, calculator, source_label, source_url in [
        ("Yoga", pyjhora_yoga.get_yoga_details, "PyJHora yoga.py", YOGA_SOURCE_URL),
        ("Raja Yoga", raja_yoga.get_raja_yoga_details, "PyJHora raja_yoga.py", RAJA_YOGA_SOURCE_URL),
    ]:
        records, _, catalog_size = calculator(jd, place, divisional_chart_factor=1, language="en")
        catalog_count += catalog_size
        sources.append({"category": category, "label": source_label, "url": source_url})
        for rule_key, details in records.items():
            values = list(details)
            result.append({
                "id": rule_key,
                "category": category,
                "chart": values[0] if len(values) > 0 else "D1",
                "name": values[1] if len(values) > 1 else rule_key,
                "rule": values[2] if len(values) > 2 else "PyJHora resource-backed rule matched.",
                "traditionalNote": values[3] if len(values) > 3 else "",
                "matched": True,
                "source": {"label": source_label, "url": source_url},
            })
    return result, {"catalogCount": catalog_count, "matchedCount": len(result), "sources": sources, "scope": "展示由当前 PyJHora 版本在 D1 命中的资源驱动规则。传统文本摘要用于研究溯源，不代表保证性结果或个人决策建议。"}


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
    left_gender = left.get("input", {}).get("gender", "UNSPECIFIED")
    right_gender = right.get("input", {}).get("gender", "UNSPECIFIED")
    if left_gender == "MALE" and right_gender == "FEMALE":
        boy_nak, girl_nak = left_nak, right_nak
        direction = {"mode": "traditional-gendered", "boyProfile": "A", "girlProfile": "B", "label": "按 A（男）→ B（女）的 PyJHora 传统顺序计算"}
    elif left_gender == "FEMALE" and right_gender == "MALE":
        boy_nak, girl_nak = right_nak, left_nak
        direction = {"mode": "traditional-gendered", "boyProfile": "B", "girlProfile": "A", "label": "按 B（男）→ A（女）的 PyJHora 传统顺序计算"}
    else:
        boy_nak, girl_nak = left_nak, right_nak
        direction = {"mode": "profile-order", "boyProfile": None, "girlProfile": None, "label": "性别未说明或不是传统男女配对；按 A → B 的档案选取顺序计算，不作性别化解释。"}
    ashta = compatibility.Ashtakoota(boy_nak["number"], boy_nak["pada"], girl_nak["number"], girl_nak["pada"])
    values = ashta.compatibility_score()
    components = [
        ("Varna", "Varna Koota", 1), ("Vashya", "Vashya Koota", 2), ("Gana", "Gana Koota", 6), ("Tara", "Tara Koota", 3),
        ("Yoni", "Yoni Koota", 4), ("Graha Maitri", "Graha Maitri", 5), ("Bhakoot", "Bhakoot / Rasi", 7), ("Nadi", "Nadi Koota", 8),
    ]
    additional = [
        {"key": "mahendra", "name": "Mahendra Porutham", "matched": bool(values[9])},
        {"key": "vedha", "name": "Vedha Porutham", "matched": bool(values[10])},
        {"key": "rajju", "name": "Rajju Porutham", "matched": bool(values[11])},
        {"key": "sthreeDheerga", "name": "Sthree Dheerga Porutham", "matched": bool(values[12])},
    ]
    left_moon = next(item for item in left["rasi"] if item["body"] == "Moon")
    right_moon = next(item for item in right["rasi"] if item["body"] == "Moon")
    left_nav_moon = next(item for item in left["navamsa"] if item["body"] == "Moon")
    right_nav_moon = next(item for item in right["navamsa"] if item["body"] == "Moon")
    return {
        "method": "Ashta Koota / North",
        "leftNakshatra": left_nak,
        "rightNakshatra": right_nak,
        "score": float(values[8]),
        "maximum": 36,
        "components": [{"key": key, "name": name, "score": float(values[index]), "maximum": maximum} for index, (key, name, maximum) in enumerate(components)],
        "additional": additional,
        "direction": direction,
        "chartContext": {
            "d1Moon": {"left": left_moon["sign"], "right": right_moon["sign"], "distance": ((right_moon["signIndex"] - left_moon["signIndex"]) % 12) + 1},
            "d9Moon": {"left": left_nav_moon["sign"], "right": right_nav_moon["sign"], "distance": ((right_nav_moon["signIndex"] - left_nav_moon["signIndex"]) % 12) + 1},
        },
        "source": {"label": "PyJHora compatibility.py", "url": COMPATIBILITY_SOURCE_URL},
        "scope": "八项分数合计为 36；四项 Porutham 为额外布尔匹配状态，不加入该总分。性别仅用于明确 PyJHora 传统男女配对时的计算顺序；未说明或非传统男女配对则保持档案顺序。D1/D9 月亮对照为位置事实，不是关系建议或结论。",
    }


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


def bhinna_ashtakavarga_scores(jd, place):
    rasi_chart = charts.rasi_chart(jd, place)
    house_to_planets = utils.get_house_planet_list_from_planet_positions(rasi_chart)
    bav, _, _ = ashtakavarga.get_ashtaka_varga(house_to_planets)
    return [{"body": BAV_BODIES[index], "points": [int(point) for point in points], "total": int(sum(points))} for index, points in enumerate(bav)]


def compute(payload):
    date = payload["date"]
    time = payload["time"]
    gender = str(payload.get("gender", "UNSPECIFIED")).upper()
    year, month, day = [int(part) for part in date.split("-")]
    hour, minute = [int(part) for part in time.split(":")]
    latitude = float(payload["latitude"])
    longitude = float(payload["longitude"])
    timezone = float(payload["timezone"])
    place_name = str(payload.get("placeName") or "Custom location")
    ayanamsa = AYANAMSA.get(str(payload.get("ayanamsa", "LAHIRI")).upper(), "LAHIRI")
    calendar = str(payload.get("calendar", "GREGORIAN")).upper()
    factor = int(payload.get("divisionalFactor", 1))
    varnada_method = int(payload.get("varnadaMethod", 1))
    include_traditional_points = bool(payload.get("includeTraditionalPoints", True))

    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise ValueError("Latitude or longitude is outside its valid range.")
    if factor < 1 or factor > 300:
        raise ValueError("Divisional factor must be between 1 and 300.")
    if calendar not in {"GREGORIAN", "JULIAN"}:
        raise ValueError("Calendar must be GREGORIAN or JULIAN.")
    if varnada_method not in VARNADA_METHODS:
        raise ValueError("Varnada method must be between 1 and 4.")
    if gender not in {"FEMALE", "MALE", "UNSPECIFIED"}:
        raise ValueError("Gender must be FEMALE, MALE, or UNSPECIFIED.")

    with contextlib.redirect_stdout(sys.stderr):
        drik.set_ayanamsa_mode(ayanamsa)
        place = drik.Place(place_name, latitude, longitude, timezone)
        calendar_flag = swe.JUL_CAL if calendar == "JULIAN" else swe.GREG_CAL
        jd = swe.julday(year, month, day, hour + minute / 60, calendar_flag)
        selected_chart = chart_items(jd, place, factor)
        rasi = selected_chart if factor == 1 else chart_items(jd, place, 1)
        navamsa = selected_chart if factor == 9 else chart_items(jd, place, 9)
        divisions = [{"factor": divisional_factor, "label": f"D-{divisional_factor}", "items": (selected_chart if factor == divisional_factor else chart_items(jd, place, divisional_factor))} for divisional_factor in VARGA_FACTORS]
        traditional = traditional_points(jd, place, rasi, varnada_method) if include_traditional_points else []
        shadbala = shadbala_scores(jd, place)
        yogas, yoga_meta = yoga_results(jd, place)
        now = dt.datetime.now() + dt.timedelta(hours=timezone)
        transit_jd = utils.julian_day_number((now.year, now.month, now.day), (now.hour, now.minute, 0))

    return {
        "engine": {"name": "PyJHora + Swiss Ephemeris", "license": "AGPL-3.0", "ayanamsa": ayanamsa, "ayanamsaValue": round(float(drik.get_ayanamsa_value(jd)), 6), "zodiac": "Sidereal"},
        "input": {"date": date, "time": time, "gender": gender, "calendar": calendar, "placeName": place_name, "latitude": latitude, "longitude": longitude, "latitudeDms": coordinate_dms(latitude, "N", "S"), "longitudeDms": coordinate_dms(longitude, "E", "W"), "timezone": timezone, "varnadaMethod": varnada_method, "includeTraditionalPoints": include_traditional_points},
        "selectedChart": {"factor": factor, "label": f"D-{factor}", "items": selected_chart},
        "rasi": rasi,
        "navamsa": navamsa,
        "divisions": divisions,
        "panchanga": panchanga(jd, place),
        "charaKarakas": chara_karakas(jd, place),
        "specialLagnas": special_lagnas(jd, place, rasi),
        "solarUpagrahas": solar_upagrahas(jd, place, rasi),
        "traditionalPoints": traditional,
        "traditionalConfig": {"enabled": include_traditional_points, "varnadaMethod": varnada_method, "varnadaMethodName": VARNADA_METHODS[varnada_method], "scope": "Varnada uses the selected published method; Yogi and Avayogi are returned as sphuta points from PyJHora."},
        "vimsottari": dasa_periods(jd, place),
        "fineDasa": fine_dasa(jd, place),
        "dasaTimeline": dasa_timeline(jd, place, timezone, rasi, shadbala),
        "yogas": yogas,
        "yogaMeta": yoga_meta,
        "muhurta": muhurta_windows(jd, place),
        "shadbala": shadbala,
        "sarvashtakavarga": sarvashtakavarga_scores(jd, place),
        "bhinnaAshtakavarga": bhinna_ashtakavarga_scores(jd, place),
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
