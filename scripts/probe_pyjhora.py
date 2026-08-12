import json

from jhora import utils
from jhora.horoscope.chart import charts
from jhora.horoscope.dhasa.graha import vimsottari
from jhora.panchanga import drik

dob = (1996, 12, 7)
tob = (10, 34, 0)
place = drik.Place("Chennai, India", 13.0878, 80.2785, 5.5)
jd = utils.julian_day_number(dob, tob)

payload = {
    "jd": jd,
    "ascendant": drik.ascendant(jd, place),
    "planets": drik.dhasavarga(jd, place, divisional_chart_factor=1),
    "d1": charts.divisional_chart(jd, place, divisional_chart_factor=1),
    "d9": charts.divisional_chart(jd, place, divisional_chart_factor=9),
    "tithi": drik.tithi(jd, place),
    "nakshatra": drik.nakshatra(jd, place),
    "dasa": vimsottari.get_vimsottari_dhasa_bhukthi(jd, place)[1][:3],
}
print(json.dumps(payload, default=str, indent=2))
