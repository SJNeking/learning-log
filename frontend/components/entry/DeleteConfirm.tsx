'use client';

export default function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px'
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)', fontSize: '16px' }}>确认删除</h3>
        <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)', fontSize: '14px' }}>此操作不可撤销，确定要删除这条记录吗？</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#dc2626',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}
