'use client';
import { useState, useEffect } from 'react';
import mermaid from 'mermaid';

// 配置 Mermaid
if (typeof window !== 'undefined') {
  mermaid.initialize({ 
    startOnLoad: false, 
    securityLevel: 'loose',
    fontSize: 11,
    flowchart: {
      padding: 20,
      nodeSpacing: 60,
      rankSpacing: 100,
      curve: 'basis',
      defaultRenderer: 'dagre-d3'
    },
    theme: 'base',
    themeVariables: {
      lineColor: '#8b95a8',
      arrowMarkerColor: '#8b95a8',
      primaryColor: '#1e293b',
      primaryTextColor: '#e8e8e8',
      primaryBorderColor: '#475569',
      textColor: '#c8d1dc'
    },
    themeCSS: `
      text, tspan {
        font-family: "Times New Roman", "Noto Serif SC", serif !important;
        font-size: 11px !important;
        line-height: 1.1 !important;
      }
      .edgeLabel text, .edgeLabel tspan, .edgeLabel {
        font-family: "Times New Roman", "Noto Serif SC", serif !important;
        font-size: 11px !important;
        fill: #d1d8e0 !important;
        background: transparent !important;
        color: #d1d8e0 !important;
      }
      .edgeLabel rect {
        fill: rgba(15, 23, 42, 0.8) !important;
        rx: 4px !important;
        ry: 4px !important;
      }
      .node text, .node tspan, .node .label {
        font-family: "Times New Roman", "Noto Serif SC", serif !important;
        font-size: 11px !important;
        fill: #e8e8e8 !important;
      }
      .edgePath .path {
        stroke: #8b95a8 !important;
        stroke-width: 1.5px !important;
        opacity: 0.8 !important;
      }
      .arrowheadPath {
        fill: #8b95a8 !important;
        opacity: 0.8 !important;
      }
      .node rect, .node circle, .node ellipse, .node polygon {
        fill: #1e293b !important;
        stroke: #475569 !important;
        stroke-width: 1.5px !important;
        rx: 6px !important;
        ry: 6px !important;
      }
    `
  });
}

export default function MermaidDiagram({ chart }: { chart: string }) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!chart) return;
    
    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, chart);
        setSvg(renderedSvg);
        setError('');
      } catch (err: any) {
        setError(err.message || '图表渲染失败');
        setSvg('');
      }
    };

    renderDiagram();
  }, [chart]);

  if (error) {
    return (
      <div style={{ color: '#ef4444', padding: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 18.98C1.55 19.32 1.64 19.66 1.82 19.96C2 20.26 2.26 20.51 2.57 20.69C2.88 20.87 3.23 20.97 3.59 20.97H20.41C20.77 20.97 21.12 20.87 21.43 20.69C21.74 20.51 22 20.26 22.18 19.96C22.36 19.66 22.45 19.32 22.45 18.98C22.45 18.64 22.36 18.3 22.18 18L13.71 3.86C13.53 3.56 13.27 3.32 12.96 3.14C12.65 2.96 12.3 2.86 11.94 2.86C11.58 2.86 11.23 2.96 10.92 3.14C10.61 3.32 10.35 3.56 10.17 3.86L10.29 3.86Z" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {error}
      </div>
    );
  }

  return <div className="mermaid" dangerouslySetInnerHTML={{ __html: svg }} />;
}
