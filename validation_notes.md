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
