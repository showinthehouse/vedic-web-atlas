# 专业占星报告内容矩阵参考

## 参考来源与使用边界

用户提供的同类软件报告（本地副本：`/home/ubuntu/upload/vedic_reference_report.pdf`）被用作**内容密度、参数层级与章节组织**参考。它不是当前应用数据来源，应用不复制其数值，也不采用未经 PyJHora + Swiss Ephemeris 验证的算法或解释。

## 参考报告的主要内容层级

| 层级 | 参考报告所含内容 | 当前增强后的真实映射 |
|---|---|---|
| 基础资料 | 出生时刻、经纬度、UTC、恒星黄道、Ayanamsa | 完整保留，并新增坐标 DMS、Sidereal、Ayanamsa 数值 |
| 五支历 | Lunar month、Tithi、Vara、Nakshatra、Yoga、Karana、日出日落 | 已扩展为五项、编号、名称、时段和剩余比例，并显示昼夜长度 |
| D1 明细 | 天体、星座、宫位、度数、星宿、Pada、宿主 | 已扩展为 7 列真实表格 |
| Karaka | Jaimini Chara Karaka | 已加入 8 项 Atma 至 Dara Karaka |
| 特殊点 | Bhava、Hora、Ghati、Vighati、Pranapada、Sree、Indu、Varnada、Kunda 等 | 已加入可由当前 PyJHora 稳定计算的 Bhava、Hora、Ghati、Vighati、Pranapada、Indu、Bhrigu Bindu、Kunda、Sree；Varnada 与 Yogi/Avayogi 暂未纳入，避免未经本轮确认的规则差异 |
| 虚点 | Dhuma、Vyatipaata、Parivesha、Indrachaapa、Upaketu 等 | 已加入 5 项太阳虚点 |
| 分盘 | D1、D2、D3、D4、D7、D9、D10、D12、D16、D20、D24、D27、D30、D40、D45、D60 | 已加入 16 项分盘总览；PDF 对每项输出完整位置表 |
| Ashtakavarga | Sarva 与 Bhinna Ashtakavarga | 已保留 Sarva 十二星座分数并新增 8 行 Bhinna 按行星评分 |
| Dasa / 力量 / Muhurta | Vimsottari、子期、Strength、日时窗口 | 现有模块继续保留并纳入增强 PDF |

## 明确范围

本轮目标是报告的**真实参数覆盖与内容饱满度**，并非复刻任何第三方软件的界面、文案、数值或专有分析结论。所有报告继续标注为传统规则与天文计算分项，而非个人医疗、法律、金融或关系决策建议。
