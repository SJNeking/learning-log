'use client';
import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import Navigation from '@/components/layout/Navigation';
import PageHeader from '@/components/layout/PageHeader';
import FilterBar from '@/components/layout/FilterBar';
import SearchBar from '@/components/ui/SearchBar';
import EntryTags from '@/components/entry/EntryTags';
import EntryDetail from '@/components/entry/EntryDetail';
import { IconList, IconHourglass, IconEmpty, IconChevronDown } from '@/components/ui/Icons';
import type { Entry } from '@/types';

const PAGE_SIZE = 20;

export default function FeedPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<{ type: string; id: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const loadKeyRef = useRef(0);

  const loadEntries = async (reset: boolean) => {
    const key = ++loadKeyRef.current;
    const currentOffset = reset ? 0 : offset;
    const setLoad = reset ? setLoading : setLoadingMore;
    setLoad(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { limit: PAGE_SIZE, offset: currentOffset };
      if (activeFilter) params.research_type = activeFilter.id;
      const data = await api.entries.feed(params as any);
      if (key !== loadKeyRef.current) return;
      if (reset) {
        setEntries(Array.isArray(data) ? data : []);
      } else {
        setEntries(prev => [...prev, ...(Array.isArray(data) ? data : [])]);
      }
      setHasMore(Array.isArray(data) && data.length === PAGE_SIZE);
      if (!reset) setOffset(currentOffset + PAGE_SIZE);
      else setOffset(PAGE_SIZE);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || '加载失败');
    } finally {
      if (key === loadKeyRef.current) {
        (reset ? setLoading : setLoadingMore)(false);
      }
    }
  };

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    loadEntries(true);
  }, [activeFilter, refreshCounter]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    loadEntries(false);
  };

  const filteredEntries = searchQuery
    ? entries.filter(e => {
        const q = searchQuery.toLowerCase();
        return e.topic.toLowerCase().includes(q)
          || (e.summary || '').toLowerCase().includes(q)
          || e.insight.toLowerCase().includes(q)
          || e.custom_tags?.some(t => t.toLowerCase().includes(q));
      })
    : entries;

  return (
    <div style={{ height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column' }}>
      <PageHeader icon={<IconList size={24} />} title="Feed 流">
        <SearchBar onSearch={setSearchQuery} />
        <Navigation />
      </PageHeader>

      <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        <div style={{ marginBottom: '24px' }}>
          <FilterBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        </div>

        {/* 记录数 */}
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          共 {filteredEntries.length} 条记录
          {searchQuery && `（搜索"${searchQuery}"）`}
        </div>

        {error ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#ef4444' }}><p>{error}</p></div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
            <IconHourglass size={32} /> 加载中...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
            <IconEmpty size={64} /><p>{searchQuery ? '没有匹配的记录' : '暂无记录'}</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {filteredEntries.map(entry => (
                <div key={entry.id} role="button" tabIndex={0}
                  onClick={() => setSelectedEntry(entry)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedEntry(entry); } }}
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', transition: 'all 0.2s', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--text-muted)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                  <EntryTags entry={entry} showEnergy />
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{entry.topic}</h3>
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {entry.summary || entry.insight.split('\n').filter(l => l.trim()).slice(0, 2).join(' ')}
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(entry.timestamp).toLocaleString('zh-CN')}
                  </div>
                </div>
              ))}
            </div>

            {/* 加载更多 */}
            {hasMore && (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <button onClick={handleLoadMore} disabled={loadingMore}
                  style={{ padding: '10px 24px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', fontSize: '13px', cursor: loadingMore ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--text-muted)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)'; }}
                >
                  <IconChevronDown size={14} />
                  {loadingMore ? '加载中...' : '加载更多'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <EntryDetail entry={selectedEntry} onClose={() => setSelectedEntry(null)} onRefresh={() => setRefreshCounter(c => c + 1)} />
    </div>
  );
}
