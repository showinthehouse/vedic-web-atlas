# 规则与数据来源说明

本项目的计算层直接使用 **PyJHora 4.8.7** 与 Swiss Ephemeris。以下条目用于界面和 PDF 的“规则来源”链接；它们说明算法/代码出处，不构成对个人人生、关系或决策的确定性判断。

| 模块 | 应用中的可追溯规则范围 | 一手来源 |
| --- | --- | --- |
| Vimsottari Dasa | Mahadasa、Bhukti、Antara 的层级起止时间与当前运行层级 | [PyJHora `vimsottari.py`](https://github.com/naturalstupid/PyJHora/blob/master/src/jhora/horoscope/dhasa/graha/vimsottari.py) |
| Yoga | PyJHora 的资源驱动 Yoga 检测器及其返回的名称、规则描述与传统文本摘要 | [PyJHora `yoga.py`](https://github.com/naturalstupid/PyJHora/blob/master/src/jhora/horoscope/chart/yoga.py) |
| Raja Yoga | Kendra/Trikona lord association、Vipareeta 与 Neecha Bhanga 等由 PyJHora 实现的检测范围 | [PyJHora `raja_yoga.py`](https://github.com/naturalstupid/PyJHora/blob/master/src/jhora/horoscope/chart/raja_yoga.py) |
| Compatibility | North Ashta Koota 八项分数及 Mahendra、Vedha、Rajju、Sthree Dheerga 辅助匹配状态 | [PyJHora `compatibility.py`](https://github.com/naturalstupid/PyJHora/blob/master/src/jhora/horoscope/match/compatibility.py) |
| 星历与许可证 | 恒星黄道位置、历法与开源许可路径 | [PyJHora 项目主页](https://github.com/naturalstupid/PyJHora)；[Swiss Ephemeris](https://www.astro.com/swisseph/) |

> PyJHora 项目说明其实现参考 P. V. R. Narasimha Rao 的 *Vedic Astrology – An Integrated Approach* 与 Jagannatha Hora，并包含大量与相关示例对照的测试；本项目不会把传统规则标签转化为保证性结果或替代专业建议。[1]

## 本轮实现边界

“节点分析”将展示周期的**层级、行星主宰、起止日、当前状态和规则化研究提示**，以便用户逐层浏览 Mahadasa → Bhukti → Antara。它不会把任何周期标签转换为确定性的好运/厄运承诺，亦不会据此给出重大人生决定。

Compatibility 将把当前的八项总分与四项 PyJHora 辅助 porutham 状态一起呈现，并在每项旁标注评分或布尔匹配含义。该模块仍是传统规则的结构化计算，不等同于完整合盘、关系诊断或关系建议。

[1]: https://github.com/naturalstupid/PyJHora
