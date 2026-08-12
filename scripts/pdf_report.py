#!/usr/bin/env python3
"""Render a paginated, Chinese-safe Vedic Web Atlas PDF report."""

import base64
import io
import json
import sys
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
FONT = "STSong-Light"
NAVY = colors.HexColor("#15292F")
TEAL = colors.HexColor("#4E7E76")
PAPER = colors.HexColor("#FAF8F2")
LINE = colors.HexColor("#D2CEC3")
MUTED = colors.HexColor("#71807D")


def safe(value):
    return escape(str(value if value is not None else "—"))


def report_styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("atlas-title", parent=base["Title"], fontName=FONT, fontSize=21, leading=28, textColor=NAVY, spaceAfter=4 * mm),
        "subtitle": ParagraphStyle("atlas-subtitle", parent=base["Normal"], fontName=FONT, fontSize=9, leading=14, textColor=MUTED, spaceAfter=5 * mm),
        "section": ParagraphStyle("atlas-section", parent=base["Heading2"], fontName=FONT, fontSize=14, leading=20, textColor=NAVY, spaceBefore=5 * mm, spaceAfter=2.5 * mm),
        "body": ParagraphStyle("atlas-body", parent=base["Normal"], fontName=FONT, fontSize=9, leading=14, textColor=NAVY),
        "small": ParagraphStyle("atlas-small", parent=base["Normal"], fontName=FONT, fontSize=8, leading=12, textColor=MUTED),
        "note": ParagraphStyle("atlas-note", parent=base["Normal"], fontName=FONT, fontSize=8.5, leading=13, textColor=MUTED),
        "header": ParagraphStyle("atlas-header", parent=base["Normal"], fontName=FONT, fontSize=8, leading=10, textColor=PAPER),
        "cell": ParagraphStyle("atlas-cell", parent=base["Normal"], fontName=FONT, fontSize=8.5, leading=12, textColor=NAVY),
        "cell_center": ParagraphStyle("atlas-cell-center", parent=base["Normal"], fontName=FONT, fontSize=8.5, leading=12, textColor=NAVY, alignment=TA_CENTER),
    }


def p(value, style):
    return Paragraph(safe(value).replace("\n", "<br/>"), style)


def add_section(story, title, styles):
    story.append(Paragraph(title, styles["section"]))


def data_table(headers, rows, widths, styles, centered=()):
    data = [[Paragraph(safe(header), styles["header"]) for header in headers]]
    for row in rows:
        data.append([p(value, styles["cell_center"] if index in centered else styles["cell"]) for index, value in enumerate(row)])
    table = Table(data, colWidths=widths, repeatRows=1, splitByRow=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), PAPER),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PAPER, colors.white]),
    ]))
    return table


