# Vedic Web Atlas

**Vedic Web Atlas** 是一个基于 PyJHora 与 Swiss Ephemeris 的全栈印度占星 Web 应用。项目将真实星历计算、出生档案、地点与历史时区解析、PDF 报告及用户名密码认证整合在同一工作台中；它不是演示数据生成器。

> 本项目采用 **AGPL 开源部署路线**。如果将本应用通过网络向第三方提供服务，须同时遵守 PyJHora 与 Swiss Ephemeris 的相应许可条件，并向用户提供所要求的源码及许可证信息。[1] [2]

## 功能范围

| 模块 | 已实现内容 |
| --- | --- |
| 真实计算 | Rasi、Navamsa、D-N 分盘、Panchanga、Vimsottari Dasa、Shadbala、Sarva/Bhinna Ashtakavarga、Yoga、Muhurta 与过境。 |
| 传统参数 | 四种 Varnada 方法、Yogi/Avayogi、Jaimini Chara Karaka、特殊 Lagna 与太阳虚点。 |
| 地点与时间 | 中国城市中文别名、本地城市索引、全球 CSV 回退、历史 UTC 偏移与夏令时解析。 |
| 档案与合盘 | 用户名密码认证、出生档案 CRUD、Ashta Koota / Porutham 辅助维度及性别方向说明。 |
| 报告 | 可选择章节及中英模板的服务器端 PDF 导出，含北印度分盘图和目录页。 |
| 稳定性 | Python/PDF 子进程超时与输出限制、有限重试、数据库瞬态重试、中文安全错误与前端恢复操作。 |

## 技术栈与目录

项目采用 React 19、Vite、Tailwind CSS、Express 4、tRPC 11、Drizzle ORM 和 MySQL/TiDB。真实占星计算及 PDF 由 Python 脚本执行，底层依赖 PyJHora、pyswisseph 与 ReportLab。

```text
client/src/             React 工作台、档案侧栏、地点搜索与图表组件
server/                 tRPC 路由、认证、数据库与 Python 进程适配层
scripts/vedic_engine.py 真实 PyJHora / Swiss Ephemeris 计算适配器
scripts/pdf_report.py   服务器端 PDF 生成器
drizzle/                数据库 schema 和迁移文件
server/*.test.ts        Vitest 单元与路由回归测试
Dockerfile              Node 22 + Python 3 的生产镜像定义
```

## 运行前提

建议使用下表所列环境。Windows 用户可通过 WSL2 运行，以获得与 Docker、Python 字体及文件路径更一致的行为。

| 依赖 | 建议版本或说明 |
| --- | --- |
| Node.js | 22 LTS |
| pnpm | 10.x；项目已通过 `packageManager` 锁定版本。 |
| Python | 3.10 及以上，命令须为 `python3`。 |
| 数据库 | MySQL 8+ 或 TiDB；认证和出生档案功能需要连接数据库。 |
| 系统字体 | 文泉驿正黑 `fonts-wqy-zenhei`，用于中文 PDF。 |

## 本地快速启动

先取得源码并安装 Node、Python 依赖。以下命令以 Ubuntu/macOS shell 为例；请在项目根目录执行。

```bash
git clone <你的仓库地址> vedic-web-atlas-v2
cd vedic-web-atlas-v2

corepack enable
pnpm install

python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install --upgrade pip
python3 -m pip install \
  PyJHora==4.8.7 pyswisseph python-dateutil geocoder geopy numpy pytz requests \
  timezonefinder reverse_geocode reportlab
python3 scripts/install_pyjhora_ephe.py
```

在 Ubuntu/Debian 上，为保证 PDF 中文可读，安装文泉驿字体：

```bash
sudo apt-get update
sudo apt-get install -y fonts-wqy-zenhei
```

### 配置环境变量

在根目录创建未提交的 `.env` 文件。`DATABASE_URL` 和 `JWT_SECRET` 是本地用户名密码、出生档案功能的必要项；未配置数据库时，公开的星历计算仍可运行，但登录及档案不会可用。

```dotenv
NODE_ENV=development
PORT=3000

# MySQL / TiDB 连接串；用户名、密码和数据库名按实际环境替换。
DATABASE_URL=mysql://app_user:strong_password@127.0.0.1:3306/vedic_atlas

# 使用高强度随机值，勿提交到仓库。
JWT_SECRET=replace_with_a_long_random_secret

# 可选：保留 Manus OAuth 兼容功能时使用；仅用户名密码工作流不要求配置。
VITE_APP_ID=
OAUTH_SERVER_URL=
OWNER_OPEN_ID=

# 可选：托管平台的内置服务变量；本地核心占星计算不需要。
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
```

