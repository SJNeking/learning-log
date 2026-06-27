/**
 * API 客户端 — 统一请求层
 * Base URL: http://localhost:8002
 */

const BASE_URL = 'http://localhost:8002';

import type {
  Entry,
  LearningEntryCreate,
  LearningEntryUpdate,
  Tag,
  TagNode,
  TagLink,
  GraphData,
  Stats,
} from '@/types';

// --- Types for Feed Params ---
interface FeedParams {
  limit?: number;
  offset?: number;
  project_type?: string;
  discipline?: string;
  research_type?: string;
}

export const api = {
  entries: {
    /**
     * GET /api/entries?limit=50&offset=0
     */
    list: (limit = 50, offset = 0) =>
      fetch(`${BASE_URL}/api/entries?limit=${limit}&offset=${offset}`).then(r => r.json() as Promise<Entry[]>),

    /**
     * GET /api/entries/{id}
     */
    get: (id: number) =>
      fetch(`${BASE_URL}/api/entries/${id}`).then(r => r.json() as Promise<Entry>),

    /**
     * POST /api/entries
     */
    create: (data: LearningEntryCreate) =>
      fetch(`${BASE_URL}/api/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),

    /**
     * PUT /api/entries/{id}
     */
    update: (id: number, data: LearningEntryUpdate) =>
      fetch(`${BASE_URL}/api/entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),

    /**
     * DELETE /api/entries/{id}
     */
    delete: (id: number) =>
      fetch(`${BASE_URL}/api/entries/${id}`, { method: 'DELETE' }).then(r => r.json()),

    /**
     * GET /api/entries/feed?limit=&offset=&project_type=&discipline=&research_type=
     */
    feed: (params?: FeedParams) => {
      if (!params || Object.keys(params).length === 0) {
        return fetch(`${BASE_URL}/api/entries/feed`).then(r => r.json() as Promise<Entry[]>);
      }
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
      ).toString();
      return fetch(`${BASE_URL}/api/entries/feed?${qs}`).then(r => r.json() as Promise<Entry[]>);
    },
  },

  tags: {
    /**
     * GET /api/tags?category=
     */
    list: (category?: string) => {
      const qs = category ? `?category=${category}` : '';
      return fetch(`${BASE_URL}/api/tags${qs}`).then(r => r.json() as Promise<Tag[]>);
    },

    /**
     * GET /api/tags/tree
     */
    tree: () =>
      fetch(`${BASE_URL}/api/tags/tree`).then(r => r.json() as Promise<TagNode[]>),

    /**
     * GET /api/tags/{tag_id}/entries?research_type=
     */
    entries: (tagId: string, researchType?: string) => {
      const qs = researchType ? `?research_type=${researchType}` : '';
      return fetch(`${BASE_URL}/api/tags/${tagId}/entries${qs}`).then(r => r.json() as Promise<Entry[]>);
    },
  },

  tagLinks: {
    /**
     * GET /api/tag-links?source_tag_id=
     */
    list: (sourceTagId?: string) => {
      const qs = sourceTagId ? `?source_tag_id=${sourceTagId}` : '';
      return fetch(`${BASE_URL}/api/tag-links${qs}`).then(r => r.json() as Promise<TagLink[]>);
    },
  },

  graph: () =>
    fetch(`${BASE_URL}/api/graph`).then(r => r.json() as Promise<GraphData>),

  stats: () =>
    fetch(`${BASE_URL}/api/stats`).then(r => r.json() as Promise<Stats>),

  projects: {
    /**
     * GET /api/projects?type=business|source-code|component
     */
    list: (projectType?: string) => {
      const qs = projectType ? `?project_type=${projectType}` : '';
      return fetch(`${BASE_URL}/api/projects${qs}`).then(r => r.json() as Promise<Tag[]>);
    },

    /**
     * GET /api/projects/{id}/entries?research_type=
     */
    entries: (projectId: string, researchType?: string) => {
      const qs = researchType ? `?research_type=${researchType}` : '';
      return fetch(`${BASE_URL}/api/projects/${projectId}/entries${qs}`).then(r => r.json() as Promise<Entry[]>);
    },
  },
};
