# 验证记录

## 2026-08-12：浏览器端真实计算流程

使用默认输入 `1996-12-07 10:34`、`Chennai, India`、纬度 `13.0878`、经度 `80.2785`、时区 `UTC+5.5`、Lahiri ayanamsa、D-1 参数提交后，浏览器成功调用 `/api/trpc/astrology.calculate` 并渲染真实计算结果。

关键核验输出包括：Rasi 上升点为 Capricorn 22°26′45″；Sun 为 Scorpio 21°33′55″；Moon 为 Libra 6°57′34″；Navamsa 上升点为 Cancer。页面同时呈现 Panchanga、Vimsottari Dasa 和过境标签入口，底部标记的引擎为 PyJHora + Swiss Ephemeris / AGPL-3.0。

随后切换标签，Panchanga 成功显示 Saturday、Krishna 27、Swati（第 1 pada）、Sunrise 06:22:32 和 Sunset 17:38:13；Vimsottari Dasa 成功显示九个 Mahadasa 段，包括 Rahu（1996-07-16 至 2014-07-16，18 年）与 Jupiter（2014-07-16 至 2030-07-16，16 年）。

将目标分盘改为 D-9 Navamsa 后重新提交，主结果区成功显示 D-9，Ascendant 为 Cancer 22°00′43″，并显示 Sun Capricorn、Moon Sagittarius、Mars/Jupiter Scorpio 等新计算位置，证明分盘选择会触发服务端重算。

新增 Shadbala 后再次提交，页面结果标签中出现 Shadbala，说明真实六力数据已由 PyJHora 引擎返回并进入前端状态。

Ashtakavarga 扩展已通过独立探针核验：校验样例返回十二个 Sarvashtakavarga 分值 `[26, 31, 32, 22, 34, 30, 33, 31, 23, 25, 23, 27]`，合计 337。浏览器重新提交后结果标签出现 Ashtakavarga，确认该真实计算数据已进入前端工作台。

最终浏览器核验显示表单包含 Gregorian / Julian 历法选择；AGPL 面板中同时提供 PyJHora、Swiss Ephemeris 与 Swiss Ephemeris 官方许可条款链接；页脚亦提供 PyJHora 和 Swiss Ephemeris License 入口。

档案侧栏浏览器验证：工作台顶部“档案”入口可打开右侧个人工作区。未登录时仅显示登录说明与“登录并开启档案”按钮，不显示任何档案记录或可写入控件。

专业分析浏览器验证：提交 Chennai 校验资料后，结果区出现 Mahadasa、Antardasa、Yoga、Muhurta 等新增标签，并有“打印 / 导出 PDF”入口。Yoga 标签显示真实规则匹配结果；该样例没有命中当前显式规则集，界面明确说明这不代表对全部传统 Yoga 的穷尽性判断。

本地认证浏览器验证：已通过“用户名 + 密码”注册测试账户并建立签名会话；登录后的档案侧栏显示保存、载入、编辑、比较、删除与退出控件。使用 Chennai 校验资料创建的测试档案已写入并在专属列表中回显。

双档案持久化验证：将第二份测试输入的出生日期设为 2000-01-01 后保存，档案列表显示两份不同日期的私有记录，证明创建与读取流程均已通过真实数据库验证。

Compatibility 与 PDF 验证：选取两份已保存的测试档案后，浏览器显示真实 Ashta Koota / North 总分 25.0 / 36 及 Varna、Vashya、Gana、Tara、Yoni、Graha Maitri、Bhakoot、Nadi 八项分数。计算一份星盘后点击“下载 PDF 报告”，浏览器下载记录确认生成 vedic-web-atlas-report.pdf。

## 2026-08-12：最终交互回归补充

城市搜索已改为仅在地点输入框获得焦点后才发送自动补全请求；刷新后，默认 Chennai 校验资料不再显示“正在检索城市…”，且档案入口可立即正常打开。

