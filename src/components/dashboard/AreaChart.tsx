import React from 'react';
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AreaChartProps {
  data: any[];
}

export const AreaChart: React.FC<AreaChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#39FF14" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#39FF14" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            stroke="#475569" 
            fontSize={9} 
            fontFamily="IBM Plex Mono"
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#475569" 
            fontSize={9} 
            fontFamily="IBM Plex Mono"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#080C18', 
              borderColor: 'rgba(0, 212, 255, 0.25)', 
              borderRadius: '6px',
              fontFamily: 'IBM Plex Mono',
              fontSize: '10px'
            }}
            labelStyle={{ color: '#94A3B8', fontWeight: 'bold' }}
            itemStyle={{ color: '#FFF' }}
          />
          <Area 
            type="monotone" 
            dataKey="total_leads" 
            stroke="#00D4FF" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorTotal)" 
            name="Total Leads"
          />
          <Area 
            type="monotone" 
            dataKey="closed_won" 
            stroke="#39FF14" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorWon)" 
            name="Won Deals"
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};
