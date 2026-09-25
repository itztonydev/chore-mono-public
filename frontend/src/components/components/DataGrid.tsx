import React, { useState } from 'react';
import { ProblemStatement } from '../data/problemStatements';
import { ProblemCard } from './ProblemCard';
import { LayoutGrid, List, ArrowUpDown, Download, Layers, ShieldCheck } from 'lucide-react';

interface DataGridProps {
  problems: ProblemStatement[];
  bookmarkedIds: Set<string>;
  onToggleBookmark: (id: string) => void;
  compareIds: Set<string>;
  onToggleCompare: (id: string) => void;
  onSelectProblem: (problem: ProblemStatement) => void;
  onOpenCompareModal: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
}

export type SortField = 'id' | 'submissions' | 'complexity' | 'impact' | 'title';

export const DataGrid: React.FC<DataGridProps> = ({
  problems,
  bookmarkedIds,
  onToggleBookmark,
  compareIds,
  onToggleCompare,
  onSelectProblem,
  onOpenCompareModal,
  onExportJSON,
  onExportCSV,
}) => {
  const [density, setDensity] = useState<'normal' | 'compact'>('normal');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<SortField>('submissions');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Sort logic
  const sortedProblems = [...problems].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'id':
        comparison = a.id.localeCompare(b.id);
        break;
      case 'submissions':
        comparison = a.submissionCount - b.submissionCount;
        break;
      case 'complexity':
        comparison = a.complexityLevel - b.complexityLevel;
        break;
      case 'impact':
        comparison = a.impactScore - b.impactScore;
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="w-full">
      {/* Grid Controller & Exposed Metric Bar */}
      <div className="border-2 border-[#565f89] bg-[#000000] p-2 mb-4 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
        {/* Left: Telemetry & Count */}
        <div className="flex items-center space-x-3">
          <span className="bg-[#16161E] border border-[#565f89] px-2 py-1 text-[#c0caf5] font-bold">
            INDEXED_NODES: <span className="text-[#7dcfff]">{sortedProblems.length}</span>
          </span>
          {compareIds.size > 0 && (
            <button
              onClick={onOpenCompareModal}
              className="flex items-center space-x-1.5 bg-[#bb9af7] text-black border border-[#bb9af7] px-2.5 py-1 font-bold shadow-brutal-sm-purple cursor-pointer transition-none"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>COMPARE SHORTLIST ({compareIds.size})</span>
            </button>
          )}
        </div>

        {/* Right: Sort controls, Density switcher, Exports */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort Selector */}
          <div className="flex items-center space-x-1 border border-[#565f89] bg-[#16161E] px-2 py-0.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#9aa5ce]" />
            <span className="text-[10px] text-[#9aa5ce] uppercase">SORT:</span>
            <select
              value={sortBy}
              onChange={(e) => toggleSort(e.target.value as SortField)}
              className="bg-transparent text-[#ffffff] font-mono text-xs focus:outline-none cursor-pointer py-0.5"
            >
              <option value="submissions" className="bg-[#16161E] text-white">SUBMISSIONS ({sortOrder.toUpperCase()})</option>
              <option value="complexity" className="bg-[#16161E] text-white">COMPLEXITY ({sortOrder.toUpperCase()})</option>
              <option value="impact" className="bg-[#16161E] text-white">IMPACT SCORE ({sortOrder.toUpperCase()})</option>
              <option value="id" className="bg-[#16161E] text-white">ID NUMBER ({sortOrder.toUpperCase()})</option>
              <option value="title" className="bg-[#16161E] text-white">TITLE A-Z</option>
            </select>
          </div>

          {/* Density Toggle */}
          <div className="flex border border-[#565f89] bg-[#16161E]">
            <button
              onClick={() => setDensity('compact')}
              title="Compact density view"
              className={`px-2 py-1 uppercase text-[10px] font-bold transition-none cursor-pointer ${
                density === 'compact' ? 'bg-[#c0caf5] text-black' : 'text-[#9aa5ce] hover:text-white'
              }`}
            >
              COMPACT
            </button>
            <button
              onClick={() => setDensity('normal')}
              title="Normal density view"
              className={`px-2 py-1 uppercase text-[10px] font-bold border-l border-[#565f89] transition-none cursor-pointer ${
                density === 'normal' ? 'bg-[#c0caf5] text-black' : 'text-[#9aa5ce] hover:text-white'
              }`}
            >
              EXPANDED
            </button>
          </div>

          {/* View Mode (Grid vs Table) */}
          <div className="flex border border-[#565f89] bg-[#16161E]">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid representation"
              aria-label="Grid view"
              className={`p-1.5 transition-none cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#7dcfff] text-black' : 'text-[#9aa5ce] hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Dense structural tabular matrix"
              aria-label="Table view"
              className={`p-1.5 border-l border-[#565f89] transition-none cursor-pointer ${
                viewMode === 'table' ? 'bg-[#7dcfff] text-black' : 'text-[#9aa5ce] hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export Actions */}
          <div className="flex border border-[#565f89] bg-[#16161E]">
            <button
              onClick={onExportJSON}
              title="Export all matching statements as JSON"
              className="px-2 py-1 text-[10px] font-mono text-[#9ece6a] hover:bg-[#9ece6a] hover:text-black transition-none cursor-pointer flex items-center gap-1 font-bold"
            >
              <Download className="w-3 h-3" />
              <span>.JSON</span>
            </button>
            <button
              onClick={onExportCSV}
              title="Export all matching statements as CSV"
              className="px-2 py-1 text-[10px] font-mono text-[#7dcfff] hover:bg-[#7dcfff] hover:text-black border-l border-[#565f89] transition-none cursor-pointer flex items-center gap-1 font-bold"
            >
              <Download className="w-3 h-3" />
              <span>.CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {sortedProblems.length === 0 ? (
        <div className="w-full bg-[#16161E] border-2 border-[#565f89] p-12 text-center font-mono">
          <div className="inline-block border-2 border-[#f7768e] bg-black p-4 mb-4 text-[#f7768e] font-bold text-sm tracking-wider">
            [QUERY_RETURNED_NULL_ENTITIES]
          </div>
          <h4 className="font-sans font-bold text-white text-lg mb-2">No problem statements match criteria.</h4>
          <p className="text-xs text-[#9aa5ce] max-w-md mx-auto mb-4">
            Try loosening search tokens, resetting domain bucket to ALL, or clearing ministry constraints.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Structural Exposed Grid with Visible Inter-card Boundary Lines */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {sortedProblems.map((problem) => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              isBookmarked={bookmarkedIds.has(problem.id)}
              onToggleBookmark={onToggleBookmark}
              isSelectedForCompare={compareIds.has(problem.id)}
              onToggleCompare={onToggleCompare}
              onSelectProblem={onSelectProblem}
              density={density}
            />
          ))}
        </div>
      ) : (
        /* Data-Dense Brutalist Tabular Matrix */
        <div className="w-full overflow-x-auto border-2 border-[#565f89] bg-[#000000]">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-[#16161E] border-b-2 border-[#565f89] text-[#c0caf5]">
                <th className="p-3 border-r-2 border-[#565f89] w-24">PS_ID</th>
                <th className="p-3 border-r-2 border-[#565f89]">TITLE & SUMMARY</th>
                <th className="p-3 border-r-2 border-[#565f89] w-48">MINISTRY / ORG</th>
                <th className="p-3 border-r-2 border-[#565f89] w-28 text-center">TYPE</th>
                <th className="p-3 border-r-2 border-[#565f89] w-28 text-center">COMPLEXITY</th>
                <th className="p-3 border-r-2 border-[#565f89] w-28 text-right">SUBS</th>
                <th className="p-3 border-r-2 border-[#565f89] w-28 text-right">IMPACT</th>
                <th className="p-3 w-28 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#565f89]">
              {sortedProblems.map((problem) => {
                const isSelected = compareIds.has(problem.id);
                return (
                  <tr
                    key={problem.id}
                    onClick={() => onSelectProblem(problem)}
                    className={`hover:bg-[#16161E] cursor-pointer transition-none ${
                      isSelected ? 'bg-[#16161E]/90' : 'bg-[#000000]'
                    }`}
                  >
                    <td className="p-3 border-r-2 border-[#565f89] font-bold text-[#7dcfff]">
                      {problem.id}
                    </td>
                    <td className="p-3 border-r-2 border-[#565f89]">
                      <div className="font-sans font-bold text-white text-sm hover:text-[#7dcfff]">
                        {problem.title}
                      </div>
                      <div className="text-[10px] text-[#9aa5ce] mt-0.5 truncate max-w-xl">
                        {problem.domain} // {problem.techStack.join(', ')}
                      </div>
                    </td>
                    <td className="p-3 border-r-2 border-[#565f89] text-[#9ece6a] text-[11px] font-bold">
                      {problem.organization}
                    </td>
                    <td className="p-3 border-r-2 border-[#565f89] text-center">
                      <span className={`px-1.5 py-0.5 text-[10px] font-bold border ${
                        problem.category === 'SOFTWARE'
                          ? 'border-[#7dcfff] text-[#7dcfff]'
                          : 'border-[#bb9af7] text-[#bb9af7]'
                      }`}>
                        {problem.category}
                      </span>
                    </td>
                    <td className="p-3 border-r-2 border-[#565f89] text-center font-bold">
                      <span className={
                        problem.complexityLevel >= 4
                          ? 'text-[#f7768e]'
                          : problem.complexityLevel === 3
                          ? 'text-[#e0af68]'
                          : 'text-[#9ece6a]'
                      }>
                        L{problem.complexityLevel}
                      </span>
                    </td>
                    <td className="p-3 border-r-2 border-[#565f89] text-right font-bold text-[#c0caf5]">
                      {problem.submissionCount}
                    </td>
                    <td className="p-3 border-r-2 border-[#565f89] text-right font-bold text-[#7dcfff]">
                      {problem.impactScore}
                    </td>
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => onToggleCompare(problem.id)}
                          className={`px-1.5 py-0.5 border text-[10px] font-mono font-bold transition-none cursor-pointer ${
                            isSelected
                              ? 'bg-[#7dcfff] text-black border-[#7dcfff]'
                              : 'text-[#9aa5ce] border-[#565f89] hover:border-[#7dcfff]'
                          }`}
                        >
                          {isSelected ? 'SHORTLISTED' : '+COMP'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
