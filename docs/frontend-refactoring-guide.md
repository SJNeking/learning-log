# 前端重构指南 v3.0

> **目标读者**: 任何 AI 代理（Claude Code / Cline / Cursor 等）
> **最后更新**: 2026-06-27
> **状态**: 待执行
> **前置**: P1-P4 阶段已完成（组件拆分 + 多页面路由 + SVG 图标系统）

---

## 1. 现状诊断

### 1.1 已完成工作（P1-P4）

| 阶段 | 内容 | 状态 |
|------|------|------|
| P1 | 基础设施 — 统一类型定义 + API 客户端 + 清理死代码 | ✅ 完成 |
| P2 | 组件拆分 — 955 行 page.tsx 拆为 13 个独立组件 | ✅ 完成 |
| P3 | 功能补齐 — 搜索 + 编辑/删除 + 新建条目 | ✅ 完成 |
| P4 | 视图扩展 — 多页面路由 + 统计仪表盘 + SVG 图标系统 | ✅ 完成 |

### 1.2 当前文件清单

```
frontend/
├── app/
│   ├── page.tsx              (196 行) — 主页时间线
│   ├── layout.tsx             (19 行) — 根布局
│   ├── globals.css            (90 行) — 全局样式
│   ├── graph/page.tsx        (118 行) — 知识图谱
│   └── feed/page.tsx         (138 行) — Feed 卡片流
├── components/
│   ├── ui/
│   │   ├── Icons.tsx         (180 行) — SVG 图标库
│   │   ├── SearchBar.tsx      (62 行)
│   │   ├── CopyButton.tsx     (50 行)
│   │   └── Tag.tsx            (16 行)
│   ├── entry/
│   │   ├── EntryDetail.tsx   (262 行) ⚠️ 超 200 行
│   │   ├── EntryForm.tsx     (260 行) ⚠️ 超 200 行
│   │   ├── EntryCard.tsx     (103 行)
│   │   └── InsightPreview.tsx (63 行)
│   ├── layout/
│   │   ├── StatsPanel.tsx     (56 行)
│   │   ├── Navigation.tsx     (54 行)
│   │   └── FilterBar.tsx      (47 行)
│   ├── renderers/
│   │   ├── MarkdownRenderer.tsx (208 行) ⚠️ 超 200 行
│   │   └── MermaidDiagram.tsx  (103 行)
│   └── timeline/
│       └── TimelineView.tsx    (54 行)
├── lib/
│   ├── api.ts                (140 行)
│   └── constants.ts           (57 行)
└── types/
    └── index.ts              (120 行)
```

### 1.3 当前问题清单

| # | 问题 | 严重度 | 涉及文件 |
|---|------|--------|----------|
| 1 | **常量重复**: `researchTypeMap` 在 3 处重复定义 | 🔴 高 | `EntryDetail.tsx`, `feed/page.tsx`, `FilterBar.tsx` vs `constants.ts` |
| 2 | **颜色硬编码**: 大量 `#1E293B` / `#334155` 等未使用 CSS 变量 | 🔴 高 | 所有组件 |
| 3 | **`any` 类型**: 4 处使用 `any`，违反类型安全 | 🟡 中 | `EntryForm.tsx:68`, `MarkdownRenderer.tsx:126`, `graph/page.tsx:33`, `MermaidDiagram.tsx:84` |
| 4 | **3 个组件超 200 行**: 违反设计原则 | 🟡 中 | `EntryDetail.tsx(262)`, `EntryForm.tsx(260)`, `MarkdownRenderer.tsx(208)` |
| 5 | **无错误处理**: API 失败时无用户反馈 | 🟡 中 | `page.tsx`, `feed/page.tsx`, `graph/page.tsx` |
| 6 | **无操作反馈**: 创建/编辑/删除后无 toast 提示 | 🟡 中 | `EntryDetail.tsx`, `EntryForm.tsx`, `page.tsx` |
| 7 | **页面头部重复**: 3 个页面重复编写 header + Navigation JSX | 🟡 中 | `page.tsx`, `graph/page.tsx`, `feed/page.tsx` |
| 8 | **Feed 卡片内联**: `feed/page.tsx` 中卡片 JSX 未提取为组件 | 🟢 低 | `feed/page.tsx` |
| 9 | **无键盘快捷键**: 弹窗不支持 Esc 关闭 | 🟢 低 | `EntryDetail.tsx`, `EntryForm.tsx` |
| 10 | **未用后端 API**: `nl-commands` 端点未接入 | 🟢 低 | `api.ts` |