def page_chrome(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(LINE)
    canvas.line(doc.leftMargin, height - 16 * mm, width - doc.rightMargin, height - 16 * mm)
    canvas.setFont(FONT, 8)
    canvas.setFillColor(TEAL)
    canvas.drawString(doc.leftMargin, height - 11 * mm, "Vedic Web Atlas | PyJHora + Swiss Ephemeris | AGPL-3.0")
    canvas.setFillColor(MUTED)
    canvas.drawRightString(width - doc.rightMargin, 11 * mm, f"第 {doc.page} 页")
    canvas.restoreState()


def main():
    payload = json.load(sys.stdin)
    result = payload["result"]
    input_data = result["input"]
    styles = report_styles()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=17 * mm, rightMargin=17 * mm, topMargin=23 * mm, bottomMargin=18 * mm, title="Vedic Web Atlas 占星报告", author="Vedic Web Atlas")
    story = [
        Paragraph("Vedic Web Atlas 占星报告", styles["title"]),
        Paragraph("基于真实星历的结构化研究报告", styles["subtitle"]),
    ]

    overview_rows = [
        ["出生资料", f"{input_data['date']} {input_data['time']} | {input_data['placeName']}"],
        ["坐标与时区", f"{input_data['latitude']:.4f}, {input_data['longitude']:.4f} | UTC{input_data['timezone']:+g}"],
        ["计算参数", f"{input_data['calendar']} | {result['engine']['ayanamsa']} | {result['selectedChart']['label']}"],
        ["计算引擎", "PyJHora + Swiss Ephemeris（AGPL-3.0）"],
    ]
    overview = Table([[p(label, styles["small"]), p(value, styles["body"])] for label, value in overview_rows], colWidths=[30 * mm, 139 * mm], hAlign="LEFT")
    overview.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#EEF2EF")), ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.extend([overview, Spacer(1, 3 * mm)])

    add_section(story, "行星位置 | Rasi", styles)
    story.append(data_table(["天体", "星座", "位置"], [[item["body"], item["sign"], item["formattedDegree"]] for item in result["rasi"]], [44 * mm, 63 * mm, 62 * mm], styles, centered=(2,)))

    add_section(story, "Panchanga", styles)
    panchanga = result["panchanga"]
    story.append(data_table(["项目", "结果"], [
        ["周日", panchanga["weekday"]], ["Tithi", f"{panchanga['tithi']['paksha']} {panchanga['tithi']['number']}"],
        ["Nakshatra", f"{panchanga['nakshatra']['name']} | Pada {panchanga['nakshatra']['pada']}"],
        ["日出 / 日落", f"{panchanga['sunrise']} / {panchanga['sunset']}"],
    ], [50 * mm, 119 * mm], styles))

    fine = result.get("fineDasa", {})
    story.append(KeepTogether([
        Paragraph("Vimsottari Mahadasa", styles["section"]),
        data_table(["主周期", "开始", "结束", "年数"], [[period["lord"], period["start"], period["end"], f"{period['years']} 年"] for period in result["vimsottari"]], [37 * mm, 48 * mm, 48 * mm, 36 * mm], styles, centered=(3,)),
        Spacer(1, 2 * mm),
        p(f"当前子周期：{fine.get('maha', '—')} / {fine.get('bhukti', '—')} / {fine.get('antara', '—')}", styles["note"]),
    ]))

    add_section(story, "Yoga（当前规则集）", styles)
    yogas = result.get("yogas", [])
    yoga_rows = [[item.get("name", "—"), item.get("rule", "—"), "命中" if item.get("matched") else "未命中"] for item in yogas] or [["—", "此输入未命中当前显式规则集。", "—"]]
    story.append(data_table(["规则", "判断条件", "结果"], yoga_rows, [43 * mm, 97 * mm, 29 * mm], styles, centered=(2,)))

    add_section(story, "Muhurta", styles)
    story.append(data_table(["项目", "时间"], [[key, " | ".join(value) if isinstance(value, list) else value] for key, value in result.get("muhurta", {}).items()], [50 * mm, 119 * mm], styles))

    add_section(story, "Shadbala（行星六力）", styles)
    strength = result.get("shadbala", [])
    story.append(data_table(["行星", "Virupa", "Rupa", "判定"], [[item["planet"], f"{item['virupas']:.2f}", f"{item['rupas']:.2f}", "达标" if item["isStrong"] else "较弱"] for item in strength], [47 * mm, 42 * mm, 42 * mm, 38 * mm], styles, centered=(1, 2, 3)))

    add_section(story, "Sarvashtakavarga（十二宫评分）", styles)
    ashtaka_rows = []
    for index in range(0, len(result.get("sarvashtakavarga", [])), 3):
        row = []
        for item in result["sarvashtakavarga"][index:index + 3]:
            row.extend([item["sign"], str(item["points"])])
        ashtaka_rows.append(row + [""] * (6 - len(row)))
    story.append(data_table(["星座", "分数", "星座", "分数", "星座", "分数"], ashtaka_rows, [34 * mm, 22 * mm, 34 * mm, 22 * mm, 34 * mm, 23 * mm], styles, centered=(1, 3, 5)))

    comparison = payload.get("comparison")
    if comparison and comparison.get("compatibility"):
        comp = comparison["compatibility"]
        story.append(PageBreak())
        add_section(story, "双档案 Compatibility", styles)
        story.append(p(f"Ashta Koota：{comp['score']:.1f} / {comp['maximum']} | {comp['method']}", styles["body"]))
        story.append(Spacer(1, 2 * mm))
        story.append(data_table(["项目", "分数"], [[item["name"], str(item["score"])] for item in comp.get("components", [])], [120 * mm, 49 * mm], styles, centered=(1,)))
        story.append(Spacer(1, 2 * mm))
        story.append(p("范围：当前仅提供北印度 Ashta Koota 八项分数；不等同于完整合盘、关系建议或未来预测。", styles["note"]))

    story.extend([Spacer(1, 5 * mm), p("说明：本报告呈现天文计算与传统规则分项，不构成医疗、法律、财务或关系决策建议。", styles["note"])])
    doc.build(story, onFirstPage=page_chrome, onLaterPages=page_chrome)
    print(json.dumps({"filename": "vedic-web-atlas-report.pdf", "base64": base64.b64encode(buffer.getvalue()).decode("ascii")}))


if __name__ == "__main__":
    main()
