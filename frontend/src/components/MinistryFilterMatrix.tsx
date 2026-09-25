import React from 'react';
import { MINISTRIES } from '../data/problemStatements';

interface MinistryFilterMatrixProps {
  selectedMinistry: string;
  onSelectMinistry: (code: string) => void;
  ministryCounts: Record<string, number>;
}

export const MinistryFilterMatrix: React.FC<MinistryFilterMatrixProps> = ({
  selectedMinistry,
  onSelectMinistry,
  ministryCounts,
}) => {
  return (
    <div className="w-full mb-6">
      {/* Structural Sub-header */}
      <div className="flex items-center justify-between border-2 border-[#565f89] bg-[#16161E] px-3 py-1.5 font-mono text-xs text-[#9aa5ce] mb-[-2px]">
        <div className="flex items-center space-x-2">
          <span className="text-[#ffffff] font-bold tracking-wider">ORGANIZATIONS & MINISTRIES</span>
          <span className="text-[#565f89]">::</span>
          <span className="text-[#7dcfff]">AFFILIATION_MATRIX</span>
        </div>
        <span className="text-[10px] text-[#565f89] hidden sm:inline">
          [SELECT TO FILTER SUB-NODES]
        </span>
      </div>

      {/* Grid of sharp-edged, border-only rectangles that fill with solid stark color upon selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 border-2 border-[#565f89] bg-[#000000] p-1 gap-1">
        {MINISTRIES.map((ministry) => {
          const isSelected = selectedMinistry === ministry.code;
          const count = ministry.code === 'ALL'
            ? Object.values(ministryCounts).reduce((a, b) => a + b, 0)
            : ministryCounts[ministry.code] || 0;

          return (
            <button
              key={ministry.code}
              onClick={() => onSelectMinistry(ministry.code)}
              className={`flex flex-col justify-between p-2 text-left border font-mono transition-none cursor-pointer group ${
                isSelected
                  ? 'bg-[#7dcfff] text-black border-[#7dcfff] shadow-brutal-sm-cyan font-bold'
                  : 'bg-[#16161E] text-[#c0caf5] border-[#565f89] hover:border-[#c0caf5] hover:bg-[#000000]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-bold ${isSelected ? 'text-black' : 'text-[#ffffff]'}`}>
                  {ministry.code}
                </span>
                <span className={`text-[10px] px-1 border ${
                  isSelected
                    ? 'border-black text-black font-extrabold bg-white/20'
                    : 'border-[#565f89] text-[#9aa5ce]'
                }`}>
                  {count}
                </span>
              </div>
              <div className={`text-[10px] truncate mt-1 line-clamp-1 ${
                isSelected ? 'text-black' : 'text-[#9aa5ce] group-hover:text-[#c0caf5]'
              }`}>
                {ministry.name}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
