import React, { useState } from 'react';
import { ProblemStatement } from '../data/problemStatements';
import { Bookmark, CheckSquare, Square, ExternalLink, Copy, Check, Cpu, Code2, AlertTriangle, Flame } from 'lucide-react';

interface ProblemCardProps {
  problem: ProblemStatement;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  isSelectedForCompare: boolean;
  onToggleCompare: (id: string) => void;
  onSelectProblem: (problem: ProblemStatement) => void;
  density?: 'compact' | 'normal';
}

export const ProblemCard: React.FC<ProblemCardProps> = ({
  problem,
  isBookmarked,
  onToggleBookmark,
  isSelectedForCompare,
  onToggleCompare,
  onSelectProblem,
  density = 'normal',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(problem.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  // Status badge styling
  const getStatusBadge = () => {
    switch (problem.status) {
      case 'CRITICAL_NEED':
        return {
          label: 'CRITICAL',
          icon: <AlertTriangle className="w-3 h-3 mr-1" />,
          classes: 'bg-[#f7768e] text-black border-[#f7768e]',
        };
      case 'HIGH_COMPETITION':
        return {
          label: 'HIGH_VOLUME',
          icon: <Flame className="w-3 h-3 mr-1" />,
          classes: 'bg-[#e0af68] text-black border-[#e0af68]',
        };
      case 'HARDWARE_INTENSIVE':
        return {
          label: 'HW_RIGOR',
          icon: <Cpu className="w-3 h-3 mr-1" />,
          classes: 'bg-[#bb9af7] text-black border-[#bb9af7]',
        };
      case 'OPEN':
      default:
        return {
          label: 'AVAILABLE',
          icon: null,
          classes: 'bg-[#9ece6a] text-black border-[#9ece6a]',
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <article
      onClick={() => onSelectProblem(problem)}
      className={`group relative flex flex-col bg-[#16161E] border-2 border-[#565f89] transition-none cursor-pointer select-none text-left
        hover:border-[#c0caf5] hover:bg-[#0d0e15] hover:shadow-brutal-purple focus-within:border-[#7dcfff]
        ${isSelectedForCompare ? 'border-[#7dcfff] bg-[#000000] shadow-brutal-cyan' : ''}
      `}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between border-b-2 border-[#565f89] bg-[#000000] px-3 py-2 text-xs font-mono">
        <div className="flex items-center space-x-2">
          {/* Problem ID Badge */}
          <span className="font-mono font-bold text-sm tracking-wider text-[#7dcfff] group-hover:text-[#ffffff] group-hover:bg-[#7dcfff] group-hover:text-black px-1.5 py-0.5 border border-[#7dcfff] transition-none">
            {problem.id}
          </span>

          {/* Category Monospace Pill-Less Box */}
          <span
            className={`px-1.5 py-0.5 font-mono text-[10px] font-bold border ${
              problem.category === 'SOFTWARE'
                ? 'border-[#7dcfff] text-[#7dcfff]'
                : 'border-[#bb9af7] text-[#bb9af7]'
            }`}
          >
            {problem.category === 'SOFTWARE' ? (
              <span className="flex items-center">
                <Code2 className="w-3 h-3 mr-1 inline" />
                SW
              </span>
            ) : (
              <span className="flex items-center">
                <Cpu className="w-3 h-3 mr-1 inline" />
                HW
              </span>
            )}
          </span>
        </div>

        {/* Action Toggles: Copy, Compare, Bookmark */}
        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleCopyId}
            title="Copy Problem Statement ID"
            aria-label={`Copy ID ${problem.id}`}
            className="p-1 text-[#9aa5ce] hover:text-black hover:bg-[#7dcfff] border border-transparent hover:border-[#7dcfff] transition-none cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#9ece6a]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onToggleCompare(problem.id)}
            title={isSelectedForCompare ? 'Remove from compare shortlist' : 'Add to compare shortlist'}
            aria-label="Toggle comparison"
            className={`p-1 border transition-none cursor-pointer ${
              isSelectedForCompare
                ? 'bg-[#7dcfff] text-black border-[#7dcfff]'
                : 'text-[#9aa5ce] hover:text-black hover:bg-[#7dcfff] border-transparent hover:border-[#7dcfff]'
            }`}
          >
            {isSelectedForCompare ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => onToggleBookmark(problem.id)}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark problem statement'}
            aria-label="Toggle bookmark"
            className={`p-1 border transition-none cursor-pointer ${
              isBookmarked
                ? 'bg-[#bb9af7] text-black border-[#bb9af7]'
                : 'text-[#9aa5ce] hover:text-black hover:bg-[#bb9af7] border-transparent hover:border-[#bb9af7]'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Ministry & Domain Sub-Header */}
      <div className="px-3 pt-2.5 pb-1 flex flex-wrap items-center justify-between text-[11px] font-mono border-b border-[#24283b] bg-[#16161E]/80">
        <span className="text-[#9ece6a] font-bold tracking-wide truncate max-w-[65%]">
          {problem.organization}
        </span>
        <span className="text-[#9aa5ce] uppercase tracking-wider text-[10px]">
          {problem.domain}
        </span>
      </div>

      {/* Title - Bold Grotesque Font with aggressive raw typographic contrast */}
      <div className="px-3 py-3 flex-1 flex flex-col justify-start">
        <h3 className="font-sans font-bold text-white text-base md:text-lg leading-tight tracking-tight group-hover:text-[#7dcfff] transition-none mb-2">
          {problem.title}
        </h3>

        {density === 'normal' && (
          <p className="font-mono text-xs text-[#9aa5ce] line-clamp-2 leading-relaxed mb-3">
            {problem.description}
          </p>
        )}

        {/* Tech Stack Monospace Tags */}
        <div className="flex flex-wrap gap-1 mt-auto pt-2">
          {problem.techStack.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="text-[10px] font-mono font-medium text-[#c0caf5] bg-[#000000] border border-[#565f89] px-1.5 py-0.5 group-hover:border-[#c0caf5] transition-none"
            >
              #{tech}
            </span>
          ))}
          {problem.techStack.length > 4 && (
            <span className="text-[10px] font-mono text-[#9aa5ce] px-1 py-0.5 border border-dashed border-[#565f89]">
              +{problem.techStack.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Metrics & Telemetry Grid Footer - Strictly Monospace */}
      <div className="grid grid-cols-3 border-t-2 border-[#565f89] bg-[#000000] text-center font-mono divide-x-2 divide-[#565f89]">
        {/* Metric 1: Complexity */}
        <div className="p-2">
          <div className="text-[9px] uppercase tracking-widest text-[#565f89] font-bold">COMPLEXITY</div>
          <div className={`text-xs font-bold mt-0.5 ${
            problem.complexityLevel >= 4
              ? 'text-[#f7768e]'
              : problem.complexityLevel === 3
              ? 'text-[#e0af68]'
              : 'text-[#9ece6a]'
          }`}>
            L{problem.complexityLevel}
          </div>
        </div>

        {/* Metric 2: Submissions */}
        <div className="p-2">
          <div className="text-[9px] uppercase tracking-widest text-[#565f89] font-bold">SUBMISSIONS</div>
          <div className="text-xs font-bold text-[#c0caf5] mt-0.5">
            {problem.submissionCount}
          </div>
        </div>

        {/* Metric 3: Impact Score */}
        <div className="p-2">
          <div className="text-[9px] uppercase tracking-widest text-[#565f89] font-bold">IMPACT</div>
          <div className="text-xs font-bold text-[#7dcfff] mt-0.5">
            {problem.impactScore}/100
          </div>
        </div>
      </div>

      {/* Card Base Status Ribbon */}
      <div className="flex items-center justify-between border-t border-[#565f89] bg-[#16161E] px-3 py-1.5 text-[10px] font-mono">
        <div className="flex items-center">
          <span className={`inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold uppercase border ${statusBadge.classes}`}>
            {statusBadge.icon}
            {statusBadge.label}
          </span>
        </div>
        
        <span className="inline-flex items-center text-[#c0caf5] group-hover:text-[#bb9af7] font-bold font-mono">
          <span>INSPECT_SPEC</span>
          <ExternalLink className="w-3 h-3 ml-1" />
        </span>
      </div>
    </article>
  );
};