档案编辑流程已在浏览器实测：点击“编辑 第二测试档案”会保持侧栏打开，将 2000-01-01 的档案资料载入左侧表单，并在编辑区预填名称与备注；把名称改为“第二测试档案（已更新）”后提交，列表即时回显更新后的名称。普通“载入”会载入资料后关闭侧栏，保持原有工作流。随后对该验证用档案确认删除，列表由 2 份变为 1 份，证明更新与删除均通过真实数据库接口完成。

双档案 Comparison 再次在浏览器验证：以 2000-01-01 的“Compatibility 验证档案”和 1996-12-07 的“Chennai 校验档案”运行后，页面显示 Ashta Koota / North 总分 25.0 / 36，以及 Varna 1、Vashya 2、Gana 6、Tara 0、Yoni 4、Graha Maitri 5、Bhakoot 7、Nadi 0 八项结果。面板明确显示范围说明：“当前仅提供北印度 Ashta Koota 八项分数；不等同于完整合盘、关系建议或未来预测。”

扩展 PDF 最终浏览器验证：对 2000-01-01 Chennai 输入生成完整真实星盘后，工作台出现 Panchanga、Mahadasa、Antardasa、Yoga、Muhurta、Shadbala、Ashtakavarga 与过境标签，并可点击“下载 PDF 报告”。浏览器下载历史新增 `vedic-web-atlas-report (1).pdf`，与此前的 `vedic-web-atlas-report.pdf` 并列，确认报告生成与下载链路可重复执行；报告内容中的 Shadbala、Sarvashtakavarga、Muhurta、Vimsottari 已在服务端文本提取验证中确认存在。

交付前自动化验证：`pnpm check`、`pnpm test` 和 `pnpm build` 于 2026-08-12 全部通过。Vitest 共执行 4 个测试文件、7 个用例，覆盖本地认证、登出、真实引擎和三组黄金星历样例；生产构建成功产出前端与服务端包。构建仅给出前端主包体积超过 500 kB 的优化提示，不影响构建完成。开发日志中可见的 `ERR_MODULE_NOT_FOUND` 为 19:20:01 的历史条目；随后所有 tsc 增量检查均为 0 错误，浏览器端 tRPC 计算、档案和 PDF 流程也已实际运行。

## 2026-08-12：地点数据库离线回退修复

本轮回归以页面地点输入框中的 `Chennai` 查询开始；请求会先尝试地图服务，随后验证 PyJHora 本地 CSV 回退是否返回建议且不泄露 GitHub 下载错误。

浏览器已显示本地回退建议 `Chennai, Tamil Nadu, India`，且未出现原先包含 GitHub URL 的 `Network error while downloading place database asset`。已选择该建议，正在完成历史时区解析回填验证。

历史时区解析随后成功完成：页面回填纬度 `13.0878`、经度 `80.2785`、UTC `5.5`，并显示 `Asia/Kolkata` 与 `UTC+05:30 · 标准时`。城市查询、离线建议、地点选择和时区解析均未产生客户端 API 错误。

自动化回归新增 `server/cityLookup.test.ts`，它验证离线脚本会读取随 PyJHora 安装的 `geonames_places_5k.csv`，不会访问 GitHub 下载 URL，并能返回 Chennai 的既有坐标。修复后 `pnpm check` 与 `pnpm test` 通过（5 个测试文件、8 个用例），`pnpm build` 也成功完成。

## 2026-08-12：日期输入保护修复

浏览器回归将原生出生日期控件置空，用于模拟日期尚未完整填写时继续选择地点的情形；下一步验证该路径会显示表单级提示而非发出不符合 tRPC 契约的解析请求。

日期为空时输入 `Chennai` 仍能正常展示 `Chennai, Tamil Nadu, India` 建议，说明搜索与日期校验保持解耦；正在验证选择建议后的本地保护提示。

