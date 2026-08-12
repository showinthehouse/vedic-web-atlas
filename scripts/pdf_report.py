#!/usr/bin/env python3
"""Render a paginated, Chinese-safe Vedic Web Atlas PDF report."""

import base64
import io
import json
from pathlib import Path
import sys
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Flowable, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

FONT_PATHS = [
    Path("/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"),
    Path("/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf"),
]
FONT = "WenQuanYiZenHei"
for font_path in FONT_PATHS:
    if font_path.exists():
        pdfmetrics.registerFont(TTFont(FONT, str(font_path)))
        break
else:
    raise RuntimeError("No supported CJK TrueType font is installed for PDF generation.")
NAVY = colors.HexColor("#15292F")
TEAL = colors.HexColor("#4E7E76")
PAPER = colors.HexColor("#FAF8F2")
LINE = colors.HexColor("#D2CEC3")
MUTED = colors.HexColor("#71807D")
SHORT_SIGNS = ["Ar", "Ta", "Ge", "Ca", "Le", "Vi", "Li", "Sc", "Sg", "Cp", "Aq", "Pi"]


class NorthIndianChartFlowable(Flowable):
    """Vector North Indian chart, drawn from the same calculated division positions in the report."""

    def __init__(self, items, label, size=74 * mm):
        super().__init__()
        self.items = items
        self.label = label
        self.size = size
        self.width = size
        self.height = size

    def draw(self):
        canvas = self.canv
        s = self.size
        canvas.setStrokeColor(NAVY)
        canvas.setLineWidth(0.65)
        canvas.rect(1.5 * mm, 1.5 * mm, s - 3 * mm, s - 3 * mm)
        canvas.line(1.5 * mm, 1.5 * mm, s - 1.5 * mm, s - 1.5 * mm)
        canvas.line(s - 1.5 * mm, 1.5 * mm, 1.5 * mm, s - 1.5 * mm)
        canvas.line(s / 2, 1.5 * mm, s - 1.5 * mm, s / 2)
        canvas.line(s - 1.5 * mm, s / 2, s / 2, s - 1.5 * mm)
        canvas.line(s / 2, s - 1.5 * mm, 1.5 * mm, s / 2)
        canvas.line(1.5 * mm, s / 2, s / 2, 1.5 * mm)
        positions = [
            (s / 2, s - 10 * mm), (s - 18 * mm, s - 18 * mm), (s - 8 * mm, s / 2 + 7 * mm),
            (s - 12 * mm, s / 2 - 18 * mm), (s - 20 * mm, 15 * mm), (s / 2, 8 * mm),
            (20 * mm, 15 * mm), (12 * mm, s / 2 - 18 * mm), (8 * mm, s / 2 + 7 * mm),
            (18 * mm, s - 18 * mm), (s / 2 - 24 * mm, s - 24 * mm), (s / 2 + 24 * mm, s - 24 * mm),
        ]
        bodies = {}
        for item in self.items:
            bodies.setdefault(item.get("signIndex", 0), []).append(item)
        canvas.setFillColor(MUTED)
        canvas.setFont(FONT, 5.6)
        for sign_index, (x, y) in enumerate(positions):
            canvas.drawCentredString(x, y + 3.6 * mm, SHORT_SIGNS[sign_index])
            names = ["As" if point.get("body") == "Ascendant" else point.get("body", "")[:2] for point in bodies.get(sign_index, [])]
            canvas.setFillColor(TEAL)
            canvas.setFont(FONT, 6.2)
            canvas.drawCentredString(x, y, "·".join(names)[:18])
            canvas.setFillColor(MUTED)
            canvas.setFont(FONT, 5.6)
        canvas.setFillColor(NAVY)
        canvas.setFont(FONT, 7)
        canvas.drawCentredString(s / 2, s / 2 + 2 * mm, self.label)
        canvas.setFillColor(MUTED)
        canvas.setFont(FONT, 5.4)
        canvas.drawCentredString(s / 2, s / 2 - 2 * mm, "NORTH INDIAN · SIDEREAL")


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


def position_rows(items):
    return [[
        item.get("body", "—"), item.get("sign", "—"), str(item.get("house", "—")), item.get("formattedDegree", "—"),
        item.get("nakshatra", {}).get("name", "—"), str(item.get("nakshatra", {}).get("pada", "—")), item.get("nakshatra", {}).get("lord", "—"),
    ] for item in items]


