#!/usr/bin/env python3
"""Render a compact Vedic Web Atlas PDF from already computed, JSON-safe results."""
import base64
import io
import json
import sys
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfgen import canvas

pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
FONT = "STSong-Light"

def draw_lines(pdf, lines, y):
    for line in lines:
        if y < 48:
            pdf.showPage(); pdf.setFont(FONT, 10); y = 790
        pdf.drawString(44, y, str(line)[:105]); y -= 16
    return y

def main():
    payload = json.load(sys.stdin)
    result = payload["result"]
    buf = io.BytesIO(); pdf = canvas.Canvas(buf, pagesize=A4); pdf.setTitle("Vedic Web Atlas 占星报告")
    pdf.setFont(FONT, 18); pdf.drawString(44, 800, "Vedic Web Atlas 占星报告")
    pdf.setFont(FONT, 9); y = 775
    input_data = result["input"]
    y = draw_lines(pdf, ["计算引擎：PyJHora + Swiss Ephemeris（AGPL-3.0）", f"出生资料：{input_data['date']} {input_data['time']} · {input_data['placeName']}", f"坐标与时区：{input_data['latitude']:.4f}, {input_data['longitude']:.4f} · UTC{input_data['timezone']:+g}", f"参数：{input_data['calendar']} · {result['engine']['ayanamsa']} · {result['selectedChart']['label']}", "", "行星位置"], y)
    y = draw_lines(pdf, [f"{item['body']}: {item['sign']} {item['formattedDegree']}" for item in result["rasi"]], y)
    p = result["panchanga"]
    y = draw_lines(pdf, ["", "Panchanga", f"{p['weekday']} · Tithi {p['tithi']['paksha']} {p['tithi']['number']} · Nakshatra {p['nakshatra']['name']} Pada {p['nakshatra']['pada']}", f"Sunrise {p['sunrise']} · Sunset {p['sunset']}", "", "Vimsottari Mahadasa"], y)
    y = draw_lines(pdf, [f"{period['lord']}: {period['start']} – {period['end']} ({period['years']} 年)" for period in result["vimsottari"]], y)
    fine = result.get("fineDasa", {})
    y = draw_lines(pdf, ["", "当前子周期", f"{fine.get('maha', '—')} / {fine.get('bhukti', '—')} / {fine.get('antara', '—')}", "", "Yoga（当前规则集）"], y)
    yogas = result.get("yogas", [])
    y = draw_lines(pdf, [f"{item['name']}: {item['rule']}" for item in yogas] or ["此输入未命中当前显式规则集。"], y)
    muhurta = result.get("muhurta", {})
    y = draw_lines(pdf, ["", "Muhurta", *[f"{key}: {' – '.join(value)}" for key, value in muhurta.items()]], y)
    strength = result.get("shadbala", [])
    y = draw_lines(pdf, ["", "Shadbala（行星六力）", *[f"{item['planet']}: {item['rupas']:.2f} Rupa · {'达标' if item['isStrong'] else '较弱'}" for item in strength]], y)
    ashtaka = result.get("sarvashtakavarga", [])
    y = draw_lines(pdf, ["", "Sarvashtakavarga（十二宫评分）", *[f"{item['sign']}: {item['points']}" for item in ashtaka]], y)
    comparison = payload.get("comparison")
    if comparison and comparison.get("compatibility"):
        comp = comparison["compatibility"]
        y = draw_lines(pdf, ["", "双档案 Compatibility", f"Ashta Koota: {comp['score']:.1f} / {comp['maximum']} · {comp['method']}", *[f"{item['name']}: {item['score']}" for item in comp.get("components", [])], "范围：当前仅提供北印度 Ashta Koota 八项分数；不等同于完整合盘、关系建议或未来预测。"], y)
    y = draw_lines(pdf, ["", "说明：本报告呈现天文计算与传统规则分项，不构成医疗、法律、财务或关系决策建议。"], y)
    pdf.save()
    print(json.dumps({"filename": "vedic-web-atlas-report.pdf", "base64": base64.b64encode(buf.getvalue()).decode("ascii")}))

if __name__ == "__main__": main()
