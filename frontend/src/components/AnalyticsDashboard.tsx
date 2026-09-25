import React from 'react';
import { ProblemStatement } from '../data/problemStatements';
import { BarChart3, PieChart, Activity, Zap, Cpu, Code2, ShieldAlert } from 'lucide-react';

interface AnalyticsDashboardProps {
  problems: ProblemStatement[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ problems }) => {
  const totalProblems = problems.length;
  const totalSubmissions = problems.reduce((acc, p) => acc + p.submissionCount, 0);
  const avgImpact = totalProblems > 0
    ? Math.round(problems.reduce((acc, p) => acc + p.impactScore, 0) / totalProblems)
    : 0;

  const softwareCount = problems.filter((p) => p.category === 'SOFTWARE').length;
  const hardwareCount = problems.filter((p) => p.category === 'HARDWARE').length;
  const softwarePercent = totalProblems > 0 ? Math.round((softwareCount / totalProblems) * 100) : 0;
  const hardwarePercent = totalProblems > 0 ? 100 - softwarePercent : 0;

  // Complexity breakdown
  const complexityCounts = {
    L1: problems.filter((p) => p.complexityLevel === 1).length,
    L2: problems.filter((p) => p.complexityLevel === 2).length,
    L3: problems.filter((p) => p.complexityLevel === 3).length,
    L4: problems.filter((p) => p.complexityLevel === 4).length,
  };

  // Ministry breakdown
  const ministryDistribution: Record<string, number> = {};
  problems.forEach((p) => {
    ministryDistribution[p.ministryCode] = (ministryDistribution[p.ministryCode] || 0) + 1;
  });

  // Domain breakdown
  const domainDistribution: Record<string, number> = {};
  problems.forEach((p) => {
    domainDistribution[p.domain] = (domainDistribution[p.domain] || 0) + 1;
  });

  return (
    <div className="w-full space-y-4 mb-6">
      {/* Top Telemetry Stat Punch Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-2 border-[#565f89] bg-[#000000] divide-y-2 md:divide-y-0 md:divide-x-2 divide-[#565f89]">
        {/* Metric 1 */}
        <div className="p-3 bg-[#16161E] font-mono">
          <div className="text-[10px] uppercase text-[#9aa5ce] font-bold tracking-widest flex items-center">
            <Activity className="w-3.5 h-3.5 mr-1 text-[#7dcfff]" />
            TOTAL_INDEXED
          </div>
          <div className="font-sans font-extrabold text-white text-3xl md:text-4xl mt-1">
            {totalProblems}
          </div>
          <div className="text-[10px] text-[#565f89] mt-1">ACTIVE STATEMENTS</div>
        </div>

        {/* Metric 2 */}
        <div className="p-3 bg-[#16161E] font-mono">
          <div className="text-[10px] uppercase text-[#9aa5ce] font-bold tracking-widest flex items-center">
            <Zap className="w-3.5 h-3.5 mr-1 text-[#bb9af7]" />
            AGGREGATE_SUBS
          </div>
          <div className="font-sans font-extrabold text-[#bb9af7] text-3xl md:text-4xl mt-1">
            {totalSubmissions.toLocaleString()}
          </div>
          <div className="text-[10px] text-[#565f89] mt-1">PROPOSALS SUBMITTED</div>
        </div>

        {/* Metric 3 */}
        <div className="p-3 bg-[#16161E] font-mono">
          <div className="text-[10px] uppercase text-[#9aa5ce] font-bold tracking-widest flex items-center">
            <ShieldAlert className="w-3.5 h-3.5 mr-1 text-[#9ece6a]" />
            AVG_IMPACT_SCORE
          </div>
          <div className="font-sans font-extrabold text-[#9ece6a] text-3xl md:text-4xl mt-1">
            {avgImpact}
            <span className="text-base text-[#565f89] font-normal">/100</span>
          </div>
          <div className="text-[10px] text-[#565f89] mt-1">NATIONAL STRATEGIC PRIORITY</div>
        </div>

        {/* Metric 4 */}
        <div className="p-3 bg-[#16161E] font-mono">
          <div className="text-[10px] uppercase text-[#9aa5ce] font-bold tracking-widest flex items-center">
            <BarChart3 className="w-3.5 h-3.5 mr-1 text-[#f7768e]" />
            SW / HW RATIO
          </div>
          <div className="font-sans font-extrabold text-white text-3xl md:text-4xl mt-1">
            <span className="text-[#7dcfff]">{softwarePercent}%</span>
            <span className="text-[#565f89] text-xl mx-1">/</span>
            <span className="text-[#bb9af7]">{hardwarePercent}%</span>
          </div>
          <div className="text-[10px] text-[#565f89] mt-1">{softwareCount} SW : {hardwareCount} HW NODES</div>
        </div>
      </div>

      {/* Analytical Visual Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Module A: Category & Complexity Telemetry */}
        <div className="border-2 border-[#565f89] bg-[#000000] p-0 font-mono">
          <div className="bg-[#16161E] border-b-2 border-[#565f89] px-3 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <PieChart className="w-3.5 h-3.5 text-[#7dcfff]" />
              <span className="text-white font-bold tracking-wider">COMPLEXITY DISTRIBUTION MATRIX</span>
            </div>
            <span className="text-[10px] text-[#9aa5ce]">[LEVEL 1 TO 4]</span>
          </div>

          <div className="p-4 space-y-3 bg-[#000000]">
            {/* L1 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#9ece6a] font-bold">L1: BASIC DISCOVERY</span>
                <span className="text-white font-bold">{complexityCounts.L1} PS</span>
              </div>
              <div className="h-4 w-full bg-[#16161E] border border-[#565f89] p-0.5">
                <div
                  className="h-full bg-[#9ece6a] transition-none"
                  style={{ width: `${totalProblems > 0 ? (complexityCounts.L1 / totalProblems) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* L2 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#7dcfff] font-bold">L2: MODERATE ARCHITECTURE</span>
                <span className="text-white font-bold">{complexityCounts.L2} PS</span>
              </div>
              <div className="h-4 w-full bg-[#16161E] border border-[#565f89] p-0.5">
                <div
                  className="h-full bg-[#7dcfff] transition-none"
                  style={{ width: `${totalProblems > 0 ? (complexityCounts.L2 / totalProblems) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* L3 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#e0af68] font-bold">L3: ADVANCED / EDGE EMBEDDED</span>
                <span className="text-white font-bold">{complexityCounts.L3} PS</span>
              </div>
              <div className="h-4 w-full bg-[#16161E] border border-[#565f89] p-0.5">
                <div
                  className="h-full bg-[#e0af68] transition-none"
                  style={{ width: `${totalProblems > 0 ? (complexityCounts.L3 / totalProblems) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* L4 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#f7768e] font-bold">L4: EXTREME MISSION-CRITICAL</span>
                <span className="text-white font-bold">{complexityCounts.L4} PS</span>
              </div>
              <div className="h-4 w-full bg-[#16161E] border border-[#565f89] p-0.5">
                <div
                  className="h-full bg-[#f7768e] transition-none"
                  style={{ width: `${totalProblems > 0 ? (complexityCounts.L4 / totalProblems) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Module B: Domain Density Breakdown */}
        <div className="border-2 border-[#565f89] bg-[#000000] p-0 font-mono">
          <div className="bg-[#16161E] border-b-2 border-[#565f89] px-3 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-3.5 h-3.5 text-[#bb9af7]" />
              <span className="text-white font-bold tracking-wider">DOMAIN DENSITY BREAKDOWN</span>
            </div>
            <span className="text-[10px] text-[#9aa5ce]">[SECTORIAL PROPORTIONS]</span>
          </div>

          <div className="p-4 space-y-2.5 max-h-56 overflow-y-auto">
            {Object.entries(domainDistribution).map(([domain, count]) => {
              const pct = totalProblems > 0 ? Math.round((count / totalProblems) * 100) : 0;
              return (
                <div key={domain} className="border-b border-[#24283b] pb-1.5 last:border-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#c0caf5] font-mono text-[11px] truncate">{domain}</span>
                    <span className="text-[#bb9af7] font-bold text-xs shrink-0 ml-2">
                      {count} PS ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#16161E] border border-[#565f89]">
                    <div
                      className="h-full bg-[#bb9af7] transition-none"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