---

## 2. 后端 API 完整参考

前端重构必须基于以下**真实 API**，不要引入不存在的字段。

### 2.1 基础信息

- **Base URL**: `http://localhost:8002`
- **Content-Type**: `application/json`
- **CORS**: 已开启（`allow_origins=["*"]`）

### 2.2 Entry 数据模型

```typescript
// 创建 Entry（POST /api/entries）
interface LearningEntryCreate {
  topic: string;
  insight: string;                          // 核心洞察/分析文章（可长文）
  diagram?: string;                         // Mermaid 图示
  code_snippet?: string;                    // 代码实现片段
  star_situation: string;                   // STAR 情境
  star_task: string;                        // STAR 任务
  star_action: string;                      // STAR 行动
  star_result: string;                      // STAR 结果
  topic_tag_id?: string;                    // 主题标签 ID
  project_tag_id?: string;                  // 项目标签 ID
  research_type?: string;                   // "deep-research" | "topic-exploration" | "domain-mapping"
  related_tag_ids?: string[];               // 关联标签
  custom_tags?: string[];                   // 自定义标签
  analogy?: string;                         // 类比
  transfer_pattern?: string;                // 可迁移模式
  energy_level?: number;                    // 1-5
  aha_moment?: boolean;                     // 是否顿悟
  source?: string;                          // 来源
  confidence_rating?: number;               // 置信度
}

// 更新 Entry（PUT /api/entries/{id}）— 所有字段可选
type LearningEntryUpdate = Partial<LearningEntryCreate>;

// 前端展示用 Entry（GET 返回）
interface Entry {
  id: number;
  topic: string;
  insight: string;
  diagram?: string;
  code_snippet?: string;
  star_situation?: string;
  star_task?: string;
  star_action?: string;
  star_result?: string;
  topic_tag_id?: string;
  project_tag_id?: string;
  research_type?: string;
  related_tag_ids: string[];
  custom_tags: string[];
  analogy?: string;
  transfer_pattern?: string;
  energy_level: number;
  aha_moment: number;  // 注意：后端返回 0/1，非 boolean
  source: string;
  confidence_rating?: number;
  timestamp: string;
  content_hash?: string;
}
```

### 2.3 API 端点清单

| 方法 | 端点 | 参数 | 返回 | 说明 |
|------|------|------|------|------|
| GET | `/api/entries` | `limit=50, offset=0` | `Entry[]` | 分页获取 |
| GET | `/api/entries/{id}` | — | `Entry` | 单条详情 |
| POST | `/api/entries` | `LearningEntryCreate` | `{id, message}` | 创建 |
| PUT | `/api/entries/{id}` | `LearningEntryUpdate` | `{id, message, fields_updated}` | 部分更新 |
| DELETE | `/api/entries/{id}` | — | `{id, message}` | 删除 |
| GET | `/api/entries/feed` | `limit, offset, project_type?, discipline?, research_type?` | `Entry[]` | 带过滤的 Feed |
| GET | `/api/tags` | `category?` | `Tag[]` | 标签列表 |
| GET | `/api/tags/tree` | — | `TagNode[]` | 标签树 |
| GET | `/api/tags/{tag_id}/entries` | `research_type?` | `Entry[]` | 标签下条目 |
| GET | `/api/tag-links` | `source_tag_id?` | `TagLink[]` | 标签关联 |
| GET | `/api/graph` | — | `{nodes, edges}` | 图谱数据 |
| GET | `/api/stats` | — | `{entries, tags, links}` | 统计概览 |
| GET | `/api/projects` | `project_type?` | `Tag[]` | 项目列表 |
| GET | `/api/projects/{id}/entries` | `research_type?` | `Entry[]` | 项目下条目 |
| POST | `/api/nl-commands` | `NLCommandCreate` | `{id, message}` | 自然语言命令 |
| GET | `/api/nl-commands` | `limit, offset, intent_category?` | `NLCommand[]` | 命令历史 |

