import contextlib
import json
import sys

with contextlib.redirect_stdout(sys.stderr):
    from jhora import utils
    from jhora.horoscope.chart import ashtakavarga, charts
    from jhora.panchanga import drik

place = drik.Place("Chennai, India", 13.0878, 80.2785, 5.5)
jd = utils.julian_day_number((1996, 12, 7), (10, 34, 0))
chart = charts.rasi_chart(jd, place)
house_to_planet = utils.get_house_planet_list_from_planet_positions(chart)
binna, sarva, _ = ashtakavarga.get_ashtaka_varga(house_to_planet)
print(json.dumps({"houseToPlanet": house_to_planet, "sarva": sarva, "total": sum(sarva)}))
