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

高密度参数增强验证：以 Chennai 校验资料重新生成真实星盘后，工作台出现“详参”入口，并保持既有 Rasi、Navamsa、Dasa、Yoga、Muhurta、Shadbala、Ashtakavarga 与过境标签可用。

“详参”面板已浏览器验证：显示 Sidereal/Lahiri 与岁差值、DMS 坐标、Lunar month、日出日落及昼夜长度；8 项 Jaimini Chara Karaka、9 项特殊 Lagna、5 项太阳虚点和 D1–D60 的 16 项分盘总览均有真实返回值。

完整 Panchanga 面板已显示五支历：Krishna Dwadashi（#27）、Swati（#15，Pada 1，Rahu）、Shobhana（#5）、Kaulava（#53）、Margashirsha 月名以及日出、日落、昼夜长度与各段剩余比例。

增强版 PDF `vedic-web-atlas-report (4).pdf` 视觉检查（第 1–5 页）结果：

- 第 1 页已包含报告总览、Rasi D1 七列表格，以及 Panchanga 的前 6 行。
- 第 3 页已包含 8 项 Jaimini Chara Karaka、9 项特殊 Lagna、5 项太阳虚点，中文显示正常，无乱码。
- 第 4–5 页已包含 Vimsottari、Yoga、Muhurta、Shadbala、Sarvashtakavarga 与 8 行 Bhinna Ashtakavarga，表头样式统一，中文正常。
- 发现一处版式问题：第 2 页仅承接 Panchanga 的最后一行“日出 / 日落”，页面大面积留白，说明 Panchanga 区块需要重新分页控制，避免拆成单行跨页。

分页修复后的 `vedic-web-atlas-report (5).pdf` 已重新检查：

- 报告页数由 12 页收敛为 11 页。
- 第 1 页保留概览与 Rasi D1 明细，第 2 页完整容纳整个 Panchanga 表、Jaimini Chara Karaka 与全部 9 项特殊 Lagna，不再出现 Panchanga 最后一行孤立跨页。
- 第 3 页承接 5 项 Solar Upagraha，并继续展示 Vimsottari、Yoga 与 Muhurta；第 4 页展示 Shadbala、Sarvashtakavarga 与 8 行 Bhinna Ashtakavarga。
- 第 5–8 页已连续展示分盘总览中的 D1、D2、D3、D4、D7、D9、D10、D12、D16、D20 等位置表，中文、英文字段、星宿与 Pada 列均清晰可读，无乱码。
- 自动化回归方面，`server/vedicEngine.test.ts` 已增加 Panchanga 细项、Karaka、特殊 Lagna、分盘与 BAV 断言；`server/pdfReport.test.ts` 已提高产物体积门槛。`pnpm check`、`pnpm test` 与定向 `pnpm vitest run server/vedicEngine.test.ts server/pdfReport.test.ts` 均通过。

最终 PDF 第 9–11 页视觉核验：第 9 页连续呈现 D-24 与 D-27，D-27 的最后一行自然延至第 10 页；第 10 页完整呈现 D-30、D-40 与 D-45 的起始行；第 11 页承接 D-45 剩余行并完整呈现 D-60。所有跨页位置表均有重复表头，天体、星座、宫位、度数、星宿、Pada 与宿主字段可读，页脚免责声明完整显示。至此 11 页均完成检查。

范围说明最终核验：新版 `vedic-web-atlas-report (6).pdf` 首页在概览表中清晰显示“报告范围”与“当前边界”。前者列出已支持的 Rasi、五支历、Jaimini Karaka、9 项特殊 Lagna、5 项太阳虚点、Sarva/Bhinna Ashtakavarga、D1–D60、Dasa、Yoga、Muhurta、Shadbala；后者说明 Varnada Lagna、Yogi/Avayogi、Maandi/Gulika 等未纳入的原因是流派与计算口径差异，并明确报告不生成个人预测或决策结论。

工作台范围说明可见性验证：刷新页面、重新计算 Chennai 资料并打开“详参”后，标题下方出现高亮的“参数覆盖与当前边界”区块。该区块列出已支持的 Rasi、五支历、Jaimini Karaka、特殊 Lagna、太阳虚点、Sarva/Bhinna Ashtakavarga、D1–D60、Dasa、Yoga、Muhurta、Shadbala，并说明 Varnada Lagna、Yogi/Avayogi、Maandi/Gulika 因流派与计算口径差异暂未在本版呈现。

