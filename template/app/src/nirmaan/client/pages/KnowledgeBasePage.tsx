import React, { useState, useMemo } from 'react';
import { NirmaanHeader } from '../components/NirmaanHeader';
import { useHistoricalBenchmarks } from '../operationsClient';
import {
  Database,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Layers,
  Sparkles,
  CloudRain,
  Building2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export function KnowledgeBasePage() {
  const [disciplineFilter, setDisciplineFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const { benchmarks } = useHistoricalBenchmarks(disciplineFilter);

  // Filter benchmarks by search
  const filteredBenchmarks = useMemo(() => {
    return benchmarks.filter((b) => {
      const matchSearch =
        b.historicalProjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.workType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.recordedDelays.some((d) => d.cause.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    });
  }, [benchmarks, searchTerm]);

  // Aggregate KPI stats
  const totalClosedProjects = 18;
  const avgVariance = 12.8;
  const monsoonImpactFactor = 22.4;

  return (
    <div className="min-h-screen bg-background pb-12">
      <NirmaanHeader currentTab="knowledge-base" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title Header */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Closed-Project Historical Benchmarks
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-primary/10 text-primary border border-primary/20">
              18 OIL Capital Projects
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Empirical duration variance, monsoon seasonal delays, and contractor performance benchmarks from past Oil India trunkline executions.
          </p>
        </div>

        {/* Discipline Variance Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="p-5 rounded-2xl border border-border bg-card/60 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Benchmarked Assets
              </span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-foreground">{totalClosedProjects}</div>
            <p className="text-xs text-muted-foreground">
              Closed pipelines & refineries across Upper Assam & Bihar
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-2xl border border-border bg-card/60 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Average Schedule Slip
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              +{avgVariance}%
            </div>
            <p className="text-xs text-muted-foreground">
              Mean empirical baseline extension across all disciplines
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-2xl border border-border bg-card/60 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Assam Monsoon Penalty
              </span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                <CloudRain className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
              +{monsoonImpactFactor}%
            </div>
            <p className="text-xs text-muted-foreground">
              Historical variance multiplier during June–September
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-2xl border border-border bg-card/60 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Primary Delay Driver
              </span>
              <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-bold text-foreground truncate">
              RoW Land Clearance
            </div>
            <p className="text-xs text-muted-foreground">
              Accounts for 41.2% of all recorded critical path slips
            </p>
          </div>
        </div>

        {/* Delay Cause Distribution Bar */}
        <div className="p-6 rounded-2xl border border-border bg-card/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Historical Delay Cause Distribution Breakdown
            </h3>
            <span className="text-xs text-muted-foreground font-mono">Normalized n=142 Incidents</span>
          </div>

          <div className="space-y-3">
            {/* Cause 1 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground">Right of Way (RoW) & Forest Land Statutory Clearance</span>
                <span className="font-mono text-muted-foreground">41.2%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '41.2%' }} />
              </div>
            </div>

            {/* Cause 2 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground">Brahmaputra Tributary Monsoon Flash Flooding & Scour</span>
                <span className="font-mono text-muted-foreground">28.5%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '28.5%' }} />
              </div>
            </div>

            {/* Cause 3 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground">Special Valve & High-Pressure Compressor Vendor Supply</span>
                <span className="font-mono text-muted-foreground">17.8%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '17.8%' }} />
              </div>
            </div>

            {/* Cause 4 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-foreground">Qualified Orbital Welder & NDT Inspector Shortage</span>
                <span className="font-mono text-muted-foreground">12.5%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '12.5%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card/40">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search historical projects, work types, or delay drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Discipline:</span>
            {['ALL', 'Piping', 'Civil', 'Electrical', 'Instrumentation'].map((disc) => (
              <button
                key={disc}
                onClick={() => setDisciplineFilter(disc)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  disciplineFilter === disc
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {disc === 'ALL' ? 'All' : disc}
              </button>
            ))}
          </div>
        </div>

        {/* Benchmarks Grid / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBenchmarks.map((bm) => (
            <div
              key={bm.id}
              className="p-5 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/40 transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary">
                  {bm.historicalProjectCode}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-secondary-foreground">
                  {bm.discipline}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-foreground">{bm.workType}</h4>
              </div>

              {/* Planned vs Actual Duration */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-muted/40 p-3 rounded-xl border border-border/60">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Planned:</span>
                  <span className="font-bold text-foreground">{bm.plannedDurationDays} Days</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Actual:</span>
                  <span className="font-bold text-foreground">{bm.actualDurationDays} Days</span>
                </div>
              </div>

              {/* Variance Badge */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">Historical Variance:</span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                    bm.variancePercentage > 15
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                      : bm.variancePercentage > 0
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {bm.variancePercentage > 0 ? `+${bm.variancePercentage}%` : `${bm.variancePercentage}%`}
                </span>
              </div>

              {/* Recorded Delays */}
              <div className="space-y-1.5 pt-2 border-t border-border/60">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                  Recorded Delay Incidents:
                </span>
                <div className="space-y-1">
                  {bm.recordedDelays.map((del, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-muted-foreground flex items-start justify-between gap-2"
                    >
                      <span className="leading-tight">&bull; {del.cause}</span>
                      {del.days > 0 && (
                        <span className="font-mono text-red-600 dark:text-red-400 font-bold shrink-0">
                          +{del.days}d
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
