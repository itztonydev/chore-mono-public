import React, { useRef } from 'react';
import { Search, X, Terminal, Filter, RefreshCw } from 'lucide-react';

interface BrutalistSearchBlockProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: 'ALL' | 'SOFTWARE' | 'HARDWARE';
  onCategoryChange: (category: 'ALL' | 'SOFTWARE' | 'HARDWARE') => void;
  selectedDomain: string;
  onDomainChange: (domain: string) => void;
  domainList: readonly string[];
  totalResults: number;
  totalAvailable: number;
  onResetFilters: () => void;
}

export const BrutalistSearchBlock: React.FC<BrutalistSearchBlockProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDomain,
  onDomainChange,
  domainList,
  totalResults,
  totalAvailable,
  onResetFilters,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-full bg-[#000000] border-2 border-[#565f89] p-0 mb-6">
      {/* Top Terminal Status Header */}
      <div className="flex flex-wrap items-center justify-between border-b-2 border-[#565f89] bg-[#16161E] px-3 py-2 text-xs font-mono text-[#9aa5ce]">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-[#7dcfff]" />
          <span className="text-[#ffffff] font-bold tracking-wider">COMMAND://DIRECTORY_QUERY</span>
          <span className="text-[#565f89]">|</span>
          <span className="text-[#9ece6a]">ONLINE_INDEX</span>
        </div>
        <div className="flex items-center space-x-3 mt-1 sm:mt-0">
          <span className="text-[#c0caf5]">
            MATCHES: <span className="text-[#bb9af7] font-bold">{totalResults}</span> / {totalAvailable}
          </span>
          {(searchQuery || selectedCategory !== 'ALL' || selectedDomain !== 'ALL DOMAINS') && (
            <button
              onClick={onResetFilters}
              className="flex items-center space-x-1 text-[#f7768e] hover:bg-[#f7768e] hover:text-black px-1.5 py-0.5 border border-[#f7768e] transition-none cursor-pointer uppercase text-[10px] font-bold"
              title="Reset all active query parameters"
            >
              <RefreshCw className="w-3 h-3" />
              <span>RESET_FILTERS</span>
            </button>
          )}
        </div>
      </div>

      {/* Massive Brutalist Full-Width Search Input */}
      <div className="relative flex items-center bg-[#000000] group border-b-2 border-[#565f89] focus-within:border-[#c0caf5]">
        <div className="flex items-center justify-center pl-4 pr-2 text-[#7dcfff] font-mono text-sm sm:text-base font-bold select-none">
          <span className="text-[#bb9af7] mr-1">&gt;</span>
          <span className="hidden sm:inline text-[#9aa5ce]">PS_SEARCH:</span>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="SEARCH BY PROBLEM ID, KEYWORD, MINISTRY, OR TECH STACK..."
          aria-label="Search Problem Statements"
          className="w-full bg-transparent text-[#ffffff] font-mono text-sm sm:text-base md:text-lg py-4 px-2 focus:outline-none placeholder:text-[#565f89] placeholder:font-mono caret-[#7dcfff]"
        />

        {/* Blinking Cursor Indicator */}
        <div className="pr-3 text-[#7dcfff] font-mono text-lg select-none pointer-events-none animate-terminal-blink">
          ▋
        </div>

        {searchQuery ? (
          <button
            onClick={() => {
              onSearchChange('');
              inputRef.current?.focus();
            }}
            className="px-4 py-4 text-[#9aa5ce] hover:text-black hover:bg-[#f7768e] border-l-2 border-[#565f89] transition-none cursor-pointer"
            aria-label="Clear search input"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <div className="px-4 py-4 text-[#565f89] border-l-2 border-[#565f89] select-none">
            <Search className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Category Toggles & Filter Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x-2 divide-[#565f89] bg-[#000000]">
        {/* Category Radio Group */}
        <div className="md:col-span-5 p-2 flex items-center space-x-2">
          <span className="text-[11px] font-mono uppercase text-[#9aa5ce] px-2 font-bold tracking-wider">
            TYPE:
          </span>
          <div className="flex-1 flex gap-1">
            {(['ALL', 'SOFTWARE', 'HARDWARE'] as const).map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`flex-1 py-1.5 px-2 text-xs font-mono font-bold uppercase transition-none border cursor-pointer text-center ${
                    isSelected
                      ? cat === 'SOFTWARE'
                        ? 'bg-[#7dcfff] text-black border-[#7dcfff] shadow-brutal-sm-cyan'
                        : cat === 'HARDWARE'
                        ? 'bg-[#bb9af7] text-black border-[#bb9af7] shadow-brutal-sm-purple'
                        : 'bg-[#ffffff] text-black border-[#ffffff]'
                      : 'bg-[#16161E] text-[#9aa5ce] border-[#565f89] hover:border-[#c0caf5] hover:text-[#c0caf5]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Domain Filter Dropdown */}
        <div className="md:col-span-7 p-2 flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-[#9aa5ce] ml-2 shrink-0" />
          <span className="text-[11px] font-mono uppercase text-[#9aa5ce] font-bold tracking-wider shrink-0">
            DOMAIN:
          </span>
          <select
            value={selectedDomain}
            onChange={(e) => onDomainChange(e.target.value)}
            className="w-full bg-[#16161E] text-[#c0caf5] font-mono text-xs py-1.5 px-2 border border-[#565f89] focus:outline-none focus:border-[#7dcfff] cursor-pointer"
          >
            {domainList.map((domain) => (
              <option key={domain} value={domain} className="bg-[#16161E] text-[#c0caf5]">
                {domain}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Filter Active Tags Strip */}
      {(searchQuery || selectedCategory !== 'ALL' || selectedDomain !== 'ALL DOMAINS') && (
        <div className="border-t-2 border-[#565f89] bg-[#000000] px-3 py-2 flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-[#565f89] text-[10px] font-bold">ACTIVE FILTER PARAMETERS:</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 border border-[#7dcfff] bg-[#16161E] text-[#7dcfff] px-2 py-0.5">
              <span>QUERY: &quot;{searchQuery}&quot;</span>
              <button
                onClick={() => onSearchChange('')}
                className="hover:text-white cursor-pointer ml-1"
                aria-label="Remove query filter"
              >
                ✕
              </button>
            </span>
          )}
          {selectedCategory !== 'ALL' && (
            <span className="inline-flex items-center gap-1 border border-[#bb9af7] bg-[#16161E] text-[#bb9af7] px-2 py-0.5">
              <span>CATEGORY: {selectedCategory}</span>
              <button
                onClick={() => onCategoryChange('ALL')}
                className="hover:text-white cursor-pointer ml-1"
                aria-label="Reset category"
              >
                ✕
              </button>
            </span>
          )}
          {selectedDomain !== 'ALL DOMAINS' && (
            <span className="inline-flex items-center gap-1 border border-[#9ece6a] bg-[#16161E] text-[#9ece6a] px-2 py-0.5">
              <span>DOMAIN: {selectedDomain}</span>
              <button
                onClick={() => onDomainChange('ALL DOMAINS')}
                className="hover:text-white cursor-pointer ml-1"
                aria-label="Reset domain filter"
              >
                ✕
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
