import React from 'react';

interface FunnelChartProps {
  newCount: number;
  checkedCount: number;
  contactedCount: number;
  proposalCount: number;
  wonCount: number;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({
  newCount,
  checkedCount,
  contactedCount,
  proposalCount,
  wonCount
}) => {
  const total = Math.max(newCount, 1);
  const checkedPct = Math.round((checkedCount / total) * 100);
  const contactedPct = Math.round((contactedCount / total) * 100);
  const proposalPct = Math.round((proposalCount / total) * 100);
  const wonPct = Math.round((wonCount / total) * 100);

  const stages = [
    { label: 'New Leads', count: newCount, pct: 100, color: 'rgba(0, 212, 255, 0.25)', border: '#00D4FF', clip: 'polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)', indent: 'px-[15%]' },
    { label: 'Checked', count: checkedCount, pct: checkedPct, color: 'rgba(255, 184, 0, 0.25)', border: '#FFB800', clip: 'polygon(15% 0%, 85% 0%, 70% 100%, 30% 100%)', indent: 'px-[25%]' },
    { label: 'Contacted', count: contactedCount, pct: contactedPct, color: 'rgba(0, 212, 255, 0.25)', border: '#00D4FF', clip: 'polygon(30% 0%, 70% 0%, 55% 100%, 45% 100%)', indent: 'px-[32%]' },
    { label: 'Proposals', count: proposalCount, pct: proposalPct, color: 'rgba(168, 85, 247, 0.25)', border: '#A855F7', clip: 'polygon(45% 0%, 55% 0%, 48% 100%, 52% 100%)', indent: 'px-[40%]' },
    { label: 'Won Deals', count: wonCount, pct: wonPct, color: 'rgba(57, 255, 20, 0.25)', border: '#39FF14', clip: 'polygon(48% 0%, 52% 0%, 49% 100%, 51% 100%)', indent: 'px-[45%]' }
  ];

  return (
    <div className="flex flex-col gap-2 w-full pt-3">
      {stages.map((stage, idx) => (
        <div 
          key={idx}
          className="relative group cursor-pointer transition-all duration-300 hover:scale-[1.02]"
          style={{
            clipPath: stage.clip,
            height: '42px',
            background: `linear-gradient(180deg, ${stage.color} 0%, rgba(8, 12, 24, 0.6) 100%)`,
            border: `1px solid ${stage.border}44`,
          }}
        >
          {/* Subtle hover neon outer glow */}
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className={`absolute inset-0 flex items-center justify-between ${stage.indent} text-[10px] font-mono font-bold text-white tracking-wider`}>
            <span>{stage.label}</span>
            <span>{stage.count} ({stage.pct}%)</span>
          </div>
        </div>
      ))}
    </div>
  );
};
