import React from 'react';

interface GapChartProps {
  seoCount: number;
  socialCount: number;
  emailCount: number;
  adsCount: number;
  webCount: number;
}

export const GapChart: React.FC<GapChartProps> = ({
  seoCount,
  socialCount,
  emailCount,
  adsCount,
  webCount
}) => {
  const data = [
    { label: 'SEO GAP', count: seoCount, color: '#00D4FF', bg: 'bg-[#00D4FF]' },
    { label: 'SOCIAL GAP', count: socialCount, color: '#A855F7', bg: 'bg-purple-500' },
    { label: 'EMAIL GAP', count: emailCount, color: '#FFB800', bg: 'bg-[#FFB800]' },
    { label: 'ADS GAP', count: adsCount, color: '#FF3366', bg: 'bg-[#FF3366]' },
    { label: 'WEB GAPS', count: webCount, color: '#3B82F6', bg: 'bg-blue-500' }
  ];

  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const topGap = sorted[0];

  const recommendation = topGap.count > 0 
    ? `Target companies with ${topGap.label} - highest density opportunity in currently crawled segments.`
    : "No gaps detected yet. Run scans to aggregate system vulnerability vectors.";

  return (
    <div className="flex flex-col justify-between h-[220px] font-mono select-none">
      <div className="space-y-3">
        {data.map((item, idx) => {
          const pct = Math.round((item.count / maxCount) * 100);
          return (
            <div key={idx} className="flex items-center gap-3 text-[10px]">
              <span className="w-18 shrink-0 text-neutral-400 font-bold uppercase">{item.label}</span>
              <div className="flex-1 h-3 bg-black/60 border border-[#00D4FF]/10 rounded-sm overflow-hidden relative">
                <div 
                  className={`h-full ${item.bg} transition-all duration-1000 ease-out`}
                  style={{ width: `${pct}%`, boxShadow: `0 0 8px ${item.color}33` }}
                />
              </div>
              <span className="w-8 text-right font-extrabold text-white">{item.count}</span>
            </div>
          );
        })}
      </div>

      <div className="bg-neutral-900/60 border border-neutral-800/80 rounded p-2.5 text-[9px] leading-relaxed text-neutral-400 mt-2">
        <span className="text-[#39FF14] font-extrabold block uppercase tracking-wider mb-1">💡 CRITICAL ANOMALY REC:</span>
        {recommendation}
      </div>
    </div>
  );
};
