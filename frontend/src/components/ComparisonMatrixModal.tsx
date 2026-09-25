import React from 'react';
import { ProblemStatement } from '../data/problemStatements';
import { X, Trash2, Download, AlertTriangle, Cpu, Code2 } from 'lucide-react';

interface ComparisonMatrixModalProps {
  compareIds: Set<string>;
  allProblems: ProblemStatement[];
  onClose: () => void;
  onRemoveFromCompare: (id: string) => void;
  onClearAll: () => void;
  onSelectProblem: (problem: ProblemStatement) => void;
}

export const ComparisonMatrixModal: React.FC<ComparisonMatrixModalProps> = ({
  compareIds,
  allProblems,
  onClose,
  onRemoveFromCompare,
  onClearAll,
  onSelectProblem,
}) => {
  const selectedProblems = allProblems.filter((p) => compareIds.has(p.id));

  if (selectedProblems.length === 0) return null;

  const handleExportComparison = () => {
    const data = selectedProblems.map((p) => ({
      id: p.id,
      title: p.title,
      organization: p.organization,
      category: p.category,
      complexity: p.complexity,
      submissions: p.submissionCount,
      impact: p.impactScore,
      techStack: p.techStack.join(', '),
      constraints: p.constraints.join(' | '),
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIH_PROBLEM_COMPARISON_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-6xl bg-[#000000] border-4 border-[#bb9af7] shadow-brutal-lg-purple flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-[#565f89] bg-[#16161E] px-4 py-3 font-mono text-xs">
          <div className="flex items-center space-x-2">
            <span className="bg-[#bb9af7] text-black font-extrabold px-2 py-0.5">
              SHORTLIST_MATRIX
            </span>
            <span className="text-[#565f89]">::</span>
            <span className="text-white font-bold">
              COMPARING {selectedProblems.length} STATEMENTS
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportComparison}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-mono font-bold bg-[#000000] border border-[#7dcfff] text-[#7dcfff] hover:bg-[#7dcfff] hover:text-black transition-none cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT_MATRIX</span>
            </button>

            <button
              onClick={onClearAll}
              className="flex items-center space-x-1 px-2.5 py-1 text-xs font-mono font-bold bg-[#000000] border border-[#f7768e] text-[#f7768e] hover:bg-[#f7768e] hover:text-black transition-none cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>CLEAR_ALL</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 border border-[#565f89] text-[#9aa5ce] hover:bg-[#f7768e] hover:text-black hover:border-[#f7768e] transition-none cursor-pointer"
              aria-label="Close Comparison"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Matrix Table */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4">
          <div className="min-w-[700px] border-2 border-[#565f89] bg-[#000000]">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-[#16161E] border-b-2 border-[#565f89]">
                  <th className="p-3 border-r-2 border-[#565f89] w-40 text-[#9aa5ce] uppercase tracking-wider">
                    ATTRIBUTE
                  </th>
                  {selectedProblems.map((problem) => (
                    <th key={problem.id} className="p-3 border-r-2 border-[#565f89] last:border-r-0 min-w-[260px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#7dcfff] font-bold text-sm">{problem.id}</span>
                        <button
                          onClick={() => onRemoveFromCompare(problem.id)}
                          className="text-[#f7768e] hover:bg-[#f7768e] hover:text-black px-1 border border-[#f7768e] text-[10px]"
                        >
                          REMOVE
                        </button>
                      </div>
                      <div
                        onClick={() => {
                          onClose();
                          onSelectProblem(problem);
                        }}
                        className="font-sans font-bold text-white text-xs hover:text-[#7dcfff] cursor-pointer line-clamp-2"
                      >
                        {problem.title}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#565f89]">
                {/* Ministry */}
                <tr>
                  <td className="p-3 border-r-2 border-[#565f89] bg-[#16161E] text-[#9aa5ce] font-bold">
                    MINISTRY
                  </td>
                  {selectedProblems.map((p) => (
                    <td key={p.id} className="p-3 border-r-2 border-[#565f89] last:border-r-0 text-[#9ece6a] font-bold">
                      {p.organization} ({p.ministryCode})
                    </td>
                  ))}
                </tr>

                {/* Category & Domain */}
                <tr>
                  <td className="p-3 border-r-2 border-[#565f89] bg-[#16161E] text-[#9aa5ce] font-bold">
                    TYPE & DOMAIN
                  </td>
                  {selectedProblems.map((p) => (
                    <td key={p.id} className="p-3 border-r-2 border-[#565f89] last:border-r-0">
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold border mr-2 ${
                        p.category === 'SOFTWARE' ? 'border-[#7dcfff] text-[#7dcfff]' : 'border-[#bb9af7] text-[#bb9af7]'
                      }`}>
                        {p.category}
                      </span>
                      <span className="text-[#c0caf5]">{p.domain}</span>
                    </td>
                  ))}
                </tr>

                {/* Complexity */}
                <tr>
                  <td className="p-3 border-r-2 border-[#565f89] bg-[#16161E] text-[#9aa5ce] font-bold">
                    COMPLEXITY
                  </td>
                  {selectedProblems.map((p) => (
                    <td key={p.id} className="p-3 border-r-2 border-[#565f89] last:border-r-0 font-bold">
                      <span className={
                        p.complexityLevel >= 4
                          ? 'text-[#f7768e]'
                          : p.complexityLevel === 3
                          ? 'text-[#e0af68]'
                          : 'text-[#9ece6a]'
                      }>
                        {p.complexity}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Submissions & Acceptance */}
                <tr>
                  <td className="p-3 border-r-2 border-[#565f89] bg-[#16161E] text-[#9aa5ce] font-bold">
                    COMPETITION DENSITY
                  </td>
                  {selectedProblems.map((p) => (
                    <td key={p.id} className="p-3 border-r-2 border-[#565f89] last:border-r-0">
                      <div className="font-bold text-white text-sm">{p.submissionCount} Submissions</div>
                      <div className="text-[10px] text-[#bb9af7]">Est. Acceptance: {p.acceptanceEstimate}</div>
                    </td>
                  ))}
                </tr>

                {/* Impact Score */}
                <tr>
                  <td className="p-3 border-r-2 border-[#565f89] bg-[#16161E] text-[#9aa5ce] font-bold">
                    IMPACT SCORE
                  </td>
                  {selectedProblems.map((p) => (
                    <td key={p.id} className="p-3 border-r-2 border-[#565f89] last:border-r-0 font-bold text-[#7dcfff]">
                      {p.impactScore} / 100
                    </td>
                  ))}
                </tr>

                {/* Recommended Tech */}
                <tr>
                  <td className="p-3 border-r-2 border-[#565f89] bg-[#16161E] text-[#9aa5ce] font-bold">
                    TECH STACK
                  </td>
                  {selectedProblems.map((p) => (
                    <td key={p.id} className="p-3 border-r-2 border-[#565f89] last:border-r-0">
                      <div className="flex flex-wrap gap-1">
                        {p.techStack.map((tech) => (
                          <span key={tech} className="bg-[#16161E] border border-[#565f89] text-[10px] px-1 text-[#c0caf5]">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Key Constraints */}
                <tr>
                  <td className="p-3 border-r-2 border-[#565f89] bg-[#16161E] text-[#9aa5ce] font-bold">
                    KEY CONSTRAINTS
                  </td>
                  {selectedProblems.map((p) => (
                    <td key={p.id} className="p-3 border-r-2 border-[#565f89] last:border-r-0 text-[11px] text-[#9aa5ce]">
                      <ul className="list-disc pl-4 space-y-1">
                        {p.constraints.slice(0, 3).map((c, i) => (
                          <li key={i} className="text-[#c0caf5]">{c}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