### 2.4 研究类型枚举

```typescript
const RESEARCH_TYPES = {
  'deep-research':      { label: '深度研究', color: '#fbbf24' },
  'topic-exploration':  { label: '主题探索', color: '#34d399' },
  'domain-mapping':     { label: '领域映射', color: '#a78bfa' },
} as const;
```

---

## 3. 目标架构

### 3.1 目标文件结构

```
frontend/
├── app/
│   ├── page.tsx              # 主页（< 150 行，仅组装组件）
│   ├── layout.tsx            # 根布局
│   ├── globals.css           # 全局样式 + CSS 变量
│   ├── graph/page.tsx        # 知识图谱页（< 100 行）
│   └── feed/page.tsx         # Feed 卡片流页（< 80 行）
├── components/
│   ├── ui/                   # 通用 UI 原子组件
│   │   ├── Icons.tsx         # 统一 SVG 图标库
│   │   ├── Tag.tsx           # 标签徽章
│   │   ├── CopyButton.tsx    # 复制按钮
│   │   ├── SearchBar.tsx     # 搜索栏
│   │   └── Toast.tsx         # Toast 通知组件 (P5 新增)
│   ├── entry/                # Entry 相关组件
│   │   ├── EntryCard.tsx     # 时间线卡片
│   │   ├── EntryDetail.tsx   # 详情弹窗 (< 200 行，提取 DeleteConfirm)
│   │   ├── EntryForm.tsx     # 编辑表单 (< 200 行，提取 FieldGroup)
│   │   ├── InsightPreview.tsx # 洞察预览
│   │   └── DeleteConfirm.tsx # 删除确认对话框 (P5 新增)
│   ├── layout/               # 布局组件
│   │   ├── PageHeader.tsx    # 统一页面头部 (P5 新增)
│   │   ├── Navigation.tsx    # 页面导航
│   │   ├── FilterBar.tsx     # 研究类型过滤器
│   │   └── StatsPanel.tsx    # 统计面板
│   ├── renderers/            # 渲染器
│   │   ├── MarkdownRenderer.tsx  # Markdown 渲染 (< 200 行，提取 CodeBlock)
│   │   ├── CodeBlock.tsx         # 代码块渲染 (P5 新增)
│   │   └── MermaidDiagram.tsx    # Mermaid 图表
│   └── timeline/
│       └── TimelineView.tsx  # 时间线视图
├── hooks/                    # 自定义 Hooks (P5 新增)
│   ├── useEntries.ts         # 条目数据加载 + 分页
│   └── useToast.ts           # Toast 通知管理
├── lib/
│   ├── api.ts                # API 客户端
│   └── constants.ts          # 常量定义（所有组件引用此文件）
├── types/
│   └── index.ts              # 统一类型定义
└── package.json
```

### 3.2 组件依赖关系

```
page.tsx
├── PageHeader
│   ├── SearchBar
│   └── Navigation
├── StatsPanel
├── FilterBar
├── TimelineView
│   └── EntryCard (per entry)
│       ├── Tag
│       └── InsightPreview
├── EntryDetail (modal)
│   ├── MarkdownRenderer
│   │   ├── CodeBlock
│   │   ├── CopyButton
│   │   └── MermaidDiagram
│   ├── Tag
│   ├── DeleteConfirm
│   └── EntryForm (编辑模式)
├── EntryForm (新建模式)
└── Toast

graph/page.tsx
├── PageHeader
│   └── Navigation
└── ECharts (dynamic import)

feed/page.tsx
├── PageHeader
│   └── Navigation
├── FilterBar
└── EntryCard (grid)
```

---

## 4. 分阶段任务

