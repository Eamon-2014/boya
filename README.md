# CoolPath · 社区高温关怀路线规划台

> **AI for Climate 青年气候黑客松 参赛作品**
> 同一个人、同一条街，热暴露差多少？—— 用一条"最凉的路"，把高温关怀从口号变成可以走的路线。

[![首页](climate-hackathon/coolpath/screenshots/01-hero.png)](climate-hackathon/coolpath/coolpath.html)

## 立刻开始

| | |
|---|---|
| **▶ 作品文件（点开下载后双击即可运行）** | [climate-hackathon/coolpath/coolpath.html](climate-hackathon/coolpath/coolpath.html) |
| **📖 项目说明（原理 / 数据 / 边界）** | [climate-hackathon/coolpath/README.md](climate-hackathon/coolpath/README.md) |
| **🖼 全部截图** | [screenshots](climate-hackathon/coolpath/screenshots) |
| **📁 目录** | `climate-hackathon/coolpath/` |

> 作品是**单文件零依赖 HTML**（约 2100 行内联 CSS/JS/SVG），不需要服务器、不需要联网、不加载任何外部资源，浏览器双击打开就能跑。在 GitHub 上请点 **Download raw file** 下载后本地打开——GitHub 不会渲染 HTML 页面。

## 它做什么

| 模块 | 内容 |
|---|---|
| **01 规划台** | 合成街道网络 + 简化地表热模型 `T = T_air + ΔT·(1 − shade)`，14:00 → 20:00 时间轴逐时重算；三角色（独居老人 / 外卖骑手 / 带娃家长）各自的最凉路线、暴晒时长、体感峰值对比 |
| **02 感知层** | 三张街景识别卡：树荫覆盖率、硬质铺装占比、饮水点可达性——对应卫星与街景数据能拿到什么、拿不到什么 |
| **03 关怀视图** | 走访优先级表：按热暴露 × 脆弱度排序，回答"先敲谁家的门" |
| **04 方法与边界** | 数据源（Landsat 8/9 TIRS、ECOSTRESS）、模型假设、误差来源，明确写出这套方法**不能**做什么 |
| **模拟世界** | 地图下方「进入模拟世界」：射线投射三维街区，可 WASD + 空格行走，第三人称跟随；公园、住宅 C 老小区、小学都能走进去；终点医院门诊大厅有 36 m 高天柱信标导航 |

## 几个实现细节

- **双语切换零位移**：中英两版文案先测量再锁定容器高度（含表格逐行锁高），切换时所有图形坐标完全不动
- **热暴露依据**：Sentinel-2 没有热红外波段，所以地表温度用的是 Landsat 8/9 TIRS（100 m 重采样到 30 m）与 ECOSTRESS（70 m，可到日尺度），不是随手编的
- **三维街区**：零依赖贴图射线投射 + 真三维体块渲染，建筑立面程序化生成（窗框、玻璃反射、层间梁、空调外机、阳台栏板、店招、楼顶水箱）

<table>
<tr>
<td><img src="climate-hackathon/coolpath/screenshots/04-sim3d.png" width="420"></td>
<td><img src="climate-hackathon/coolpath/screenshots/05-beacon.png" width="420"></td>
</tr>
<tr>
<td align="center">三维街区模拟</td>
<td align="center">终点天柱信标</td>
</tr>
<tr>
<td><img src="climate-hackathon/coolpath/screenshots/07-housing-c.png" width="420"></td>
<td><img src="climate-hackathon/coolpath/screenshots/02-console.png" width="420"></td>
</tr>
<tr>
<td align="center">住宅 C 老小区（可走进去）</td>
<td align="center">规划台：热暴露地图 + 双路线</td>
</tr>
</table>

---

## 仓库里的其他东西（历史项目）

- `app.js` / `pages/` / `components/` … —— 博雅语言教培微信小程序源码（早期项目，已闲置）
- `climate-hackathon/breeze.html` —— 同一赛事更早的一版原型

许可：[MIT](climate-hackathon/coolpath/LICENSE) · 作者：Eamon
