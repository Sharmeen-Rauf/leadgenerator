import React, { useState, useEffect } from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, size = 180 }) => {
  const radius = size * 0.4;
  const strokeWidth = size * 0.07;
  const circumference = 2 * Math.PI * radius;
  const [dashOffset, setDashOffset] = useState(circumference);
  
  useEffect(() => {
    const offset = circumference - (score / 99) * circumference;
    const t = setTimeout(() => setDashOffset(offset), 150);
    return () => clearTimeout(t);
  }, [score, circumference]);
  
  const color = score >= 70 ? '#39FF14' : score >= 40 ? '#FFB800' : '#FF3366';
  
  return (
    <div className="relative flex flex-col items-center justify-center p-4 select-none">
      <svg className="transform -rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0, 212, 255, 0.03)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="score-circle-fill transition-all duration-1000"
          style={{ filter: `drop-shadow(0 0 10px ${color}88)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-mono font-extrabold text-white" style={{ textShadow: `0 0 12px ${color}88` }}>
          {score}
        </span>
        <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold mt-1">OF 99 POINT GAP</span>
      </div>
    </div>
  );
};