### 阶段 P5：代码质量（消除重复 + 类型安全 + 组件瘦身）

**优先级**: 🔴 高 — 解决架构腐化问题

#### P5.1 消除常量重复

**问题**: `researchTypeMap` 在 3 处重复定义，`FilterBar.tsx` 内部又定义了一份。

**操作**:
1. 在 `lib/constants.ts` 中确保 `RESEARCH_TYPES` 为权威来源
2. 修改 `EntryDetail.tsx` — 删除局部 `researchTypeMap`，改为 `import { RESEARCH_TYPES } from '@/lib/constants'`
3. 修改 `feed/page.tsx` — 同上
4. 修改 `FilterBar.tsx` — 删除局部 `RESEARCH_TYPES` 数组，改为 import
5. 新增辅助函数到 `constants.ts`:
```typescript
export const getResearchTypeInfo = (type: string) =>
  RESEARCH_TYPES[type as keyof typeof RESEARCH_TYPES] ?? { label: '', color: '#94a3b8' };
```

**验证**: `npm run build` 通过。

---

#### P5.2 消除 `any` 类型

**问题**: 4 处 `any` 违反类型安全原则。

| 文件 | 行 | 当前 | 修复方案 |
|------|-----|------|---------|
| `EntryForm.tsx:68` | `value: any` | 改为泛型: `handleChange = <K extends keyof LearningEntryCreate>(field: K, value: LearningEntryCreate[K])` |
| `MarkdownRenderer.tsx:126` | `code: (...props): any` | 定义 `CodeProps` 接口替代 |
| `graph/page.tsx:33` | `params: any` | 定义 `EchartsTooltipParams` 接口 |
| `MermaidDiagram.tsx:84` | `catch (err: any)` | 改为 `catch (err: unknown)` + 类型守卫 |

**验证**: `npx tsc --noEmit` 无错误 + `npm run build` 通过。

---

#### P5.3 组件瘦身（超 200 行拆分）

**EntryDetail.tsx (262 → < 180)**:
- 提取 `components/entry/DeleteConfirm.tsx`（约 50 行）
  - Props: `onConfirm: () => void; onCancel: () => void`
- EntryDetail 中 `{showDeleteConfirm && <DeleteConfirm ... />}`

**EntryForm.tsx (260 → < 180)**:
- 提取表单字段分组为内部子组件 `FormFieldGroup`
- 将 STAR 字段（situation/task/action/result）合并为折叠区域
- 或将样式对象提取为模块级常量

**MarkdownRenderer.tsx (208 → < 160)**:
- 提取 `components/renderers/CodeBlock.tsx`（约 80 行）
  - 包含：macOS 风格标题栏 + SyntaxHighlighter + CopyButton
  - Props: `code: string; language: string`
- MarkdownRenderer 中 code 渲染器简化为: `<CodeBlock code={...} language={...} />`

**验证**: 每步 `npm run build` 通过 + 视觉/交互不变。

---

#### P5.4 颜色引用 CSS 变量

**问题**: 组件中硬编码颜色值，未使用 `globals.css` 中的 CSS 变量。

**操作**: 在需要引用 CSS 变量的组件中，将硬编码色值替换为 `var(--xxx)`:

```typescript
// 替换前
background: '#1E293B'
border: '1px solid #334155'
color: '#F8FAFC'

// 替换后
background: 'var(--bg-secondary)'
border: '1px solid var(--border-color)'
color: 'var(--text-primary)'
```

**映射表**:
| 硬编码值 | CSS 变量 |
|---------|---------|
| `#0b1120` / `#0F172A` | `var(--bg-primary)` |
| `#1E293B` | `var(--bg-secondary)` |
| `rgba(30,41,59,0.6)` | `var(--bg-panel)` |
| `rgba(71,85,105,0.3)` / `#334155` | `var(--border-color)` |
| `#F8FAFC` / `#F1F5F9` | `var(--text-primary)` |
| `#CBD5E1` / `#94A3B8` | `var(--text-secondary)` |
| `#64748B` / `#475569` | `var(--text-muted)` |
| `#38bdf8` | `var(--accent-sky)` |
| `#34d399` | `var(--accent-emerald)` |
| `#fbbf24` | `var(--accent-amber)` |
| `#a78bfa` | `var(--accent-purple)` |

