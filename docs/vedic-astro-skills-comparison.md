# `vedic-astro-skills` 逻辑参考与 Vedic Web Atlas 采纳建议

**研究对象：** [CNWU16/vedic-astro-skills](https://github.com/CNWU16/vedic-astro-skills)（公开 `main` 分支，研究于 2026-08-13）。

## 结论摘要

> 该仓库的核心价值是将“真实计算结果”转换为 **可审计、分阶段、带不确定性约束的 AI 分析工作流**；它不是一个可以替代 Vedic Web Atlas 现有 PyJHora + Swiss Ephemeris 引擎的 Web 服务。

当前 Vedic Web Atlas 已具备更适合 Web 端交互的真实计算底座：可选择 ayanamsa、D-N 分盘、Panchanga、Vimsottari 三层时间轴、Yoga、Shadbala、Ashtakavarga、Muhurta、档案、合盘和 PDF。参考仓库最值得采用的，是其 **数据契约、证据链、输入敏感性和工作流隔离**，而非直接复制长提示词或固定其专有工作流。

| 参考仓库逻辑 | 当前 Vedic Web Atlas 状态 | 建议 |
|---|---|---|
| 计算产物与解释层分离，统一使用规范数据契约 | 已有结构化 JSON 计算输出，但没有单独暴露“事实层/推导层”的产品契约 | **优先采纳**：增加 versioned `chartFacts` 与 `analysisEvidence` 层，便于 PDF、前端与未来 AI 解释共用 |
| 分盘对出生时间误差的稳定性审计 | 当前输入可选择真实出生时刻，但尚未对 D1/D9/D10 等分盘做分钟扰动验证 | **最高优先级**：实现区间重算、稳定/边界敏感标记；不改变星历结果，只约束解释力度 |
| Vimsottari MD→AD→PD 逐层消费 | 已提供 Mahadasa→Bhukti→Antara 可钻取树 | **部分采纳**：保留现有完整计算，增加按时间窗口按需拉取与“结论实际使用层级”标记 |
| 合盘：双方资格、方向性 A→B / B→A、静态/承载/时机三层分离 | 当前有 Ashta Koota、Porutham、性别方向与 D1/D9 月亮对照 | **高价值扩展**：把 Ashta Koota 保留为筛查层，另建方向性跨盘、双方 Dasha 时机和六维关系矩阵 |
| 出生时间校正：事件驱动候选比较 | 尚未提供校正工作台 | **独立新模块**：以用户确认的事件、候选时间、命中/反证和置信区间展示；禁止宣传为黑箱精确分钟判断 |
| Prashna 与本命盘严格隔离 | 现有 Muhurta 为日历窗口，不是提问盘 | **暂不直接并入**：若开发 Prashna，应独立起盘、规则账本、测试例盘和限制声明；不得把本命 Dasha/SAV/分盘混入默认结论 |
| 盲审与反确认偏误规则 | 现有工作台偏计算与研究信息展示 | **可采纳为产品政策**：用户背景仅用于验证、不得反推盘面；解释需可显示支持与制约证据 |

## 参考仓库实际结构

该仓库公开八个 Skill：`vedic-calculator`、`vedic-reader`、`vedic-core`、`vedic-career`、`vedic-love`、`vedic-rectifier`、`vedic-synastry`、`vedic-prashna`。[1] 其输入输出中心是 `structured_data.md`：计算 Skill 输出规范化基础数据，后续核心、职业、关系和校正 Skill 读取该数据并生成各自报告。计算 Skill 使用 `pysweph`、PyJHora 与 dashaflow，并将 SAV、BAV、Shadbala、分盘、Dasha 和基础验证集合纳入相同数据契约。[2]

这与 Vedic Web Atlas 的“Python 计算适配器 → Node 子进程保护 → tRPC → React/PDF”架构相互补充：前者偏向 Agent 编排与报告纪律，后者偏向可交互的真实计算服务、账户、档案和可视化。二者不应以一个替换另一个。

## 建议优先实现：分盘稳定性审计

参考仓库要求以用户声明的出生时间不确定性，在分钟粒度重新计算 D1、D9、D10、D4、D5 的上升点，并将结果标记为稳定、边界敏感或未审计。[2] 这比只展示某一分钟的 D-N 结果更诚实，也与当前项目强调真实星历、历史时区和可追溯参数的目标一致。

建议的 Web Atlas 实现应采用以下数据结构，而非复制其提示词：

```ts
type DivisionalStability = {
  factor: number;
  uncertaintyMinutes: number;
  testedMinutes: number[];
  ascendantSigns: string[];
  status: "stable" | "boundary_sensitive" | "not_audited";
  interpretationScope: string;
};
```

前端应让用户选择或说明时间精度（精确至分钟、约 ±15 分钟、约 ±1 小时、不确定），后端只对受支持的关键分盘执行候选重算。若分盘边界敏感，仍可显示该时间点的计算表，但应将落宫、分盘宫主和依赖它们的断语降级为条件性研究提示。

## 建议第二阶段实现：关系研究矩阵

参考仓库的合盘逻辑强调：Ashtakoota 只是月宿筛查；A→B 和 B→A 必须分开；个人关系承载、跨盘互动和双方 Dasha 时机不可互相替代；且关系类型由用户声明，而不是由盘面推断。[3]

Web Atlas 可以将现有 Compatibility 模块扩展为下表，而保持 PyJHora Ashta Koota 与 Porutham 的真实计算作为基础层：

| 层 | 计算/输入 | 输出 | 约束 |
|---|---|---|---|
| 月宿筛查 | 现有 Ashta Koota、Porutham | 组件分数与传统方向 | 不输出“匹配/不匹配”总裁决 |
| 个体承载 | 各自 D1、D9、7 宫、Venus、DK 与时间精度 | 双方独立的资源、压力与置信度 | 一方时间不精确时禁用其 D9/UL/宫位推断 |
| 方向互动 | A→B、B→A 的整宫落点与 PyJHora 可确认相位 | 吸引、沟通、修复、协作的双向事实 | 不混用西方 orb 或 composite 概念 |
| 时机 | 双方 MD/AD 与双方资料完整度 | 同步、错位或待验证的窗口 | 单人 Dasha 不应伪装为共同时间窗 |
| 结论 | 支持证据 + 制约证据 | 六维关系矩阵 | 不得代替现实中关于暴力、控制、金钱或同意的判断 |

## 出生时间校正与 Prashna 的边界

`vedic-rectifier` 将出生时间校正设计为多个可核验事件、候选时间比较、Dasha 与分盘交叉的证据流程，而不是输出不可复查的单点答案。[4] 这适合发展为另一个工作台：事件卡片、候选区间、评分、反证、分盘稳定性和“目前不足以区分”的结论。只有在规则、样例和回归测试充分时，才应开放给用户。

`vedic-prashna` 更严格：它把具体、可观察的单一问题、秒级提问时刻和地点作为必要输入；默认层将本命 Dasha、SAV、完整分盘、过运、Tajika 与 KP 排除在外，并在规则账本中显示适用依据与冲突。[5] 这说明本项目当前的 Muhurta 不能被改名为 Prashna。若未来实现，应作为独立服务、独立数据模型和独立报告类型建设。

## 不建议直接采用的部分

不应直接将仓库的长篇 Prompt、职业/关系叙事或资源文档复制到产品中。一方面，它们服务于 Claude Code、Codex 与 Antigravity 的文件型 Agent 工作流；另一方面，其表达性文本和资源规则受该仓库 AGPL-3.0 许可约束。[1] [6] 即使当前项目同样走 AGPL 路线，若复制或改编受版权保护内容，也应保留原始版权和许可通知，并将来源与改动写入项目文档。更重要的是，任何规则都要先通过 Web Atlas 的 PyJHora 固定样例和边界测试，而不是因为其文字写得详细便视作计算真值。

## 推荐路线图

1. **先做分盘稳定性审计。** 这是最低风险、最高解释透明度的增强，不改变现有 PyJHora 数值。
2. **再做 Compatibility 六维矩阵。** 复用现有真实 Koota/Porutham 结果，增加方向性、资料精度和双方时机，而不是替换当前计算。
3. **第三步设计出生时间校正 MVP。** 先只输出候选比较与不确定性，不承诺精确到分钟。
4. **Prashna 最后单独立项。** 需要独立古典来源、算法验证集、地点/秒级时间数据模型与显著的适用范围提示。

## 参考资料

[1] [仓库主页与八个 Skill 架构](https://github.com/CNWU16/vedic-astro-skills)

[2] [`vedic-calculator` Skill 说明](https://raw.githubusercontent.com/CNWU16/vedic-astro-skills/main/codex/skills/vedic-calculator/SKILL.md)

[3] [`vedic-synastry` Skill 说明](https://raw.githubusercontent.com/CNWU16/vedic-astro-skills/main/codex/skills/vedic-synastry/SKILL.md)

[4] [`vedic-rectifier` Skill 说明](https://raw.githubusercontent.com/CNWU16/vedic-astro-skills/main/codex/skills/vedic-rectifier/SKILL.md)

[5] [`vedic-prashna` Skill 说明](https://raw.githubusercontent.com/CNWU16/vedic-astro-skills/main/codex/skills/vedic-prashna/SKILL.md)

[6] [仓库 AGPL-3.0 许可证](https://raw.githubusercontent.com/CNWU16/vedic-astro-skills/main/LICENSE)