def page_chrome(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(LINE)
    canvas.line(doc.leftMargin, height - 16 * mm, width - doc.rightMargin, height - 16 * mm)
    canvas.setFont(FONT, 8)
    canvas.setFillColor(TEAL)
    canvas.drawString(doc.leftMargin, height - 11 * mm, getattr(doc, "atlas_header", "Vedic Web Atlas | PyJHora + Swiss Ephemeris | AGPL-3.0"))
    canvas.setFillColor(MUTED)
    canvas.drawRightString(width - doc.rightMargin, 11 * mm, f"第 {doc.page} 页")
    canvas.restoreState()


DEFAULT_REPORT_SECTIONS = ["overview", "charts", "panchanga", "derived", "dasaYoga", "muhurta", "strength", "divisions", "compatibility"]
TEMPLATES = {
    "zh-CN": {
        "title": "Vedic Web Atlas 占星报告", "subtitle": "基于真实星历的可配置研究报告", "overview": "计算总览", "toc": "目录 | 已选章节", "charts": "Rasi 与北印度分盘图", "panchanga": "Panchanga", "derived": "Karaka、Lagna 与派生点", "dasa": "Vimsottari 节点与 Yoga", "muhurta": "Muhurta", "strength": "力量与 Ashtakavarga", "divisions": "分盘总览", "compatibility": "双档案 Compatibility",
        "gender": "性别", "notSpecified": "未说明", "scope": "本报告展示真实天文计算和传统规则分项，不构成对事件、关系或重大决定的保证。",
    },
    "en": {
        "title": "Vedic Web Atlas Research Report", "subtitle": "A configurable research report generated from calculated sidereal ephemeris data", "overview": "Calculation overview", "toc": "Contents | Selected sections", "charts": "Rasi and North Indian divisional charts", "panchanga": "Panchanga", "derived": "Karaka, Lagna and derived points", "dasa": "Vimsottari nodes and Yogas", "muhurta": "Muhurta", "strength": "Strength and Ashtakavarga", "divisions": "Divisional chart compendium", "compatibility": "Profile Compatibility",
        "gender": "Gender", "notSpecified": "Not specified", "scope": "This report presents calculated astronomical data and traditional rule components. It does not guarantee events, relationship outcomes, or major decisions.",
    },
}


def selected_section(sections, key):
    return key in sections


def gender_label(value, language):
    values = {"FEMALE": ("女", "Female"), "MALE": ("男", "Male"), "UNSPECIFIED": ("未说明", "Not specified")}
    return values.get(value, values["UNSPECIFIED"])[1 if language == "en" else 0]


def find_current_dasa_node(nodes):
    for node in nodes:
        if node.get("current"):
            nested = find_current_dasa_node(node.get("children", []))
            return nested or node
        nested = find_current_dasa_node(node.get("children", []))
        if nested:
            return nested
    return None


def build_configured_story(result, comparison, options, styles):
    language = options.get("language", "zh-CN")
    language = language if language in TEMPLATES else "zh-CN"
    text = TEMPLATES[language]
    sections = set(options.get("sections") or DEFAULT_REPORT_SECTIONS)
    input_data = result["input"]
    story = [Paragraph(text["title"], styles["title"]), Paragraph(text["subtitle"], styles["subtitle"])]

    if selected_section(sections, "overview"):
        overview_rows = [
            ["出生资料" if language == "zh-CN" else "Birth data", f"{input_data['date']} {input_data['time']} | {input_data['placeName']}"],
            [text["gender"], gender_label(input_data.get("gender", "UNSPECIFIED"), language)],
            ["坐标与时区" if language == "zh-CN" else "Coordinates and time zone", f"{input_data.get('latitudeDms', input_data['latitude'])}, {input_data.get('longitudeDms', input_data['longitude'])} | UTC{input_data['timezone']:+g}"],
            ["计算参数" if language == "zh-CN" else "Calculation settings", f"{input_data['calendar']} | {result['engine']['zodiac']} | {result['engine']['ayanamsa']} | {result['engine'].get('ayanamsaValue', '—')}°"],
            ["计算引擎" if language == "zh-CN" else "Calculation engine", "PyJHora + Swiss Ephemeris (AGPL-3.0)"],
        ]
        add_section(story, text["overview"], styles)
        overview = Table([[p(label, styles["small"]), p(value, styles["body"])] for label, value in overview_rows], colWidths=[42 * mm, 127 * mm], hAlign="LEFT")
        overview.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#EEF2EF")), ("GRID", (0, 0), (-1, -1), 0.35, LINE), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
        story.append(overview)

    story.append(PageBreak())
    add_section(story, text["toc"], styles)
    toc_lookup = [("overview", text["overview"]), ("charts", text["charts"]), ("panchanga", text["panchanga"]), ("derived", text["derived"]), ("dasaYoga", text["dasa"]), ("muhurta", text["muhurta"]), ("strength", text["strength"]), ("divisions", text["divisions"]), ("compatibility", text["compatibility"])]
    toc_rows = [[f"{index:02d}", name, "Selected" if language == "en" else "已选"] for index, (key, name) in enumerate(toc_lookup, 1) if selected_section(sections, key)]
    story.append(data_table(["#", "Section" if language == "en" else "章节", "Status" if language == "en" else "状态"], toc_rows, [20 * mm, 107 * mm, 42 * mm], styles, centered=(0, 2)))

    if selected_section(sections, "charts"):
        divisions_by_factor = {division.get("factor"): division for division in result.get("divisions", [])}
        visual_cards = []
        for factor in [1, 9, 10, 60]:
            division = divisions_by_factor.get(factor)
            if division:
                visual_cards.append([Paragraph(f"{division.get('label', f'D-{factor}')} | North Indian chart", styles["small"]), Spacer(1, 1 * mm), NorthIndianChartFlowable(division.get("items", []), division.get("label", f"D-{factor}"), 72 * mm)])
        story.extend([PageBreak(), Paragraph(text["charts"], styles["section"]), p("As = Ascendant; other labels are planet abbreviations. Charts are drawn from the same calculated division positions." if language == "en" else "以下图形由同一份真实分盘位置数据直接绘制，图内 As 表示 Ascendant，其他为天体缩写。", styles["note"]), Spacer(1, 2 * mm)])
        if len(visual_cards) == 4:
            story.append(Table([[visual_cards[0], visual_cards[1]], [visual_cards[2], visual_cards[3]]], colWidths=[84 * mm, 84 * mm], hAlign="LEFT", style=[("VALIGN", (0, 0), (-1, -1), "TOP"), ("BOX", (0, 0), (-1, -1), 0.3, LINE), ("INNERGRID", (0, 0), (-1, -1), 0.3, LINE), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
        story.append(Spacer(1, 4 * mm))
        story.append(KeepTogether(data_table(["Body" if language == "en" else "天体", "Sign" if language == "en" else "星座", "House" if language == "en" else "宫位", "Position" if language == "en" else "位置", "Nakshatra", "Pada", "Lord" if language == "en" else "宿主"], position_rows(result["rasi"]), [22 * mm, 28 * mm, 16 * mm, 25 * mm, 34 * mm, 16 * mm, 28 * mm], styles, centered=(2, 3, 5))))

    if selected_section(sections, "panchanga"):
        panchanga = result["panchanga"]
        rows = [["Lunar month", f"{panchanga['lunarMonth']['name']} ({panchanga['lunarMonth']['number']})", "—"], ["Vara", panchanga["weekday"], "Sunrise to next sunrise"], ["Tithi", f"{panchanga['tithi']['paksha']} {panchanga['tithi']['name']}", f"{panchanga['tithi'].get('startTime', '—')}–{panchanga['tithi'].get('endTime', '—')}"], ["Nakshatra", f"{panchanga['nakshatra']['name']} · Pada {panchanga['nakshatra']['pada']}", f"{panchanga['nakshatra'].get('startTime', '—')}–{panchanga['nakshatra'].get('endTime', '—')}"], ["Yoga", panchanga["yoga"]["name"], f"{panchanga['yoga'].get('startTime', '—')}–{panchanga['yoga'].get('endTime', '—')}"], ["Karana", panchanga["karana"]["name"], f"{panchanga['karana'].get('startTime', '—')}–{panchanga['karana'].get('endTime', '—')}"]]
        story.extend([PageBreak(), Paragraph(text["panchanga"], styles["section"]), data_table(["Item" if language == "en" else "项目", "Result" if language == "en" else "结果", "Time" if language == "en" else "时段"], rows, [31 * mm, 80 * mm, 58 * mm], styles)])

    if selected_section(sections, "derived"):
        story.extend([PageBreak(), Paragraph(text["derived"], styles["section"]), data_table(["Karaka", "Planet" if language == "en" else "行星"], [[item["karaka"], item["planet"]] for item in result.get("charaKarakas", [])], [84 * mm, 85 * mm], styles), Spacer(1, 3 * mm), Paragraph("Special Lagna / Derived points", styles["section"]), data_table(["Point" if language == "en" else "点位", "Sign" if language == "en" else "星座", "House" if language == "en" else "宫位", "Position" if language == "en" else "位置", "Nakshatra", "Pada", "Lord" if language == "en" else "宿主"], position_rows(result.get("specialLagnas", [])), [26 * mm, 25 * mm, 15 * mm, 24 * mm, 34 * mm, 16 * mm, 29 * mm], styles, centered=(2, 3, 5))])
        traditional = result.get("traditionalPoints", [])
        if result.get("traditionalConfig", {}).get("enabled") and traditional:
            story.extend([Spacer(1, 3 * mm), Paragraph(f"Traditional points | {result.get('traditionalConfig', {}).get('varnadaMethodName', 'Varnada')}", styles["section"]), p(result.get("traditionalConfig", {}).get("scope", ""), styles["note"]), data_table(["Point" if language == "en" else "点位", "Sign" if language == "en" else "星座", "House" if language == "en" else "宫位", "Position" if language == "en" else "位置", "Nakshatra", "Pada", "Lord" if language == "en" else "宿主"], position_rows(traditional), [26 * mm, 25 * mm, 15 * mm, 24 * mm, 34 * mm, 16 * mm, 29 * mm], styles, centered=(2, 3, 5))])

    if selected_section(sections, "dasaYoga"):
        timeline = result.get("dasaTimeline", {})
        current_node = find_current_dasa_node(timeline.get("nodes", []))
        dasa_rows = [[period["lord"], period["start"], period["end"], f"{period['years']} years"] for period in result.get("vimsottari", [])]
        story.extend([PageBreak(), Paragraph(text["dasa"], styles["section"]), data_table(["Lord" if language == "en" else "主周期", "Start" if language == "en" else "开始", "End" if language == "en" else "结束", "Years" if language == "en" else "年数"], dasa_rows, [37 * mm, 48 * mm, 48 * mm, 36 * mm], styles, centered=(3,))])
        if current_node:
            story.extend([Spacer(1, 2 * mm), p(f"Current node: {' / '.join(current_node.get('path', []))} | {current_node.get('start')} → {current_node.get('end')} | {current_node.get('analysis', {}).get('traditionalTheme', '—')}", styles["note"]), p(current_node.get("analysis", {}).get("scope", ""), styles["note"])])
        yoga_rows = [[item.get("category", "Yoga"), item.get("chart", "D1"), item.get("name", "—"), item.get("rule", "—"), item.get("source", {}).get("label", "PyJHora")] for item in result.get("yogas", [])] or [["—", "—", "—", "No matched rules", "PyJHora"]]
        story.extend([Spacer(1, 4 * mm), Paragraph("Yoga | traceable rules", styles["section"]), data_table(["Type", "Chart", "Rule", "Match condition", "Source"], yoga_rows, [22 * mm, 18 * mm, 38 * mm, 66 * mm, 25 * mm], styles)])

    if selected_section(sections, "muhurta"):
        story.extend([PageBreak(), Paragraph(text["muhurta"], styles["section"]), data_table(["Item", "Time"], [[key, " | ".join(value) if isinstance(value, list) else value] for key, value in result.get("muhurta", {}).items()], [50 * mm, 119 * mm], styles)])

    if selected_section(sections, "strength"):
        strength_rows = [[item["planet"], f"{item['virupas']:.2f}", f"{item['rupas']:.2f}", "Meets threshold" if item["isStrong"] and language == "en" else "达标" if item["isStrong"] else "Below threshold" if language == "en" else "较弱"] for item in result.get("shadbala", [])]
        ashtaka_rows = []
        ashtaka = result.get("sarvashtakavarga", [])
        for index in range(0, len(ashtaka), 3):
            row = []
            for item in ashtaka[index:index + 3]:
                row.extend([item["sign"], str(item["points"])])
            ashtaka_rows.append(row + [""] * (6 - len(row)))
        story.extend([PageBreak(), Paragraph(text["strength"], styles["section"]), data_table(["Planet" if language == "en" else "行星", "Virupa", "Rupa", "Status" if language == "en" else "判定"], strength_rows, [47 * mm, 42 * mm, 42 * mm, 38 * mm], styles, centered=(1, 2, 3)), Spacer(1, 3 * mm), Paragraph("Sarvashtakavarga", styles["section"]), data_table(["Sign", "Points", "Sign", "Points", "Sign", "Points"], ashtaka_rows, [34 * mm, 22 * mm, 34 * mm, 22 * mm, 34 * mm, 23 * mm], styles, centered=(1, 3, 5))])

    if selected_section(sections, "divisions") and result.get("divisions"):
        story.extend([PageBreak(), Paragraph(text["divisions"], styles["section"]), p("All listed divisions are recalculated from the same birth data and selected ayanamsa." if language == "en" else "以下每个分盘均由相同出生资料、地点、历法与 Ayanamsa 设置重新计算。", styles["note"])])
        for division in result.get("divisions", []):
            story.extend([Spacer(1, 2 * mm), Paragraph(f"{division.get('label', 'D-?')} | positions", styles["section"]), data_table(["Body", "Sign", "House", "Position", "Nakshatra", "Pada", "Lord"], position_rows(division.get("items", [])), [22 * mm, 28 * mm, 16 * mm, 25 * mm, 34 * mm, 16 * mm, 28 * mm], styles, centered=(2, 3, 5))])

    if selected_section(sections, "compatibility") and comparison and comparison.get("compatibility"):
        comp = comparison["compatibility"]
        rows = [[item["name"], f"{item['score']}{' / ' + str(item['maximum']) if item.get('maximum') else ''}"] for item in comp.get("components", [])] + [[item["name"], "Match" if item.get("matched") else "No match"] for item in comp.get("additional", [])]
        story.extend([PageBreak(), Paragraph(text["compatibility"], styles["section"]), p(f"Ashta Koota: {comp['score']:.1f} / {comp['maximum']} | {comp['method']}", styles["body"]), p(f"Direction: {comp.get('direction', {}).get('label', 'Profile order')}", styles["note"]), data_table(["Component", "Score / state"], rows, [120 * mm, 49 * mm], styles, centered=(1,)), p(comp.get("scope", text["scope"]), styles["note"])])

    story.extend([Spacer(1, 5 * mm), p(text["scope"], styles["note"])])
    return story, language


def main():
    payload = json.load(sys.stdin)
    result = payload["result"]
    input_data = result["input"]
    styles = report_styles()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=17 * mm, rightMargin=17 * mm, topMargin=23 * mm, bottomMargin=18 * mm, title="Vedic Web Atlas 占星报告", author="Vedic Web Atlas")
    options = payload.get("options")
    if options:
        story, language = build_configured_story(result, payload.get("comparison"), options, styles)
        doc.atlas_header = "Vedic Web Atlas | PyJHora + Swiss Ephemeris | AGPL-3.0" if language == "en" else "Vedic Web Atlas | PyJHora + Swiss Ephemeris | AGPL-3.0"
        doc.build(story, onFirstPage=page_chrome, onLaterPages=page_chrome)
        print(json.dumps({"filename": "vedic-web-atlas-report.pdf", "base64": base64.b64encode(buffer.getvalue()).decode("ascii")}))
        return
    story = [
        Paragraph("Vedic Web Atlas 占星报告", styles["title"]),
        Paragraph("基于真实星历的高密度参数研究报告", styles["subtitle"]),
    ]

    overview_rows = [
        ["出生资料", f"{input_data['date']} {input_data['time']} | {input_data['placeName']}"],
        ["坐标与时区", f"{input_data.get('latitudeDms', input_data['latitude'])}, {input_data.get('longitudeDms', input_data['longitude'])} | UTC{input_data['timezone']:+g}"],
        ["计算参数", f"{input_data['calendar']} | {result['engine']['zodiac']} | {result['engine']['ayanamsa']} | 岁差 {result['engine'].get('ayanamsaValue', '—')}°"],
        ["报告范围", "已支持：Rasi、五支历、Jaimini Karaka、特殊 Lagna、太阳虚点、可选 Varnada / Yogi / Avayogi、Sarva/Bhinna Ashtakavarga、分盘 D1–D60、Dasa、Yoga、Muhurta、Shadbala。"],
        ["当前边界", "Maandi/Gulika 因流派与计算口径差异尚未纳入本版。Varnada 按输入所选方法计算；本报告仅列示真实计算参数，不生成个人预测或决策结论。"],
        ["计算引擎", "PyJHora + Swiss Ephemeris（AGPL-3.0）"],
    ]
    overview = Table([[p(label, styles["small"]), p(value, styles["body"])] for label, value in overview_rows], colWidths=[30 * mm, 139 * mm], hAlign="LEFT")
    overview.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#EEF2EF")), ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.extend([overview, Spacer(1, 3 * mm)])

    story.append(PageBreak())
    add_section(story, "目录 | 报告章节指引", styles)
    toc_rows = [
        ["01", "计算总览与 Rasi D1", "出生资料、计算参数、行星位置"],
        ["02", "北印度分盘图", "D1、D9、D10、D60 的图形总览"],
        ["03", "Panchanga 与传统派生点", "五支历、Karaka、Lagna、虚点与可选传统点"],
        ["04", "周期、力量与 Ashtakavarga", "Vimsottari、Yoga、Muhurta、Shadbala、SAV/BAV"],
        ["05", "分盘总览", "D1–D60 的完整位置表"],
    ]
    story.append(data_table(["章节", "内容", "覆盖参数"], toc_rows, [20 * mm, 52 * mm, 97 * mm], styles, centered=(0,)))
    story.append(Spacer(1, 5 * mm))
    story.append(p("目录页用于快速定位参数层级；实际页码会随所选分盘、比较模块和表格分页变化。", styles["note"]))

    divisions_by_factor = {division.get("factor"): division for division in result.get("divisions", [])}
    visual_factors = [1, 9, 10, 60]
    visual_cards = []
    for factor in visual_factors:
        division = divisions_by_factor.get(factor)
        if division:
            visual_cards.append([
                Paragraph(f"{division.get('label', f'D-{factor}')} | 北印度分盘图", styles["small"]),
                Spacer(1, 1 * mm),
                NorthIndianChartFlowable(division.get("items", []), division.get("label", f"D-{factor}"), 72 * mm),
            ])
    if visual_cards:
        story.append(PageBreak())
        add_section(story, "北印度分盘图 | Visual Varga Atlas", styles)
        story.append(p("以下图形由同一份真实分盘位置数据直接绘制，图内 As 表示 Ascendant，其他为天体缩写。", styles["note"]))
        story.append(Spacer(1, 2 * mm))
        story.append(Table([[visual_cards[0], visual_cards[1]], [visual_cards[2], visual_cards[3]]], colWidths=[84 * mm, 84 * mm], hAlign="LEFT", style=[("VALIGN", (0, 0), (-1, -1), "TOP"), ("BOX", (0, 0), (-1, -1), 0.3, LINE), ("INNERGRID", (0, 0), (-1, -1), 0.3, LINE), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
    story.append(PageBreak())

    add_section(story, "Rasi | D1 行星位置", styles)
    story.append(data_table(["天体", "星座", "宫位", "位置", "星宿", "Pada", "宿主"], position_rows(result["rasi"]), [22 * mm, 28 * mm, 16 * mm, 25 * mm, 34 * mm, 16 * mm, 28 * mm], styles, centered=(2, 3, 5)))

    panchanga = result["panchanga"]
    panchanga_table = data_table(["项目", "结果", "时段 / 余量"], [
        ["Lunar month", f"{panchanga['lunarMonth']['name']}（第 {panchanga['lunarMonth']['number']} 月）" + (" · Adhika" if panchanga['lunarMonth'].get('isAdhika') else "") + (" · Nija" if panchanga['lunarMonth'].get('isNija') else ""), "—"],
        ["Vara", panchanga["weekday"], "日出至次日日出"],
        ["Tithi", f"{panchanga['tithi']['paksha']} {panchanga['tithi']['name']}（#{panchanga['tithi']['number']}）", f"{panchanga['tithi'].get('startTime', '—')}–{panchanga['tithi']['endTime']} · 余 {panchanga['tithi'].get('percentLeft', '—')}%"],
        ["Nakshatra", f"{panchanga['nakshatra']['name']}（#{panchanga['nakshatra']['number']}）· Pada {panchanga['nakshatra']['pada']} · {panchanga['nakshatra'].get('lord', '—')}", f"{panchanga['nakshatra'].get('startTime', '—')}–{panchanga['nakshatra']['endTime']} · 余 {panchanga['nakshatra'].get('percentLeft', '—')}%"],
        ["Yoga", f"{panchanga['yoga']['name']}（#{panchanga['yoga']['number']}）", f"{panchanga['yoga']['startTime']}–{panchanga['yoga']['endTime']} · 余 {panchanga['yoga'].get('percentLeft', '—')}%"],
        ["Karana", f"{panchanga['karana']['name']}（#{panchanga['karana']['number']}）", f"{panchanga['karana']['startTime']}–{panchanga['karana']['endTime']} · 余 {panchanga['karana'].get('percentLeft', '—')}%"],
        ["日出 / 日落", f"{panchanga['sunrise']} / {panchanga['sunset']}", f"昼长 {panchanga.get('dayLength', '—')} · 夜长 {panchanga.get('nightLength', '—')}"],
    ], [31 * mm, 80 * mm, 58 * mm], styles)
    story.append(KeepTogether([Paragraph("Panchanga", styles["section"]), panchanga_table]))
    story.append(Spacer(1, 3 * mm))
    add_section(story, "Jaimini Chara Karaka", styles)
    story.append(data_table(["Karaka", "行星"], [[item["karaka"], item["planet"]] for item in result.get("charaKarakas", [])], [84 * mm, 85 * mm], styles))

    add_section(story, "特殊 Lagna 与派生点（D1）", styles)
    story.append(data_table(["点位", "星座", "宫位", "位置", "星宿", "Pada", "宿主"], position_rows(result.get("specialLagnas", [])), [26 * mm, 25 * mm, 15 * mm, 24 * mm, 34 * mm, 16 * mm, 29 * mm], styles, centered=(2, 3, 5)))

    add_section(story, "太阳虚点 | Solar Upagraha（D1）", styles)
    story.append(data_table(["虚点", "星座", "宫位", "位置", "星宿", "Pada", "宿主"], position_rows(result.get("solarUpagrahas", [])), [26 * mm, 25 * mm, 15 * mm, 24 * mm, 34 * mm, 16 * mm, 29 * mm], styles, centered=(2, 3, 5)))

    traditional = result.get("traditionalPoints", [])
    traditional_config = result.get("traditionalConfig", {})
    if traditional_config.get("enabled") and traditional:
        add_section(story, f"可选传统点 | {traditional_config.get('varnadaMethodName', 'Varnada')}", styles)
        story.append(p(traditional_config.get("scope", "Varnada uses the selected method; Yogi and Avayogi are returned as sphuta points."), styles["note"]))
        story.append(Spacer(1, 2 * mm))
        story.append(data_table(["点位", "星座", "宫位", "位置", "星宿", "Pada", "宿主"], position_rows(traditional), [26 * mm, 25 * mm, 15 * mm, 24 * mm, 34 * mm, 16 * mm, 29 * mm], styles, centered=(2, 3, 5)))

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

    add_section(story, "Bhinna Ashtakavarga（按行星）", styles)
    short_signs = ["Ar", "Ta", "Ge", "Ca", "Le", "Vi", "Li", "Sc", "Sg", "Cp", "Aq", "Pi"]
    bav_rows = [[item["body"], str(item["total"])] + [str(value) for value in item["points"]] for item in result.get("bhinnaAshtakavarga", [])]
    story.append(data_table(["行星", "总分"] + short_signs, bav_rows, [20 * mm, 13 * mm] + [11.33 * mm] * 12, styles, centered=tuple(range(1, 14))))

    divisions = result.get("divisions", [])
    if divisions:
        story.append(PageBreak())
        add_section(story, "分盘总览 | Varga Compendium", styles)
        story.append(p("以下每个分盘均由相同出生资料、地点、历法与 Ayanamsa 设置重新计算。表格显示 Ascendant、七曜与交点的星座、宫位、度数、星宿与 Pada。", styles["note"]))
        for division in divisions:
            story.append(Spacer(1, 2 * mm))
            story.append(Paragraph(f"{division.get('label', 'D-?')} | 分盘位置", styles["section"]))
            story.append(data_table(["天体", "星座", "宫位", "位置", "星宿", "Pada", "宿主"], position_rows(division.get("items", [])), [22 * mm, 28 * mm, 16 * mm, 25 * mm, 34 * mm, 16 * mm, 28 * mm], styles, centered=(2, 3, 5)))

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
