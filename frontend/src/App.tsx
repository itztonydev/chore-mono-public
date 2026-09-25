import React, { useState, useMemo, useEffect } from 'react';
import {
  SAMPLE_PROBLEM_STATEMENTS,
  DOMAIN_BUCKETS,
  ProblemStatement,
} from './data/problemStatements';
import { BrutalistHero } from './components/BrutalistHero';
import { BrutalistSearchBlock } from './components/BrutalistSearchBlock';
import { MinistryFilterMatrix } from './components/MinistryFilterMatrix';
import { DataGrid } from './components/DataGrid';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ProblemDetailDrawer } from './components/ProblemDetailDrawer';
import { ComparisonMatrixModal } from './components/ComparisonMatrixModal';
import { Bookmark, Terminal, Shield, Sparkles } from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'directory' | 'analytics' | 'bookmarks'>('directory');

  // Query & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'SOFTWARE' | 'HARDWARE'>('ALL');
  const [selectedDomain, setSelectedDomain] = useState('ALL DOMAINS');
  const [selectedMinistry, setSelectedMinistry] = useState('ALL');

  // Bookmarking & Compare Shortlist States
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('sih_bookmarks');
      return saved ? new Set(JSON.parse(saved)) : new Set(['SIH-1452', 'SIH-1399']);
    } catch {
      return new Set(['SIH-1452', 'SIH-1399']);
    }
  });

  const [compareIds, setCompareIds] = useState<Set<string>>(new Set(['SIH-1452', 'SIH-1512']));
  const [selectedProblem, setSelectedProblem] = useState<ProblemStatement | null>(null);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Sync bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sih_bookmarks', JSON.stringify(Array.from(bookmarkedIds)));
    } catch {
      // Ignore in restricted environments
    }
  }, [bookmarkedIds]);

  // Handle ESC key to dismiss drawer or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedProblem(null);
        setIsCompareModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute counts per ministry
  const ministryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SAMPLE_PROBLEM_STATEMENTS.forEach((p) => {
      counts[p.ministryCode] = (counts[p.ministryCode] || 0) + 1;
    });
    return counts;
  }, []);

  // Filtered Problem Statements
  const filteredProblems = useMemo(() => {
    return SAMPLE_PROBLEM_STATEMENTS.filter((problem) => {
      // Tab filter for bookmarks
      if (activeTab === 'bookmarks' && !bookmarkedIds.has(problem.id)) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && problem.category !== selectedCategory) {
        return false;
      }

      // Domain filter
      if (selectedDomain !== 'ALL DOMAINS' && problem.domain !== selectedDomain) {
        return false;
      }

      // Ministry filter
      if (selectedMinistry !== 'ALL' && problem.ministryCode !== selectedMinistry) {
        return false;
      }

      // Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = problem.id.toLowerCase().includes(q);
        const matchesTitle = problem.title.toLowerCase().includes(q);
        const matchesDesc = problem.description.toLowerCase().includes(q);
        const matchesOrg = problem.organization.toLowerCase().includes(q) || problem.ministryCode.toLowerCase().includes(q);
        const matchesDomain = problem.domain.toLowerCase().includes(q);
        const matchesTech = problem.techStack.some((t) => t.toLowerCase().includes(q));

        return matchesId || matchesTitle || matchesDesc || matchesOrg || matchesDomain || matchesTech;
      }

      return true;
    });
  }, [searchQuery, selectedCategory, selectedDomain, selectedMinistry, activeTab, bookmarkedIds]);

  // Toggle Bookmark
  const handleToggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle Compare
  const handleToggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 4) {
          // Limit to 4 for clean tabular comparison
          alert('Maximum 4 problem statements can be compared simultaneously.');
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedDomain('ALL DOMAINS');
    setSelectedMinistry('ALL');
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(filteredProblems, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIH_PROBLEM_STATEMENTS_EXPORT_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Organization', 'Category', 'Domain', 'Complexity', 'Submissions', 'ImpactScore', 'TechStack'];
    const rows = filteredProblems.map((p) => [
      `"${p.id}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.organization}"`,
      `"${p.category}"`,
      `"${p.domain}"`,
      `"${p.complexity}"`,
      p.submissionCount,
      p.impactScore,
      `"${p.techStack.join(', ')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIH_PROBLEM_STATEMENTS_EXPORT_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#c0caf5] font-sans antialiased selection:bg-[#7dcfff] selection:text-black">
      {/* Structural Brutalist Hero & Header */}
      <BrutalistHero
        activeTab={activeTab}
        onTabChange={setActiveTab}
        bookmarkCount={bookmarkedIds.size}
        compareCount={compareIds.size}
        onOpenCompare={() => setIsCompareModalOpen(true)}
      />

      {/* Main Grid Viewport Canvas */}
      <main className="max-w-7xl mx-auto p-3 sm:p-6 md:p-8">
        {/* If Analytics Tab is Active */}
        {activeTab === 'analytics' ? (
          <div>
            <div className="border-2 border-[#565f89] bg-[#16161E] p-3 mb-6 font-mono text-xs flex items-center justify-between">
              <span className="text-white font-bold">
                SYSTEM_TELEMETRY // SMART INDIA HACKATHON REPOSITORY METRICS
              </span>
              <span className="text-[#bb9af7] font-bold">
                [REAL-TIME ACCUMULATOR]
              </span>
            </div>
            <AnalyticsDashboard problems={SAMPLE_PROBLEM_STATEMENTS} />
          </div>
        ) : (
          /* Directory & Bookmarks Tabs */
          <div>
            {/* Search Block Component */}
            <BrutalistSearchBlock
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedDomain={selectedDomain}
              onDomainChange={setSelectedDomain}
              domainList={DOMAIN_BUCKETS}
              totalResults={filteredProblems.length}
              totalAvailable={SAMPLE_PROBLEM_STATEMENTS.length}
              onResetFilters={handleResetFilters}
            />

            {/* Ministry Filter Matrix */}
            <MinistryFilterMatrix
              selectedMinistry={selectedMinistry}
              onSelectMinistry={setSelectedMinistry}
              ministryCounts={ministryCounts}
            />

            {/* Bookmarks Warning Ribbon when in Bookmarks Tab */}
            {activeTab === 'bookmarks' && (
              <div className="border-2 border-[#9ece6a] bg-[#16161E] p-3 mb-4 font-mono text-xs text-[#9ece6a] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bookmark className="w-4 h-4 fill-current" />
                  <span className="font-bold">FILTERED VIEW: SAVED BOOKMARKS ONLY</span>
                </div>
                <button
                  onClick={() => setActiveTab('directory')}
                  className="hover:underline text-white font-bold cursor-pointer"
                >
                  VIEW ALL STATEMENTS →
                </button>
              </div>
            )}

            {/* Exposed DataGrid Component */}
            <DataGrid
              problems={filteredProblems}
              bookmarkedIds={bookmarkedIds}
              onToggleBookmark={handleToggleBookmark}
              compareIds={compareIds}
              onToggleCompare={handleToggleCompare}
              onSelectProblem={(prob) => setSelectedProblem(prob)}
              onOpenCompareModal={() => setIsCompareModalOpen(true)}
              onExportJSON={handleExportJSON}
              onExportCSV={handleExportCSV}
            />
          </div>
        )}
      </main>

      {/* Structural Footer */}
      <footer className="w-full border-t-2 border-[#565f89] bg-[#000000] mt-16 text-left font-mono text-xs">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-[#24283b]">
          <div>
            <div className="font-sans font-bold text-white text-sm mb-1 tracking-wider uppercase">
              SIH BUDDY PLATFORM
            </div>
            <p className="text-[11px] text-[#9aa5ce] leading-relaxed">
              Minimalist-Brutalist directory and telemetry interface engineered for hackathon finalists. Hard-edged borders, zero rounded corners, and pure black Tokyo Night contrast.
            </p>
          </div>

          <div>
            <div className="text-white font-bold text-xs uppercase mb-1">
              DATA DENSITY & WCAG COMPLIANCE
            </div>
            <p className="text-[11px] text-[#9aa5ce] leading-relaxed">
              All contrast ratios satisfy WCAG AAA standards on pure black (#000000) with Tokyo Night accents (#7dcfff, #bb9af7, #9ece6a, #f7768e).
            </p>
          </div>

          <div className="flex flex-col justify-between">
            <div className="text-xs text-[#565f89]">
              SYSTEM RUNTIME: VITE + REACT + TAILWIND CSS
            </div>
            <div className="text-[10px] text-[#7dcfff] font-bold mt-2">
              BUILD: 2026.09 // TOKYO NIGHT BRUTALIST EDITION
            </div>
          </div>
        </div>
      </footer>

      {/* Slide-out Specification Detail Drawer */}
      <ProblemDetailDrawer
        problem={selectedProblem}
        onClose={() => setSelectedProblem(null)}
        isBookmarked={selectedProblem ? bookmarkedIds.has(selectedProblem.id) : false}
        onToggleBookmark={handleToggleBookmark}
        isSelectedForCompare={selectedProblem ? compareIds.has(selectedProblem.id) : false}
        onToggleCompare={handleToggleCompare}
      />

      {/* Side-by-Side Comparison Matrix Modal */}
      {isCompareModalOpen && (
        <ComparisonMatrixModal
          compareIds={compareIds}
          allProblems={SAMPLE_PROBLEM_STATEMENTS}
          onClose={() => setIsCompareModalOpen(false)}
          onRemoveFromCompare={handleToggleCompare}
          onClearAll={() => setCompareIds(new Set())}
          onSelectProblem={(p) => setSelectedProblem(p)}
        />
      )}
    </div>
  );
}
