'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  
  const navItems = [
    { 
      path: '/', 
      label: '时间线',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M4 19.5V4.5C4 3.67 4.67 3 5.5 3H18.5C19.33 3 20 3.67 20 4.5V19.5C20 20.33 19.33 21 18.5 21H5.5C4.67 21 4 20.33 4 19.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 7H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M8 11H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M8 15H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    },
    { 
      path: '/graph', 
      label: '图谱',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="5" cy="6" r="2" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="19" cy="6" r="2" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="5" cy="18" r="2" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="19" cy="18" r="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M7 7L10 10" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M17 7L14 10" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M7 17L10 14" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M17 17L14 14" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )
    },
    { 
      path: '/feed', 
      label: 'Feed',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="3" y="10" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="3" y="16" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )
    }
  ];

  return (
    <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {navItems.map(item => (
        <Link
          key={item.path}
          href={item.path}
          style={{
            padding: '6px 14px',
            borderRadius: '16px',
            background: pathname === item.path ? '#38bdf8' : 'transparent',
            color: pathname === item.path ? '#0F172A' : '#64748b',
            fontSize: '12px',
            fontWeight: pathname === item.path ? 600 : 400,
            textDecoration: 'none',
            transition: 'all 0.2s',
            border: pathname === item.path ? 'none' : '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