**注意**: accent 色在标签/徽章中作为 `color` prop 传入时保持硬编码（因为是 JS 值非 CSS），仅在 JSX `style={{}}` 中替换。

**验证**: `npm run build` 通过 + 页面视觉不变。

---

### 阶段 P6：用户体验增强

**优先级**: 🟡 中 — 提升交互品质

#### P6.1 统一页面头部

**问题**: 3 个页面重复编写 header JSX。

**操作**:
1. 创建 `components/layout/PageHeader.tsx`:
```typescript
interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  children?: React.ReactNode;  // 右侧自定义内容
}
```
2. 三个页面改为 `<PageHeader icon={<IconBook />} title="学习日志" badge="时间线">...</PageHeader>`

**验证**: 视觉不变。

---

#### P6.2 Toast 通知系统

**操作**:
1. 创建 `hooks/useToast.ts` — 管理 toast 状态（消息队列 + 自动消失）
2. 创建 `components/ui/Toast.tsx` — 渲染 toast 通知（支持 success/error/info 三种类型）
3. 在 `app/layout.tsx` 中引入 Toast Provider
4. 在以下位置触发 toast:
   - 创建条目成功 → success
   - 编辑条目成功 → success
   - 删除条目成功 → success
   - API 调用失败 → error

**验证**: 操作后能看到对应 toast 通知。

---

#### P6.3 错误处理与空状态

**操作**:
1. API 调用添加 try/catch，失败时显示错误 toast
2. 数据加载失败时显示友好的错误状态（含重试按钮）
3. 按钮在 API 调用期间显示 loading 状态（禁用 + 文字变化）

```typescript
// EntryForm 提交按钮
<button disabled={submitting} style={{ opacity: submitting ? 0.6 : 1 }}>
  {submitting ? '提交中...' : '创建'}
</button>
```

**验证**: 断网后操作能看到错误提示。

---

#### P6.4 键盘快捷键

