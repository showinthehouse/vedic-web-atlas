# Vedic Web Atlas 使用说明

## 开始排盘

输入出生日期、当地时间和城市。城市搜索会优先使用地点服务，并在不可用时回退至 PyJHora 内置城市数据；选择地点后，系统会回填经纬度、IANA 时区、出生时刻的 UTC 偏移和夏令时状态。仍建议在历史时间、边界地区或不确定出生时刻的情形下核对原始资料。

选择历法、Ayanamsa 和目标分盘后，点击“生成真实印度占星报告”。计算结果包括 Rasi、Navamsa、Panchanga、Vimsottari Mahadasa / Antardasa、Yoga、Muhurta、Shadbala、Sarvashtakavarga 和过境。

## 账户与出生档案

点击“档案”，使用至少 3 位的用户名和至少 8 位的密码注册或登录。密码以加盐散列形式保存，不以明文存储。登录后可保存、载入、编辑、删除出生档案，且档案只对当前账户可见。

## 双档案对比

在档案列表中勾选两份档案后点击比较。系统会重新计算两个输入并展示关键行星位置及 **Ashta Koota / North** 八个传统分项。该模块目前仅覆盖北印度 Ashta Koota 评分；它不是完整合盘，也不输出关系、人生、医疗、法律或财务建议。

## 导出报告

计算完成后，选择“下载 PDF 报告”可获得包含出生资料、行星位置、Panchanga、Vimsottari、Yoga、Muhurta、Shadbala、Sarvashtakavarga 及已选双档案 Compatibility 的 PDF。对比面板还可以下载 Markdown 研究报告；“打印”则调用浏览器打印流程。

## 许可与边界

本项目使用 PyJHora 与 Swiss Ephemeris。公开部署 AGPL 版本时，应提供相应源代码与许可证说明。星历和传统规则计算仅供研究、学习与信息展示使用；重要人生决定应自行取得合格专业意见。
