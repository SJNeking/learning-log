# Learning Log Backend Refactoring Guide

## Final Architecture (After All Phases)

### Code Anatomy

| File | Lines | Responsibility |
|------|-------|----------------|
| `app/main.py` | **36** | App init + startup + middleware + include_routers |
| `app/core/config.py` | 30 | PROJECT_DIR, DB_PATH, BACKEND_URL, MCP_SSE_PORT |
| `app/db/__init__.py` | 15 | init_db() |
| `app/db/schema.py` | 78 | Table DDL in SQL string |
| `app/db/migrations.py` | 18 | ALTER TABLE migrations |
| `app/models/__init__.py` | 42 | 6 Pydantic models |
| `app/api/v1/__init__.py` | 6 | Router aggregation |
| `app/api/v1/entries.py` | 369 | 12 entry/tag/backfill endpoints |
| `app/api/v1/tags.py` | 181 | 8 tag + tag-link endpoints |
| `app/api/v1/graph.py` | 142 | 2 graph endpoints |
| `app/api/v1/projects.py` | 36 | 2 project endpoints |
| `app/api/v1/stats.py` | 17 | 1 stats endpoint |
| `app/api/v1/nl_commands.py` | 37 | 2 NL command endpoints |
| `app/utils/db_utils.py` | 42 | get_db, db_session, row_to_dict, parse_entry_rows |
| `app/utils/text_processing.py` | 125 | extract_summary, auto_extract_tags, ensure_tags |
| `app/utils/date_utils.py` | 14 | get_week_dates |
| `app/services/embedding_service.py` | 44 | SentenceTransformer + TF-IDF fallback |
| `app/services/attention_service.py` | 36 | entries_for_attention, infer_research_type |
| `app/services/clustering_service.py` | 83 | Louvain community detection (optimized) |
| `app/services/ai_service.py` | 50 | call_ai_for_analysis (MCP) |
| `app/services/lifecycle.py` | 81 | Backend lifecycle management (MCP) |
| `protocols/mcp.py` | ~300 | MCP tool definitions + handlers + SSE/STDIO |
| `mcp_server.py` | **18** | Thin entry point for .mcp.json |

### Directory Structure

```
backend/
├── app/                   # ★ Application container package
│   ├── main.py            # Entry point (36 lines)
│   ├── core/
│   │   └── config.py      # Centralized configuration
│   ├── api/
│   │   └── v1/            # Route handlers
│   ├── db/                # Database layer
│   ├── models/            # Pydantic models
│   ├── services/          # Business logic
│   └── utils/             # Stateless helpers
├── mcp_server.py          # MCP entry (8 lines)
├── protocols/
│   └── mcp.py             # MCP protocol logic (~300 lines)
├── scripts/               # CLI tools
└── requirements.txt
```

### Key Changes Made

| Phase | What | Risk | Status |
|-------|------|------|--------|
| 1 | Pydantic models → `models/__init__.py` | Low | ✅ |
| 2 | Utility functions → `utils/{db_utils,text_processing,date_utils}.py` | Low | ✅ |
| 3 | API routes → `api/v1/{entries,tags,graph,projects,stats,nl_commands}.py` | Medium | ✅ |
| 4 | Business logic → `services/{embedding,attention}_service.py` | Medium | ✅ |
| 5 | DB layer → `db/{schema,migrations}.py` | Medium | ✅ |
| 6 | MCP server modularized → `services/{ai,lifecycle}.py` + `mcp_server.py` | Low | ✅ |
| A | clustering.py → `services/clustering_service.py` | Low | ✅ |
| B | MCP logic → `protocols/mcp.py`; mcp_server.py → 8-line entry | Low | ✅ |
| C | Scripts → `scripts/` (auto_capture, quick_record, seed_tags, test_mcp) | Low | ✅ |
| D | `__init__.py` re-exports for all packages | Low | ✅ |
| E | Config → `app/core/config.py` | Low | ✅ |
| F | All code → `app/` container package | Low | ✅ |

### Performance Fixes (Session 2026-06-29)

| Issue | Before | After | Change |
|-------|--------|-------|--------|
| `/api/graph/attention` Louvain O(n²) | **120s timeout** | **~150ms** | Cached comm_sum_tot + removed unused O(n²) loops + max_iterations=50 |
| Feed page eager attention fetch | Loaded on every mount | "加载聚类" button triggers lazy load | ~300ms saved per page visit |
| ECharts dynamic import in useEffect | 800KB re-evaluated on every filter/view switch | Static import at module level | No repeated 800KB downloads |

### Verification

All 14 API endpoints return 200:
- `/api/stats`, `/api/tags`, `/api/tags/tree`, `/api/tag-links`
- `/api/graph`, `/api/projects`, `/api/nl-commands`
- `/api/tags/cloud`, `/api/tags/auto`, `/api/entries/week-index`
- `/api/entries`, `/api/entries/{id}`, `/api/entries/feed`
- `/api/entries/week`

Startup: `python3 -m app.main`
