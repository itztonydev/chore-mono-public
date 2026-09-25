import React from 'react';
import { Terminal, Shield, Zap, Sparkles, Database, Bookmark, Layers } from 'lucide-react';

interface BrutalistHeroProps {
  activeTab: 'directory' | 'analytics' | 'bookmarks';
  onTabChange: (tab: 'directory' | 'analytics' | 'bookmarks') => void;
  bookmarkCount: number;
  compareCount: number;
  onOpenCompare: () => void;
}

export const BrutalistHero: React.FC<BrutalistHeroProps> = ({
  activeTab,
  onTabChange,
  bookmarkCount,
  compareCount,
  onOpenCompare,
}) => {
  return (
    <header className="w-full border-b-4 border-[#7dcfff] bg-[#000000] text-left">
      {/* Top Raw Telemetry Marquee / Meta Bar */}
      <div className="flex flex-wrap items-center justify-between border-b-2 border-[#565f89] bg-[#16161E] px-3 py-1.5 font-mono text-[11px] text-[#9aa5ce]">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 bg-[#9ece6a] animate-ping" />
          <span className="text-[#ffffff] font-bold tracking-widest">
            SIH_BUDDY//OS.v26
          </span>
          <span className="text-[#565f89]">|</span>
          <span className="text-[#7dcfff]">SMART INDIA HACKATHON DIRECTORY</span>
        </div>

        <div className="flex items-center space-x-3 text-[10px]">
          <span className="text-[#c0caf5]">
            STATUS: <strong className="text-[#9ece6a]">OFFICIAL_DATASET_LIVE</strong>
          </span>
          <span className="text-[#565f89]">|</span>
          <span className="text-[#9aa5ce]">
            SECURITY_LEVEL: <strong className="text-[#e0af68]">PUBLIC_RELEASE</strong>
          </span>
        </div>
      </div>

      {/* Main Structural Hero Banner */}
      <div className="p-4 sm:p-6 md:p-8 border-b-2 border-[#565f89] bg-[#000000]">
        <div className="max-w-7xl mx-auto">
          {/* Brutalist Raw Eyebrow */}
          <div className="inline-flex items-center space-x-2 border-2 border-[#7dcfff] bg-[#16161E] px-2.5 py-1 text-xs font-mono text-[#7dcfff] mb-3">
            <Terminal className="w-3.5 h-3.5" />
            <span className="font-bold tracking-wider">SIH NATIONAL REPOSITORY // ARCHIVAL_INDEX</span>
          </div>

          {/* Oversized Raw Typography Headline Punch */}
          <h1 className="font-sans font-extrabold text-white text-3xl sm:text-5xl md:text-6xl lg:text-7xl leading-none tracking-tighter uppercase mb-3">
            PROBLEM STATEMENT <br className="hidden sm:inline" />
            <span className="text-[#7dcfff] underline decoration-[#bb9af7] decoration-4 underline-offset-8">
              DIRECTORY & TELEMETRY
            </span>
          </h1>

          {/* Stark Subtext & Context */}
          <p className="font-mono text-xs sm:text-sm text-[#9aa5ce] max-w-3xl leading-relaxed mt-4">
            Uncompromising directory engine for hackathon teams. Query government ministries, defense bodies, space agencies, and core infrastructure problem statements with zero visual fluff, real-time competition density, and full constraint breakdowns.
          </p>
        </div>
      </div>

      {/* Navigation Tabs - Strict Border-Only Blocks Filling with Stark Colors */}
      <div className="flex flex-wrap border-b-2 border-[#565f89] bg-[#000000] font-mono text-xs">
        <button
          onClick={() => onTabChange('directory')}
          className={`flex items-center space-x-2 px-5 py-3 border-r-2 border-[#565f89] font-bold uppercase transition-none cursor-pointer ${
            activeTab === 'directory'
              ? 'bg-[#7dcfff] text-black shadow-brutal-sm-cyan'
              : 'text-[#c0caf5] hover:bg-[#16161E] hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>STATEMENTS_INDEX</span>
        </button>

        <button
          onClick={() => onTabChange('analytics')}
          className={`flex items-center space-x-2 px-5 py-3 border-r-2 border-[#565f89] font-bold uppercase transition-none cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#bb9af7] text-black shadow-brutal-sm-purple'
              : 'text-[#c0caf5] hover:bg-[#16161E] hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>ANALYTICS_&_METRICS</span>
        </button>

        <button
          onClick={() => onTabChange('bookmarks')}
          className={`flex items-center space-x-2 px-5 py-3 border-r-2 border-[#565f89] font-bold uppercase transition-none cursor-pointer ${
            activeTab === 'bookmarks'
              ? 'bg-[#9ece6a] text-black shadow-brutal-sm-green'
              : 'text-[#c0caf5] hover:bg-[#16161E] hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>BOOKMARKS ({bookmarkCount})</span>
        </button>

        {compareCount > 0 && (
          <button
            onClick={onOpenCompare}
            className="flex items-center space-x-2 px-5 py-3 border-r-2 border-[#565f89] font-bold uppercase transition-none cursor-pointer bg-[#e0af68] text-black hover:bg-white"
          >
            <Layers className="w-4 h-4" />
            <span>COMPARE_MATRIX ({compareCount})</span>
          </button>
        )}
      </div>
    </header>
  );
};
