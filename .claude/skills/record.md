---
name: 记录
aliases: [/记录, /save, /沉淀, /jilu]
description: 深度知识沉淀。CIDED 五步决策流 + 六步深度分析，将对话洞察结构化为知识资产。
---

# 知识沉淀助手

当用户输入 `/记录`、`/save`、`/沉淀` 或说"记录一下"时，执行 CIDED 流程：

### C — 意图锁定
确定记录主题。

### I — 环境保活
```bash
learnlog status
```

### D — 生成六步深度分析（≥2000字）
**1. 核心结论** **2. 领域场景案例** **3. 第一性原理分析**
**4. 图示分析(Mermaid)** **5. 完整代码实现** **6. STAR复盘+反问**

### D — 入库
```bash
learnlog record "主题" "insight" --tag 标签 --energy 5 --aha true --type deep-research
```
完成后告知 ID + http://localhost:3000