为保证该说明可被阅读器、辅助技术与页面文本提取稳定访问，已将其由 CSS 伪元素改为详参面板内的真实 JSX `aside` 区块。浏览器最终验证的页面文本已明确提取“参数覆盖与当前边界”、“已支持”与“当前未纳入”两段内容，视觉布局也显示为参数卡片前的高亮说明栏。

## 2026-08-12：传统参数、分盘主题对照与 14 页 PDF 回归

以 Chennai 校验输入 `1996-12-07 10:34`、Lahiri ayanamsa 为基础，在输入栏选择 **Sanjay Rath** Varnada 方法并保持 Yogi / Avayogi 开关开启后，浏览器成功完成真实计算。详参面板明确标注“可选传统点 | Sanjay Rath”，并显示 Varnada Lagna 为 Capricorn 19°47′25″、Yogi Sphuta 为 Virgo 1°51′29″、Avayogi Sphuta 为 Pisces 8°31′29″。范围说明同步确认这些是由 PyJHora 返回的真实点位，而非预测结论；其余三种 Varnada 方法也可从同一选择框切换。

同一浏览器回归中，将分盘主题选择为“事业与学习”后，对照区实时切换为 D10、D20 与 D24 三张并列北印度图及各自的行星位置表。页面分别展示 D10 Ascendant Aries 14°27′27″、D20 Ascendant Gemini 28°54′55″、D24 Ascendant Sagittarius 28°41′54″，证明主题筛选会使用本次服务端计算的分盘数据，而不是静态说明文字。

新版 PDF 已从工作台下载为 `vedic-web-atlas-report (7).pdf`，经人工视觉核验共 14 页。第 2 页是五项章节目录；第 3 页以 2×2 形式嵌入 D1、D9、D10、D60 北印度分盘图，格线、中心标识、标题和天体缩写均正常绘制。第 5 页完整显示特殊 Lagna、太阳虚点及 Sanjay Rath 传统参数；第 6–7 页显示 Vimsottari、Yoga、Muhurta、Shadbala、Sarvashtakavarga 与 Bhinna Ashtakavarga；第 8–14 页连续呈现 D1–D60 分盘位置表。整份报告中中文字体、表头、页眉、页脚、页码、跨页衔接和末页免责声明均无乱码、裁切或重叠。报告后半部分采用高密度分盘汇编结构，没有单独的 Compatibility 页。

自动化回归已更新并执行：`server/vedicEngine.test.ts` 覆盖传统点、方法切换及传统点禁用路径；`server/pdfReport.test.ts` 验证目录、北印度图增强后的 PDF 体积与中文字体嵌入。`pnpm check` 通过，`pnpm test` 共 8 个测试文件、14 个用例全部通过；最终生产构建仍待本轮结束前执行。

## 2026-08-12：新字体、模板与性别资料回归（进行中）

工作台出生资料区已新增“性别”下拉框，包含“未说明、女、男”三个显式选项。浏览器以 Chennai 校验资料选择“男”后成功重新执行真实计算；计算结果底部出现“PDF 设置”，可选择中文或 English research template，并独立勾选总览、图表、Panchanga、派生点、Dasa/Yoga、Muhurta、力量、分盘和 Compatibility 章节。

服务端定向回归已通过：新 PDF 生成器使用可嵌入的 `DroidSansFallbackFull` TrueType 字体，旧 `STSong-Light` CID 字体已不再出现在产物；英文模板与选定章节可生成有效 PDF。视觉检查浏览器下载列表顶部的 `vedic-web-atlas-report (7).pdf` 时，文件仍显示此前的中文全量 14 页结构，说明该下载记录需与本轮新请求重新核对，尚不能作为英文模板视觉验收凭据。该文件的第 1–5 页在新字体下无缺字、裁切或表格重叠，但中英混排标题的英文字符间距偏松，后续将继续核验新下载产物并细调。

为排除浏览器下载历史干扰，已直接调用真实 Python 引擎与 PDF 生成器生成独立文件 `vedic-web-atlas-template-check.pdf`。初次使用 `DroidSansFallbackFull` 时，英文模板首页与目录几乎空白，仅剩表格边框，说明该字体虽可嵌入，但不适合作为当前中英双语模板的唯一主字体。