可用下列命令生成随机会话密钥：

```bash
openssl rand -base64 48
```

### 初始化数据库并启动开发服务器

确认 `DATABASE_URL` 能连接到空数据库或目标数据库后，执行迁移。首次部署前请备份已有数据库；迁移会创建或更新用户与出生档案相关表。

```bash
pnpm db:push
pnpm dev
```

默认访问地址为 [http://localhost:3000](http://localhost:3000)。如果 3000 已被占用，服务会从 3000 起选择下一个可用端口，并在终端输出实际地址。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 以开发模式启动 Express + Vite。 |
| `pnpm test` | 运行 Vitest 回归测试，包括黄金星历、PDF、错误恢复、档案与认证。 |
| `pnpm check` | 执行 TypeScript 静态检查。 |
| `pnpm build` | 构建前端资源和生产服务端包至 `dist/`。 |
| `pnpm start` | 在已执行构建后，以生产模式启动 `dist/index.js`。 |
| `pnpm db:push` | 生成并应用 Drizzle 数据库迁移。 |
| `pnpm format` | 使用 Prettier 格式化代码。 |

建议在提交或部署前执行以下质量门禁：

```bash
pnpm test
pnpm check
pnpm build
```

## Docker 运行

项目根目录的 `Dockerfile` 已包含 Node 22、Python 3、PyJHora、Swiss Ephemeris 绑定、ReportLab 以及文泉驿正黑字体。构建镜像后，将数据库和会话密钥通过运行时环境变量注入。

```bash
docker build -t vedic-web-atlas:local .

docker run --rm -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DATABASE_URL='mysql://app_user:strong_password@db-host:3306/vedic_atlas' \
  -e JWT_SECRET='replace_with_a_long_random_secret' \
  vedic-web-atlas:local
```

生产环境请使用受管数据库、TLS 连接、强随机 `JWT_SECRET`、受限数据库权限和可信反向代理。不要把 `.env`、数据库密码、cookie 密钥或导出的客户 PDF 提交到 Git 仓库。

### 一键启动应用与 MySQL

项目包含 `docker-compose.yml`、MySQL 数据卷、迁移服务及安全的 `environment.example` 配置参考。先复制模板为本地 `.env` 并替换所有示例密码，再构建并启动；`migrate` 服务会在 MySQL 健康后应用 Drizzle 迁移，应用服务仅在迁移成功后启动。

```bash
cp environment.example .env
# 编辑 .env：至少更换 MYSQL_PASSWORD、MYSQL_ROOT_PASSWORD 与 JWT_SECRET
docker compose up --build -d
docker compose ps
```

首次成功后，通过 [http://localhost:3000](http://localhost:3000) 访问应用。检查日志、停止服务及完全清除本地数据库的常用命令如下；最后一个命令会删除 MySQL 数据卷，请只在确定不再需要本地档案时执行。

```bash
docker compose logs -f app migrate db
docker compose down
docker compose down -v
```

### Docker Compose 冒烟验证

在安装 Docker Engine 与 Docker Compose Plugin 的本机或服务器上，先复制并填写环境文件，再运行以下检查。命令会构建镜像、启动 MySQL、应用迁移并等待应用健康检查；最后的 `curl` 为 HTTP 可达性验证。确认无误后可用 `docker compose down` 停止容器；只有确实要清除本地数据库时才追加 `-v`。

```bash
cp environment.example .env
# 编辑 .env，并替换 MYSQL_PASSWORD、MYSQL_ROOT_PASSWORD、JWT_SECRET
docker compose up --build -d
docker compose ps
docker compose logs --tail=100 migrate app
curl --fail --silent --show-error http://localhost:3000/ > /dev/null
docker compose down
```

### GitHub 托管的 Compose 冒烟验证

仓库包含手动触发的 **Docker Compose smoke** 工作流，可在 GitHub 托管 Ubuntu Runner 上构建完整镜像、启动 MySQL、执行迁移并等待应用 HTTP 健康检查。该工作流使用仅限测试的数据库密码，不会读取或输出部署密钥。推送包含该工作流的提交后，在 **Actions → Docker Compose smoke → Run workflow** 中选择 `main` 并执行；完成后查看“Build and start Compose stack”与“Verify application response”两个步骤均为绿色。

## GitHub Actions

`.github/workflows/ci.yml` 会在对 `main` 的推送与拉取请求中启动 MySQL 8.4 服务，安装 Node 22、Python 3.12、PyJHora、ReportLab 和中文字体，随后依次执行迁移、`pnpm test`、`pnpm check` 与 `pnpm build`。CI 所用数据库密码仅限临时测试服务，不能复制到部署环境。

将仓库推送到 GitHub 后，可在仓库的 **Actions** 页面查看每次提交的验证结果；分支保护规则可要求该工作流通过后才允许合并。

### 将 CI 设为 `main` 的合并必需检查

分支保护属于 GitHub 仓库设置，不能由仓库内 YAML 直接启用。仓库管理员可进入 **Settings → Rules → Rulesets → New branch ruleset**，将目标分支设为 `main`，并启用“Require a pull request before merging”和“Require status checks to pass”。在必需检查列表中选择本项目工作流的作业名称 **`Test, type-check, and build`**；建议同时开启“Require branches to be up to date before merging”、阻止强制推送及阻止删除受保护分支。[3]

### 发布 GitHub Container Registry 镜像

`.github/workflows/publish-image.yml` 会在推送符合 `v*` 的 Git 标签时构建 Docker 镜像并推送至 GitHub Container Registry（GHCR）。它使用仓库默认的 `GITHUB_TOKEN` 和 `packages: write` 权限，无需将个人访问令牌提交到仓库。建议仅在 `main` 已通过 CI 后创建发布标签。

```bash
# 例如发布 1.0.0；请先确认 main 的 Verify 工作流为绿色。
git checkout main
git pull --ff-only
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

成功后，镜像会使用 `1.0.0`、`1.0`、`1` 与 `latest` 标签，可按以下形式拉取。首次发布后，可在 GitHub 仓库右侧的 **Packages** 区域将容器包设置为公开或配置访问权限。

```bash
docker pull ghcr.io/<github-owner>/<repository>:1.0.0
```

为独立确认镜像已可从注册表读取，仓库还提供手动触发的 **Verify GHCR image** 工作流。在 **Actions → Verify GHCR image → Run workflow** 中输入 `1.0.0`，该工作流会使用仓库令牌登录 GHCR、拉取 `ghcr.io/<github-owner>/<repository>:1.0.0` 并输出镜像 digest。

## 使用工作台

首先输入出生日期、当地时间、性别和出生地点。地点输入框优先使用中国城市轻量索引；选中城市后会回填坐标、IANA 时区和相应时点的 UTC 偏移。也可以手动填写纬度、经度和时区。点击“生成真实印度占星报告”后，可在标签页中查看星盘、Panchanga、Dasa、Yoga、Muhurta、Shadbala、Ashtakavarga 和过境。

“档案”侧栏提供用户名密码注册、登录、保存、载入、编辑、删除和选择两份档案对比。PDF 设置可选择中文或英文模板以及导出章节。若遇到临时网络、数据库或计算异常，界面会提供中文提示；计算和 PDF 可重试，档案保存可保留输入后再次提交。

> 计算结果服务于传统占星研究和信息呈现，不构成医疗、法律、财务、关系或其他个人决策建议。

## 故障排查

| 现象 | 处理方式 |
| --- | --- |
| `python3`、PyJHora 或 ReportLab 找不到 | 激活 `.venv` 并重新执行 Python 安装命令；确认启动 Node 服务的终端继承了该环境。 |
| 中文 PDF 显示异常 | 安装 `fonts-wqy-zenhei`；Docker 镜像已内置该字体。 |
| 档案登录或列表提示数据库暂时不稳定 | 检查 `DATABASE_URL`、数据库 DNS、TLS 和防火墙；应用会对瞬态连接故障有限重试。 |
| `pnpm db:push` 失败 | 确认目标数据库已创建、连接账户有迁移权限，并先备份生产数据。 |
| 城市建议为空 | 可直接手动填入经纬度和 UTC 偏移；核心计算不依赖外部地点服务。 |
| 构建提示主包大于 500 kB | 这是当前构建警告，不阻止产物生成；可后续对高密度结果面板使用按需加载。 |

## 开源与许可

应用界面、服务器适配代码和部署配置应与所使用的上游组件许可一并审查。特别是，PyJHora 使用 AGPL-3.0 许可，Swiss Ephemeris 提供 AGPL 与专业许可路径；本项目当前按 AGPL 路线组织。向网络用户提供本应用时，应提供完整的对应源码、保留许可证和版权声明，并核对任何额外依赖的许可义务。[1] [2]

如计划闭源、嵌入商业 SaaS 或以不满足 AGPL 条件的方式分发，请在部署前向版权方和专业法律顾问核实许可方案。

## 参考资料

[1] [PyJHora GitHub 仓库与许可信息](https://github.com/naturalstupid/PyJHora)

[2] [Swiss Ephemeris 许可说明](https://www.astro.com/swisseph/swephinfo_e.htm)

[3] [GitHub：管理规则集与受保护分支](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
