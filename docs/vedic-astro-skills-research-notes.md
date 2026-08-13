# CNWU16/vedic-astro-skills 研究笔记

> 仅记录公开仓库中已阅读的资料与初步架构观察；尚未将该仓库的任何代码、规则或文案并入本项目。

## 来源

1. 仓库主页与 README：<https://github.com/CNWU16/vedic-astro-skills>
2. Skill 目录清单：<https://api.github.com/repos/CNWU16/vedic-astro-skills/contents/codex/skills>
3. 计算 Skill：<https://raw.githubusercontent.com/CNWU16/vedic-astro-skills/main/codex/skills/vedic-calculator/SKILL.md>
4. 核心解读 Skill：<https://raw.githubusercontent.com/CNWU16/vedic-astro-skills/main/codex/skills/vedic-core/SKILL.md>
5. 许可证：<https://raw.githubusercontent.com/CNWU16/vedic-astro-skills/main/LICENSE>

## 已确认事实

该仓库为 **AGPL-3.0**，目录中包含八个 Skill：`vedic-calculator`、`vedic-reader`、`vedic-core`、`vedic-career`、`vedic-love`、`vedic-rectifier`、`vedic-synastry`、`vedic-prashna`。其定位是为 AI 编程环境提供分阶段的吠陀占星计算、审核和叙事分析工作流，而不是单独的 Web API 或前端应用。

`vedic-calculator` 使用 `pysweph`、`dashaflow` 与 PyJHora，固定 True Chitrapaksha ayanamsa、Mean Node，并建立以 `structured_data.md` 为中心的规范数据契约。它要求校验 SAV 总计 337、十颗行星、Rahu/Ketu 180°关系，以及 9 个 Mahadasha、81 个 Antardasha、729 个 Pratyantardasha 的连续性；还提出以出生时间不确定性逐分钟重算 D1/D9/D10/D4/D5 上升点的分盘稳定性审计。

其 `vedic-core` 以 `structured_data.md` 为输入，将计算与解释分离；明确要求在行星、分盘和宫位审核阶段不根据用户经历反推结论，并把已知经历限定为后续佐证而非生成依据。该 Skill 同时规定 D1 身份、分盘内部结构和跨盘参照必须分开陈述，防止把 D1 宫主职责混入 D9/D10/D4/D5 的内部宫主判断。

## 初步对照结论

当前 Vedic Web Atlas 已以 PyJHora + Swiss Ephemeris 提供真实计算、分盘、Dasa、Yoga、Compatibility、PDF 和档案工作台。最值得借鉴的是 **数据契约、分盘稳定性、Dasa 按需下钻、解释证据链与输出伦理护栏**；不建议直接接入其面向 Agent 的长篇 Prompt 叙事、固定 Ayanamsa 或把未经独立验证的规则集当作计算真值。

## 后续核查方向

1. 阅读 `vedic-rectifier`、`vedic-synastry`、`vedic-prashna`、`vedic-career` 和 `vedic-love` 的具体输入输出，区分可复用产品流程与纯提示词策略。
2. 与当前 PyJHora 的 ayanamsa、Dasa、Shadbala、分盘算法进行固定样例比较，任何新增规则必须先建立独立回归基准。
3. 若采用或改编其可版权保护的表达性内容、资源文件或工作流文本，应保留版权与 AGPL 许可，并评估与本项目现有 AGPL 路线的一致性。

## 出生时间校正 Skill 补充观察

来源：<https://raw.githubusercontent.com/CNWU16/vedic-astro-skills/main/codex/skills/vedic-rectifier/SKILL.md>

`vedic-rectifier` 将校正定位为一个以多条可核验人生事件为输入、用 Dasha 与分盘交叉打分的候选时间比较流程，而不是要求用户相信单次“精确时刻”的黑箱结论。其公开流程强调先核验事件，再使用候选时间区间、D1 与 D9/D10/D4/D5 等分盘的稳定性与证据强弱形成结论；并将工作产物分离为校正报告、候选评分表等文件，避免覆盖核心解读报告。

对 Web 产品而言，这提示可设计成**证据驱动的出生时间区间校正**：用户录入结构化事件与时间范围，服务器为候选分钟计算 D1/D9/D10/D4/D5、Dasha 和稳定性，再展示候选排序、命中/反证及不确定性。它不适合直接迁入为“一键精确到分钟”的承诺，也不应将该仓库的长提示词文本直接混入当前业务规则。

## 合盘与时盘 Skill 补充观察

来源：

1. <https://raw.githubusercontent.com/CNWU16/vedic-astro-skills/main/codex/skills/vedic-synastry/SKILL.md>
2. <https://raw.githubusercontent.com/CNWU16/vedic-astro-skills/main/codex/skills/vedic-prashna/SKILL.md>

`vedic-synastry` 的可借鉴点不在于取代当前 Ashta Koota 计算，而在于其**关系分析分层**：先独立评估双方资料是否足以支持宫位、UL、D9 等结论，再以 A→B、B→A 两条方向路径建立跨盘互动，最后单独评估双方 Dasha 的时机共振。它将 Ashtakoota 定位为月宿筛查而非最终裁决，并以情绪安全、亲密吸引、沟通修复、长期承载、现实协作和当前时机六维矩阵替代单一“匹配总分”。此外，其“关系类型必须由用户给定、星盘不反推现实关系”“一方资料不精确时降级特定维度”和“不读双方用户背景文件”是合理的产品护栏。

`vedic-prashna` 是与本命盘明确隔离的独立时盘方案。其公开规则要求一个可观察的单一问题、保留秒级的提问时刻及可解析的地点/时区；默认层基于显示的规则账本给出“成／悬／不成”的当前支持方向，并明确将生产级日期预测、Vimshottari、SAV、完整分盘、本命 Dasha、过运、Tajika 与 KP 排除在默认结论之外。它要求先做输入敏感性审计、再列适用规则和冲突，以防将单个行星或单一宫位直接写成全局结论。该模块可作为未来 **Prashna** 功能的产品设计蓝图，但不应将其称作当前已经实现的计算能力；在独立来源、算法、例盘与边界测试准备充分前，不应接入生产结论。
