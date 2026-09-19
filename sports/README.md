# 校园公共信息与数据展示中心 · 运动场馆信息系统

课堂综合案例（个人作业）。围绕校园运动场馆开发的响应式前端应用，覆盖**操场 · 篮球馆 · 羽毛球馆 · 排球场 · 网球场 · 游泳馆**六处场馆，包含信息首页、场馆查询、昨日统计与三维导览四个页面。

## 功能与作业要求对照

| 作业要求 | 实现位置 |
| --- | --- |
| 信息首页 + 至少 2 个功能页面，手机/桌面响应式 | 首页 `index.html`、查询页 `venues.html`、统计页 `stats.html`、三维页 `three-d/scene.html`；375 / 768 / 1200 三档断点 |
| 交互查询模块（筛选/搜索） | `venues.html`：名称搜索 + 室内/室外类型筛选 + 空闲/适中/拥挤状态筛选，即时生效、可重置 |
| 基于 JSON 的数据加载 | 全部页面读取 `data/data.json`（公共层 `js/common.js`）；`file://` 直开时回退内置同款数据 |
| 至少两类有效图表 | `stats.html` 共三类：柱状图（总人流量排行）、折线图（分时段趋势）、饼图（人流量占比），均由 ECharts 渲染 |
| 三维展示区域 | `three-d/scene.html`：Three.js 运动区场景（环形跑道、室内馆、带边线的室外球场、游泳馆），状态灯颜色随当前占用率变化 |
| 错误提示和运行说明 | 每页顶部断网/CDN 失败提示条；空数据占位提示；三维页加载失败兜底；本文件含完整运行说明 |
| jQuery/Bootstrap、Three.js/A-Frame | 使用 jQuery 3.7.1 + Bootstrap 5.3.3 + Three.js 0.160.0（全部 CDN 锁版本） |

## 运行方法

### 方式一：一键启动（推荐）

双击 `启动服务器.bat`——自动在仓库根目录启动本地服务器（端口 8123）并打开首页；关闭命令行窗口即停止。此方式下页面读取真实的 `data/data.json`，改数据后刷新即生效。

等价手动命令（在仓库根目录执行）：

```bash
python -m http.server 8123
```

然后访问：

- 首页：<http://localhost:8123/sports/index.html>
- 场馆查询：<http://localhost:8123/sports/venues.html>
- 昨日统计：<http://localhost:8123/sports/stats.html>
- 三维导览：<http://localhost:8123/sports/three-d/scene.html>

### 方式二：直接双击 index.html（file://）

不启动服务器也能完整使用：浏览器禁止 `file://` 页面读取本地 JSON，页面自动切换到 `js/common.js` / 三维页内置的同款示例数据。限制：修改 `data/data.json` 不生效（需改 `common.js` 中的 `FALLBACK`）。

> 第三方库走 jsDelivr CDN，首次打开需要联网；断网时页面顶部出现红色提示条。

## 目录说明

```text
sports/
├── index.html              # 信息首页：六场馆当前人数 + 全校区汇总
├── venues.html             # 功能页 1：场馆搜索 / 筛选查询
├── stats.html              # 功能页 2：昨日人流量与高峰期排行表格 + 图表
├── 启动服务器.bat           # 一键启动（Windows 双击）
├── css/
│   └── style.css           # 公共样式，在 Bootstrap CSS 之后引入
├── js/
│   ├── common.js           # 公共数据层：JSON 加载/规整/兜底、占用率与统计计算
│   ├── index.js            # 首页渲染
│   ├── venues.js           # 查询页搜索与筛选
│   └── stats.js            # 统计页表格与 ECharts 图表
├── data/
│   └── data.json           # 六场馆容量、当前人数、昨日分时段人流
├── three-d/
│   └── scene.html          # 三维场馆导览（Three.js，独立子页）
└── README.md
```

## 数据与资源来源

- `data/data.json` 为**课堂演示模拟数据**，非真实监测系统。字段：场馆名称、类型（室内/室外）、容量、当前人数（静态快照）、开放时间、昨日 06:00–21:00 分时段人流。
- "昨日总人流量"为各时段人次之和；"高峰时段"由公共层 `statsOf` 计算（人数最多的时段，相同时取最早时段）。
- 第三方库来自 jsDelivr CDN（jQuery 3.7.1、Bootstrap 5.3.3、Bootstrap Icons 1.11.3、ECharts 5.5.1、Three.js 0.160.0）；三维立面、名牌均为程序化生成，无外部图片素材。

## 错误处理与质量自查

| 检查项 | 处理方式 |
| --- | --- |
| 断网 / CDN 失败 | 各页 `load` 后检测 jQuery/Bootstrap/ECharts 是否挂载，未挂载则显示红色提示条；三维页另有 8 秒超时兜底 |
| 空数据 | data.json 中 `venues` 为空时，首页/查询页/统计页/三维页均显示"暂无数据"占位而非空白或报错 |
| file:// 直开 | fetch 被拦截时自动回退内置数据，Console 仅有 warn 提示，无红色报错 |
| 375px 手机 | 导航折叠为汉堡按钮、卡片单列、图表降为 300px、三维 HUD 收起说明文字，无横向滚动条 |
| 768px 平板 | 卡片两列、表格横向可滚动（`table-responsive`） |
| 1200px+ 桌面 | 首页三卡一行、图表左右分栏、三维全屏 |

建议在 Chrome 与 Edge 各打开一次并检查 F12 Console 无红色报错。

## Git 提交记录（分三次）

1. `搭建运动场馆系统骨架：统一入口、导航与六场馆当前人数首页`
2. `新场馆查询交互与昨日统计表格、图表`
3. `新增三维场馆导览页与 README、一键启动脚本`