**操作**:
1. `EntryDetail.tsx` — 按 `Escape` 关闭弹窗
2. `EntryForm.tsx` — 按 `Escape` 取消编辑
3. `DeleteConfirm` — 按 `Escape` 取消

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [onClose]);
```

**验证**: 弹窗中按 Esc 可关闭。

---

#### P6.5 Feed 卡片组件提取

**操作**:
- 将 `feed/page.tsx` 中的卡片 JSX 提取为 `components/entry/EntryCard.tsx` 的变体或新建 `FeedCard.tsx`
- `feed/page.tsx` 精简为数据加载 + 网格布局

**验证**: Feed 页视觉不变。

---

### 阶段 P7：架构增强（可选）

**优先级**: 🟢 低 — 长期价值

#### P7.1 自定义数据 Hooks

**操作**:
1. 创建 `hooks/useEntries.ts` — 封装条目加载 + 分页 + 搜索 + 过滤逻辑
2. `page.tsx` 中的 `loadEntries` / `filteredEntries` / 滚动加载逻辑迁移到 hook
3. Hook 返回: `{ entries, loading, loadingMore, hasMore, error, refresh }`

**效果**: `page.tsx` 从 ~196 行精简到 ~80 行。

---

#### P7.2 错误边界

**操作**:
1. 创建 `components/ui/ErrorBoundary.tsx` — React Error Boundary
2. 包裹 `MarkdownRenderer`（Mermaid 渲染可能崩溃）
3. 包裹 `graph/page.tsx` 的 ECharts 区域

---

#### P7.3 NL Commands API 接入

**操作**:
1. `lib/api.ts` 新增 `commands` 模块:
```typescript
commands: {
  create: (cmd: NLCommandCreate) => ...,
  list: (params?) => ...,
}
```
2. 定义 `NLCommand` 和 `NLCommandCreate` 类型

---

## 5. 约束与规则

### 5.1 必须遵守

1. **每步提交前 `npm run build` 必须通过** — 不允许中间态破坏
2. **保持暗色主题** — 使用 `globals.css` 中的 CSS 变量
3. **类型安全** — 不使用 `any`，所有 props 显式类型
4. **API 调用走 `lib/api.ts`** — 禁止在组件中直接 `fetch`
5. **单文件不超过 200 行** — 超过则提取子组件
6. **常量不重复** — 所有共享常量仅在 `lib/constants.ts` 定义
7. **颜色引用 CSS 变量** — JSX style 中使用 `var(--xxx)`，禁止硬编码

### 5.2 禁止事项

1. ❌ 不要使用 emoji 作为图标 — 使用 `components/ui/Icons.tsx`
2. ❌ 不要创建超过 200 行的单文件
3. ❌ 不要引入 Tailwind / styled-components — 保持 CSS 变量方案
4. ❌ 不要修改后端 API — 前端适配后端
5. ❌ 不要在根目录放散落文件 — 所有文件归入对应目录
6. ❌ 不要使用 `any` 类型 — 用 `unknown` + 类型守卫替代
7. ❌ 不要重复定义已有常量 — 引用 `lib/constants.ts`

### 5.3 Git 提交规范

```
refactor(frontend): P5.1 消除常量重复
refactor(frontend): P5.2 消除 any 类型
refactor(frontend): P5.3 组件瘦身 — 提取 DeleteConfirm/CodeBlock
refactor(frontend): P5.4 颜色引用 CSS 变量
feat(frontend): P6.1 统一页面头部
feat(frontend): P6.2 Toast 通知系统
feat(frontend): P6.3 错误处理与 loading 状态
feat(frontend): P6.4 键盘快捷键
refactor(frontend): P6.5 Feed 卡片组件提取
refactor(frontend): P7.1 自定义数据 Hooks
feat(frontend): P7.2 错误边界
feat(frontend): P7.3 NL Commands API 接入
```

---

## 6. 执行检查清单

每完成一个步骤后，逐项确认：

- [ ] `npm run build` 通过
- [ ] `npx tsc --noEmit` 无错误
- [ ] 无 `any` 类型
- [ ] 无硬编码颜色值（JSX style 中使用 CSS 变量）
- [ ] 无重复常量定义
- [ ] 所有组件文件 < 200 行
- [ ] 页面视觉/交互无破坏
- [ ] Git 提交信息符合规范

---

## 7. 优先级与依赖关系

```
P5.1 消除常量重复 ──┐
P5.2 消除 any 类型 ──┤── 可并行，无依赖
P5.4 颜色 CSS 变量 ──┘
         │
         ▼
P5.3 组件瘦身 ──────── 依赖 P5.1（瘦身时引用 constants）
         │
         ▼
P6.1 统一页面头部 ──── 可独立
P6.2 Toast 系统 ────── 可独立
P6.3 错误处理 ──────── 依赖 P6.2（toast 用于错误提示）
P6.4 键盘快捷键 ────── 可独立
P6.5 Feed 卡片提取 ─── 可独立
         │
         ▼
P7.1 自定义 Hooks ──── 依赖 P5 + P6 稳定后
P7.2 错误边界 ──────── 可独立
P7.3 NL Commands ───── 可独立
```

**建议执行顺序**: P5.1 → P5.2 → P5.4 → P5.3 → P6.1 → P6.2 → P6.3 → P6.4 → P6.5 → P7.x

---

## 8. `globals.css` CSS 变量参考

```css
--bg-primary: #0b1120;
--bg-secondary: #0f172a;
--bg-panel: rgba(30, 41, 59, 0.6);
--border-color: rgba(71, 85, 105, 0.3);
--text-primary: #cbd5e1;
--text-secondary: #94a3b8;
--text-muted: #64748b;
--accent-sky: #38bdf8;
--accent-emerald: #34d399;
--accent-amber: #fbbf24;
--accent-purple: #a78bfa;
```

所有颜色必须引用这些变量，禁止硬编码。
