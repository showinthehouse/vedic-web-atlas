# 验证记录

## 2026-08-12：浏览器端真实计算流程

使用默认输入 `1996-12-07 10:34`、`Chennai, India`、纬度 `13.0878`、经度 `80.2785`、时区 `UTC+5.5`、Lahiri ayanamsa、D-1 参数提交后，浏览器成功调用 `/api/trpc/astrology.calculate` 并渲染真实计算结果。

关键核验输出包括：Rasi 上升点为 Capricorn 22°26′45″；Sun 为 Scorpio 21°33′55″；Moon 为 Libra 6°57′34″；Navamsa 上升点为 Cancer。页面同时呈现 Panchanga、Vimsottari Dasa 和过境标签入口，底部标记的引擎为 PyJHora + Swiss Ephemeris / AGPL-3.0。

随后切换标签，Panchanga 成功显示 Saturday、Krishna 27、Swati（第 1 pada）、Sunrise 06:22:32 和 Sunset 17:38:13；Vimsottari Dasa 成功显示九个 Mahadasa 段，包括 Rahu（1996-07-16 至 2014-07-16，18 年）与 Jupiter（2014-07-16 至 2030-07-16，16 年）。

将目标分盘改为 D-9 Navamsa 后重新提交，主结果区成功显示 D-9，Ascendant 为 Cancer 22°00′43″，并显示 Sun Capricorn、Moon Sagittarius、Mars/Jupiter Scorpio 等新计算位置，证明分盘选择会触发服务端重算。

新增 Shadbala 后再次提交，页面结果标签中出现 Shadbala，说明真实六力数据已由 PyJHora 引擎返回并进入前端状态。

Ashtakavarga 扩展已通过独立探针核验：校验样例返回十二个 Sarvashtakavarga 分值 `[26, 31, 32, 22, 34, 30, 33, 31, 23, 25, 23, 27]`，合计 337。浏览器重新提交后结果标签出现 Ashtakavarga，确认该真实计算数据已进入前端工作台。

最终浏览器核验显示表单包含 Gregorian / Julian 历法选择；AGPL 面板中同时提供 PyJHora、Swiss Ephemeris 与 Swiss Ephemeris 官方许可条款链接；页脚亦提供 PyJHora 和 Swiss Ephemeris License 入口。
