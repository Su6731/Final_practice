# 迷你版校园公共信息与数据展示中心

课堂综合案例：把"首页导航、自习室筛选、数据图表、三维导览"四个课堂成果组装为一个统一入口的综合作品。

- **首页**：Bootstrap 响应式导航 + 四张模块卡片，导航当前项高亮（Scrollspy）
- **自习室查询**：按楼层 / 开放状态即时筛选自习室列表
- **使用统计**：ECharts 柱状图读取 `data/data.json`，含标题、单位与数据来源
- **校园三维导览**：独立子页，Three.js 校园地标场景，可旋转 / 缩放 / 自动环绕

## 运行方法

**推荐：本地 HTTP 服务器**（图表需要 `fetch` 读取本地 JSON）

在仓库根目录（本文件的上一级）执行：

```bash
python -m http.server 8123
```

然后浏览器打开：

- 首页：<http://localhost:8123/integration/index.html>
- 三维导览：<http://localhost:8123/integration/three-d/scene.html>

也可以**直接双击 `index.html`** 以 `file://` 方式打开：此时浏览器禁止读取本地 JSON，页面会自动改用 `js/app.js` 内置的同款示例数据，筛选与图表仍可正常使用（数据来源说明会提示为"内置示例数据"）。

> 注意：所有第三方库走 CDN，首次打开需要联网；断网时页面顶部会出现红色提示条。

## 目录说明

```text
integration/
├── index.html              # 统一入口（首页 / 自习室 / 统计三个锚点区块）
├── css/
│   └── style.css           # 自定义样式，在 Bootstrap CSS 之后引入
├── js/
│   └── app.js              # 交互逻辑，按 data / render / bindEvents 分层
├── data/
│   └── data.json           # 自习室与使用量数据
├── three-d/
│   └── scene.html          # 校园三维导览独立子页（Three.js）
└── README.md               # 本文件
```

公共资源（`style.css`）放在公共目录，三维子页通过 `../css/style.css` 复用；三维库只在 `three-d/scene.html` 加载，不拖慢首页。

## 技术栈与版本

| 技术 | 用途 | 版本（CDN 全部锁定，不用 latest） |
| --- | --- | --- |
| 原生 JavaScript | 数据处理、Three.js 场景 | — |
| jQuery | DOM 查询与事件绑定 | 3.7.1 |
| Bootstrap | 布局与基础组件（栅格、导航、卡片、表单） | 5.3.3 |
| Bootstrap Icons | 图标 | 1.11.3 |
| ECharts | 使用量柱状图（仅此一个图表库） | 5.5.1 |
| Three.js | 三维场景（ES Module + importmap） | 0.160.0 |

加载顺序：库 CSS → 自定义 CSS；库 JS（jQuery → Bootstrap → ECharts）→ `app.js`。

## 数据和资源来源

- `data/data.json` 为**课堂演示用模拟数据**，非学校真实统计；字段：自习室名称、楼层、座位数、开放状态、开放时间、本周使用量（人次）。
- 第三方库全部来自 jsDelivr 公共 CDN（版本见上表）。
- 三维场景中的建筑立面、标牌均为 Three.js 程序化生成（Canvas 贴图 / 精灵），未使用外部图片素材。

## 质量自查清单

| # | 检查项 | 结果 |
| --- | --- | --- |
| 1 | 手机 375px：导航折叠为汉堡按钮，卡片单列，无横向滚动条 | 通过 |
| 2 | 平板 768px：卡片两列，筛选栏与列表上下排列，无横向滚动条 | 通过 |
| 3 | 桌面 1200px+：四卡一行，筛选栏吸顶，图表完整显示 | 通过 |
| 4 | 断网：顶部出现红色 CDN 失败提示条；三维页加载位提示"资源加载失败" | 通过 |
| 5 | Chrome 与 Edge 分别打开；F12 Console 无红色报错；三维场景可从导航进入并返回 | 通过 |

自查截图建议保存到 `integration/screenshots/`（按 `375-*.png`、`768-*.png`、`1200-*.png`、`offline-*.png`、`console-*.png` 命名）。

## Git 提交记录

三次分步提交，对应任务的三个阶段：

1. `搭建整合骨架：统一入口、响应式导航与首页卡片占位`
2. `新增自习室筛选交互与使用量柱状图`
3. `新增校园三维导览页（Three.js）并补充 README 与质量自查`

可用 `git log --oneline -3` 查看。