选择建议后，页面显示“请先完成出生日期（YYYY-MM-DD）和当地时间，再选择城市。”，且没有出现原先的 tRPC `invalid_format` 错误。随后已恢复有效日期 `1996-12-07`，准备核验正常解析链路。

恢复有效日期后，页面正常显示“已选择 Chennai, Tamil Nadu, India”，并回填纬度 `13.0878`、经度 `80.2785`、时区 `Asia/Kolkata` 和 `UTC+05:30 · 标准时`。这同时验证了无效日期不会发起地点解析请求，而有效日期仍能完成地点与历史时区解析。

## 2026-08-12：中国城市优先地点索引

现有全球 CSV 含 68,521 条地点，其中 2,866 条为中国记录；原 PyJHora 全量城市脚本单次解析约 3,115 ms，历史时区解析约 533 ms。已切换为轻量中国城市查询路径，并在浏览器中以 `Beijing` 作为回归检索输入。

浏览器成功显示 `Beijing, Beijing, China` 建议。选择后立即回填纬度 `39.9075`、经度 `116.3972`、UTC `8`，并显示 `Asia/Shanghai` 与 `UTC+08:00 · 标准时`。轻量脚本独立测量约 130 ms，替代了原约 3,115 ms 的全量 PyJHora 城市加载；同时移除了地点选择前额外的 250 ms 前端延迟。

## 2026-08-12：中文城市、快捷入口与 PDF 排版

浏览器已将地点输入改为中文别名 `北京`，用于验证中国本地索引的中文检索、来源状态和最近使用缓存。

已调整中文输入门槛：含汉字的查询在两个字符时即可触发自动补全；页面刷新后输入 `北京` 已进入“正在检索城市…”状态。

同时将服务端地点查询参数的最小长度同步降为两个字符，消除中文城市检索被 tRPC 校验阻断的情况；刷新后再次输入 `北京` 正在等待本地索引返回。

中文别名回归成功：`北京` 返回“北京 · Beijing, Beijing, China”，建议和选中状态均标注“中国本地城市索引”。选择后正确回填纬度 `39.9075`、经度 `116.3972`、`Asia/Shanghai` 与 `UTC+08:00 · 标准时`；地点输入框下同时显示数据源状态。

刷新页面后重新聚焦地点输入框，浏览器本地缓存的“最近使用”区域显示“北京 · Beijing, Beijing, China”快捷入口，验证最近城市的持久化和可见性。

点击最近城市快捷入口后，北京坐标与 `Asia/Shanghai` 时区再次正确回填；以此资料成功生成真实星盘，PDF 下载按钮已可用，准备检查重排后的报告产物。

重排后的报告已由浏览器成功下载为 `vedic-web-atlas-report (2).pdf`，下载记录确认服务端 PDF 生成与浏览器保存链路正常。

视觉检查该 PDF：报告共 3 页，中文标题、中文字段、页眉页脚和页码均正常显示，无乱码；Rasi、Panchanga、Dasa、Yoga、Muhurta、Shadbala 与 Sarvashtakavarga 使用重复表头的结构化表格。随后将 Vimsottari 标题、周期表和当前子周期组合为不可拆分的排版组，避免标题或首行孤立在页尾。最终 `pnpm check`、`pnpm test`（8 个文件、13 个用例）和 `pnpm build` 全部通过。

KeepTogether 修复后，已以 Chennai 校验资料重新生成星盘，准备下载新的报告产物进行最终分页复查。

新版文件 `vedic-web-atlas-report (3).pdf` 已出现在浏览器下载记录中，作为 KeepTogether 修复后的最终候选产物。

最终视觉核验通过：最新版 PDF 仍为 3 页，所有中文内容均清晰可读且无乱码。Vimsottari 标题、完整周期表与“当前子周期”已整体移至第 2 页，不再出现标题或首行孤立在第 1 页末尾的情况；后续跨页的 Shadbala 表格在第 3 页重复表头，页面衔接清晰。