随后将主字体切换为 `WenQuanYiZenHei`（文泉驿正黑，TrueType Collection）后重新生成探针文件，视觉核验恢复正常：第 1 页正确显示英文标题 **Vedic Web Atlas Research Report**、Calculation overview 表格以及性别字段 **Male**；第 2 页目录仅保留已勾选的四个章节；第 3–5 页分别正确显示北印度分盘图、Rasi 位置表和英文版 Vimsottari / Yoga 可追溯规则表。中英文字符均清晰可读，未见乱码或空白页，英文标题字距也明显优于先前方案。

英文模板进一步分页修复后，北印度分盘图被完整保留在第 3 页，十行 Rasi 位置表整体转入第 4 页；不再出现原来第 4 页仅有 Rahu / Ketu 两行的孤立续页。图页末尾虽留出合理空白，但四张 2×2 图形均保持比例、边线与标签可读，位置表包含完整表头与十行数据。

中文研究模板也已用同一探针重新生成 `vedic-web-atlas-template-check-zh-CN.pdf` 并完成第 1–5 页视觉核验。第 1 页标题显示为“Vedic Web Atlas 占星报告”，副标题、计算总览表、性别字段“男”、坐标和引擎行均清晰可读；第 2 页目录正确只列出已勾选四项章节；第 3 页四张北印度分盘图与中文图注正常显示；第 4 页 Rasi 位置表字段“天体、星座、宫位、位置、宿主”无乱码；第 5 页 `Vimsottari 节点与 Yoga` 页面中中文标题与说明正常，英文规则表也保持可读。与旧 `STSong-Light` 相比，文泉驿正黑消除了先前较明显的乱码风险和字距异常，可作为新的默认中文 PDF 字体方案。

此前浏览器导出会把完整 `result`（包含高密度时间轴和分盘数据）送入 tRPC，网关实际返回 HTTP 403。导出流程已改为仅提交经 Zod 校验的出生参数，服务端重新计算后生成 PDF。浏览器网络日志确认修复后的请求返回 HTTP 200，下载历史新增 `vedic-web-atlas-report (8).pdf`。该文件已直接视觉检查：共 7 页，第 1 页为 **Vedic Web Atlas Research Report** 英文标题与 Calculation overview，Gender 显示为 Not specified；第 2 页目录只列出四个勾选章节；其余页面仅呈现 Charts、Vimsottari/Yoga 与 Strength 内容。新下载产物由文泉驿正黑正常绘制，文本、表格和页码均清晰，证明工作台的 `language=en` 与章节过滤状态已端到端生效。

## 2026-08-12：出生档案 gender 缺列查询回退

在档案侧栏的真实 tRPC 查询中，Drizzle 返回了包含 `select … gender … from birth_profiles` 的 `Failed query` 异常。根因是应用 schema 已开始选择 `gender`，而托管数据库的 `birth_profiles` 表仍未成功应用该列迁移。已实现两层安全回退：第一层识别 MySQL 的 `Unknown column … gender`；第二层识别 Drizzle 包装后的 `Failed query` 字符串及嵌套 `cause`。命中后，系统改用不包含 `gender` 的旧字段列表重新查询，并为返回的每条档案补上 `gender: "UNSPECIFIED"`。

新增 `server/db.genderFallback.test.ts` 覆盖原生缺列错误、Drizzle 包装错误、嵌套 cause、无关错误不被吞没，以及 legacy 选择器返回数据会补齐 `UNSPECIFIED` 的路径。回归结果为 `pnpm test` 共 9 个测试文件、17 个用例通过，生产构建通过。托管数据库在迁移执行阶段仍间歇性发生 DNS / ETIMEDOUT，因此保留 `drizzle/0002_mysterious_bastion.sql`，待连接稳定后再实际添加列；在此之前现有档案读取、创建和更新不会因为缺少该列而崩溃。

随后在 DNS 恢复窗口中，`ALTER TABLE birth_profiles ADD gender enum('FEMALE','MALE','UNSPECIFIED') DEFAULT 'UNSPECIFIED' NOT NULL` 已由托管数据库成功执行。服务随即重启以清理旧连接状态；后续独立验证查询再次受 DNS 波动影响未能完成，但迁移执行返回成功。保留 schema 回退逻辑作为短暂网络与旧部署版本的兼容保护。
