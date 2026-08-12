# Vedic Web Atlas：使用与开源合规说明

## 产品定位

Vedic Web Atlas 是一套浏览器端工作台，其服务端通过 **PyJHora + Swiss Ephemeris** 执行真实的行星位置与印度占星规则计算。它不是旧版 Jagannatha Hora 的界面搬运，也不生成模拟星盘。当前版本注重让计算参数、引擎来源和结果模块对使用者可见；它适合研究、教学、交叉核验和专业工作流的起点，而不应被视为替代专业判断或作出高风险个人决定的依据。

| 项目 | 当前实现 |
|---|---|
| 出生资料 | 日期、当地时间、地点名称、纬度、经度、UTC 时区偏移 |
| 历法 | Gregorian 和 Julian，两者均作为真实计算参数传入星历引擎 |
| 参数 | Lahiri、Raman、KP、True Pushya Ayanamsa；D-1 至 D-60 等预设分盘 |
| 结果 | Rasi、所选分盘、Navamsa、Panchanga、Vimsottari Mahadasa、Shadbala、Sarvashtakavarga、当前过境 |
| 验证 | 三组固定黄金样例：Chennai、New York、London（Julian）以及浏览器端交互验证 |

## 使用步骤

首先填写出生日期、**出生地当地时间**和地点名称。地点名称只用于结果标注；计算使用的是纬度、经度和 UTC 时区偏移，因此必须手动校对这三个数值。随后选择 Gregorian 或 Julian 历法、Ayanamsa 与目标分盘，点击“生成真实印度占星报告”。生成后可在标签间查看星盘、Panchanga、Mahadasa、Shadbala、Sarvashtakavarga 与过境。

> **时间与地点边界：**历法、时区、夏令时和地理坐标都会实质影响上升点、宫位和某些时间型结果。对于历史日期或夏令时边界，请先以独立可信来源核验当地时间与时区，再使用本应用计算。

## 计算与验证范围

核心计算由 PyJHora 的分盘、Panchanga、Vimsottari、Shadbala 和 Ashtakavarga 模块提供。项目测试在每次构建时对固定输入断言上升点、月亮位置、Nakshatra、Dasa 主星与 Sarvashtakavarga 总分。测试集覆盖东半球正时区、西半球负时区和 Julian 历法历史日期，旨在及时发现依赖升级或适配层更改造成的计算偏移。

当前工作台呈现的是已实现模块的计算结果，而不是对完整占星传统的穷尽性覆盖。诸如复杂 yoga 解释、事件预测、兼容性、选日、KP 专用工作流及所有历史软件功能应当作为独立的、可验证的后续模块实施，而非用界面文案替代计算。

## AGPL 与部署责任

本项目按照用户选择的 **AGPL 开源路径** 构建。PyJHora 在其仓库中以 GNU Affero General Public License v3.0 发布；Swiss Ephemeris 官方说明其使用需在 AGPL 条款或专业许可路径下处理。[1] [2] 当部署方将该应用作为网络服务向其他用户提供时，应在发布版本中保留必要版权与许可证信息，并依据适用许可向网络用户提供相应源代码的获取方式。对于闭源、商业化或收费服务，应在公开发布前咨询专业法律意见并确认是否需要 Swiss Ephemeris 专业许可。

本说明是工程实施层面的合规提示，不构成法律意见。

## 参考资料

[1] [PyJHora GitHub Repository](https://github.com/naturalstupid/PyJHora)

[2] [Swiss Ephemeris — Licensing and Information](https://www.astro.com/swisseph/swephinfo_e.htm)
