import React, { useState } from 'react';
import { ProblemStatement } from '../data/problemStatements';
import { X, Copy, Check, Bookmark, CheckSquare, Square, Download, Share2, Layers, Cpu, Code2, AlertTriangle, FileText } from 'lucide-react';

interface ProblemDetailDrawerProps {
  problem: ProblemStatement | null;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  isSelectedForCompare: boolean;
  onToggleCompare: (id: string) => void;
}

export const ProblemDetailDrawer: React.FC<ProblemDetailDrawerProps> = ({
  problem,
  onClose,
  isBookmarked,
  onToggleBookmark,
  isSelectedForCompare,
  onToggleCompare,
}) => {
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  if (!problem) return null;

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(problem, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1500);
  };

  const handleDownloadMarkdown = () => {
    const md = `# [${problem.id}] ${problem.title}
**Organization:** ${problem.organization} (${problem.ministryCode})  
**Domain:** ${problem.domain}  
**Category:** ${problem.category}  
**Complexity:** ${problem.complexity}  
**Impact Score:** ${problem.impactScore}/100  
**Submissions Logged:** ${problem.submissionCount}  
**Dataset Status:** ${problem.datasetAvailability}  

---

### Description
${problem.description}

### Operational & Technical Constraints
${problem.constraints.map((c) => `- ${c}`).join('\n')}

### Expected Deliverables & Solutions
${problem.expectedSolution.map((s) => `- ${s}`).join('\n')}

### Recommended Tech Stack
${problem.techStack.join(', ')}

---
*Exported via SIH Buddy Brutalist Directory on ${new Date().toISOString()}*
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${problem.id}_SPECIFICATION.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-none p-0">
      {/* Slide-out Brutalist Inspector Container */}
      <div className="w-full max-w-2xl bg-[#000000] border-l-4 border-[#7dcfff] shadow-brutal-lg-cyan h-full flex flex-col overflow-hidden animate-none">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b-2 border-[#565f89] bg-[#16161E] px-4 py-3 font-mono text-xs text-[#c0caf5]">
          <div className="flex items-center space-x-2">
            <span className="bg-[#7dcfff] text-black font-bold px-2 py-0.5">
              {problem.id}
            </span>
            <span className="text-[#565f89]">::</span>
            <span className="text-[#9ece6a] font-bold">{problem.category}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggleCompare(problem.id)}
              className={`flex items-center space-x-1 px-2 py-1 text-xs border font-bold transition-none cursor-pointer ${
                isSelectedForCompare
                  ? 'bg-[#7dcfff] text-black border-[#7dcfff]'
                  : 'text-[#9aa5ce] border-[#565f89] hover:border-[#7dcfff] hover:text-white'
              }`}
            >
              {isSelectedForCompare ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              <span>{isSelectedForCompare ? 'IN SHORTLIST' : '+COMPARE'}</span>
            </button>

            <button
              onClick={() => onToggleBookmark(problem.id)}
              className={`p-1.5 border transition-none cursor-pointer ${
                isBookmarked
                  ? 'bg-[#bb9af7] text-black border-[#bb9af7]'
                  : 'text-[#9aa5ce] border-[#565f89] hover:border-[#bb9af7] hover:text-white'
              }`}
              title={isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 border border-[#f7768e] text-[#f7768e] hover:bg-[#f7768e] hover:text-black transition-none cursor-pointer"
              title="Close specification view [ESC]"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Specification Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Header Title */}
          <div>
            <div className="text-xs font-mono text-[#9ece6a] font-bold tracking-wider mb-1">
              [AFFILIATION: {problem.organization}]
            </div>
            <h2 className="font-sans font-extrabold text-white text-xl md:text-2xl leading-tight">
              {problem.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-3 font-mono text-xs">
              <span className="border border-[#565f89] bg-[#16161E] px-2 py-1 text-[#c0caf5]">
                DOMAIN: <strong className="text-[#bb9af7]">{problem.domain}</strong>
              </span>
              <span className="border border-[#565f89] bg-[#16161E] px-2 py-1 text-[#c0caf5]">
                DATASET: <strong className="text-[#7dcfff]">{problem.datasetAvailability}</strong>
              </span>
              <span className="border border-[#565f89] bg-[#16161E] px-2 py-1 text-[#c0caf5]">
                COMPLEXITY: <strong className="text-[#f7768e]">{problem.complexity}</strong>
              </span>
            </div>
          </div>

          {/* Telemetry Stats Quad */}
          <div className="grid grid-cols-3 border-2 border-[#565f89] bg-[#000000] divide-x-2 divide-[#565f89] text-center font-mono">
            <div className="p-3 bg-[#16161E]">
              <div className="text-[10px] text-[#565f89] font-bold uppercase">PROPOSALS FILED</div>
              <div className="font-bold text-white text-lg mt-0.5">{problem.submissionCount}</div>
            </div>
            <div className="p-3 bg-[#16161E]">
              <div className="text-[10px] text-[#565f89] font-bold uppercase">ACCEPTANCE EST.</div>
              <div className="font-bold text-[#bb9af7] text-lg mt-0.5">{problem.acceptanceEstimate}</div>
            </div>
            <div className="p-3 bg-[#16161E]">
              <div className="text-[10px] text-[#565f89] font-bold uppercase">IMPACT INDEX</div>
              <div className="font-bold text-[#7dcfff] text-lg mt-0.5">{problem.impactScore}/100</div>
            </div>
          </div>

          {/* Problem Statement Overview */}
          <div className="border-2 border-[#565f89] bg-[#16161E] p-4">
            <div className="text-xs font-mono text-[#7dcfff] font-bold tracking-wider mb-2 border-b border-[#24283b] pb-1">
              // 01. STATEMENT_BACKGROUND
            </div>
            <p className="text-sm font-sans text-[#c0caf5] leading-relaxed">
              {problem.description}
            </p>
          </div>

          {/* Operational Constraints */}
          <div className="border-2 border-[#565f89] bg-[#000000] p-4">
            <div className="text-xs font-mono text-[#f7768e] font-bold tracking-wider mb-3 border-b border-[#24283b] pb-1 flex items-center justify-between">
              <span>// 02. CRITICAL_HARDWARE_AND_SYSTEM_CONSTRAINTS</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#f7768e]" />
            </div>
            <ul className="space-y-2 font-mono text-xs text-[#9aa5ce]">
              {problem.constraints.map((constraint, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-[#f7768e] mr-2 font-bold select-none">[!]</span>
                  <span className="text-[#c0caf5]">{constraint}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Expected Solution Architecture */}
          <div className="border-2 border-[#565f89] bg-[#000000] p-4">
            <div className="text-xs font-mono text-[#9ece6a] font-bold tracking-wider mb-3 border-b border-[#24283b] pb-1">
              // 03. MANDATORY_DELIVERABLES_&_BENCHMARKS
            </div>
            <ul className="space-y-2 font-mono text-xs text-[#9aa5ce]">
              {problem.expectedSolution.map((solution, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-[#9ece6a] mr-2 font-bold select-none">[✓]</span>
                  <span className="text-[#c0caf5]">{solution}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack Matrix */}
          <div className="border-2 border-[#565f89] bg-[#16161E] p-4 font-mono">
            <div className="text-xs text-[#bb9af7] font-bold tracking-wider mb-2 border-b border-[#24283b] pb-1">
              // 04. RECOMMENDED_STACK_&_FRAMEWORKS
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {problem.techStack.map((tech) => (
                <span
                  key={tech}
                  className="bg-[#000000] border border-[#565f89] text-[#7dcfff] text-xs px-2 py-1 font-bold"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="border-t-2 border-[#565f89] bg-[#16161E] p-4 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <div className="text-[11px] text-[#565f89]">
            LAST_SYNC: {problem.lastUpdated}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyJSON}
              className="flex items-center space-x-1 bg-[#000000] border border-[#565f89] hover:border-[#7dcfff] text-[#c0caf5] hover:text-[#7dcfff] px-3 py-1.5 font-bold transition-none cursor-pointer"
            >
              {copiedJson ? <Check className="w-3.5 h-3.5 text-[#9ece6a]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJson ? 'COPIED_JSON' : 'COPY_RAW_JSON'}</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center space-x-1 bg-[#7dcfff] text-black border border-[#7dcfff] hover:bg-[#ffffff] px-3 py-1.5 font-bold transition-none cursor-pointer shadow-brutal-sm-cyan"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{copiedMarkdown ? 'DOWNLOADING...' : 'EXPORT_SPEC.MD'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
