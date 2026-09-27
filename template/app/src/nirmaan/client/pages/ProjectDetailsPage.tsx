import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router';
import { NirmaanHeader } from '../components/NirmaanHeader';
import {
  useProjectDetails,
  triggerCPMRecalculation,
  exportPrimaveraXER,
} from '../operationsClient';
import { type MockActivity } from '../mockData';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Download,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  ShieldAlert,
  GitBranch,
  Layers,
} from 'lucide-react';

export function ProjectDetailsPage(props: any) {
  const routerParams = useParams<{ projectId: string }>();
  const projectId =
    routerParams.projectId ||
    props?.match?.params?.projectId ||
    props?.params?.projectId ||
    'proj-oil-assam-01';

  const { project, activities, predictions, refetch } = useProjectDetails(projectId);

  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [showCriticalOnly, setShowCriticalOnly] = useState<boolean>(false);
  const [selectedActivity, setSelectedActivity] = useState<MockActivity | null>(null);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Filter activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchDiscipline =
        selectedDiscipline === 'ALL' || act.discipline === selectedDiscipline;
      const matchCritical = !showCriticalOnly || act.isCriticalPath;
      return matchDiscipline && matchCritical;
    });
  }, [activities, selectedDiscipline, showCriticalOnly]);

  // Project delay prediction summary
  const prediction = predictions[0];

  // Handle Recalculate CPM
  const handleRecalculateCPM = async () => {
    if (!project) return;
    setIsRecalculating(true);
    try {
      await triggerCPMRecalculation({ projectId: project.id });
      refetch();
    } catch (err: any) {
      alert('Error calculating CPM: ' + (err.message || 'Unknown error'));
    } finally {
      setIsRecalculating(false);
    }
  };

  // Handle Export Primavera P6 .XER
  const handleExportXER = async () => {
    if (!project) return;
    setIsExporting(true);
    try {
      const res = await exportPrimaveraXER({ projectId: project.id });
      // Trigger native browser download
      const blob = new Blob([res.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', res.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Error exporting .XER: ' + (err.message || 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  // Gantt chart time range (compute min start and max finish)
  const timeRange = useMemo(() => {
    if (!activities.length) {
      return { start: new Date('2026-01-01'), end: new Date('2026-12-31'), totalDays: 365 };
    }
    const starts = activities.map((a) => new Date(a.plannedStart).getTime());
    const finishes = activities.map((a) => new Date(a.plannedFinish).getTime());
    const minStart = new Date(Math.min(...starts));
    const maxFinish = new Date(Math.max(...finishes));
    const totalDays = Math.max(1, (maxFinish.getTime() - minStart.getTime()) / (1000 * 3600 * 24));
    return { start: minStart, end: maxFinish, totalDays };
  }, [activities]);

  const months = useMemo(() => {
    return [
      'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026',
      'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026',
      'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026'
    ];
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <NirmaanHeader currentTab="details" projectId={projectId} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Back Button & Project Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
          <div>
            <a
              href="/projects"
              className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Projects Portfolio
            </a>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {project?.name || 'Assam Pipeline Capital Project'}
              </h2>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-primary/10 text-primary font-bold border border-primary/20">
                {project?.code || 'OIL-ASSAM-PL-2026'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
              {project?.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRecalculateCPM}
              disabled={isRecalculating}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
              Recalculate CPM Float
            </button>
            <button
              onClick={handleExportXER}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-95 transition-all cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Export Verified Actuals (.XER)
            </button>
          </div>
        </div>

        {/* Milestone & Delay Prediction Banner */}
        {prediction && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                      Predictive Delay Warning
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">
                      +{prediction.criticalPathSlipDays.toFixed(1)} Days Delay
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mt-0.5">
                    Critical Milestone Breach: {prediction.affectedMilestoneName}
                  </h3>
                </div>
              </div>

              <div className="text-xs text-muted-foreground font-mono">
                Predicted Finish:{' '}
                <span className="font-bold text-foreground">
                  {new Date(prediction.predictedMilestoneDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Root Cause Analysis */}
            <div className="text-xs space-y-1">
              <span className="font-semibold text-foreground uppercase tracking-wide text-[11px]">
                Primary Root Cause (Causal Event Ingestion):
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {prediction.primaryRootCause}
              </p>
            </div>

            {/* AI Mitigation Recommendations */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                <Sparkles className="w-4 h-4" />
                <span>AI Recommended Recovery Schedule Actions</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {prediction.mitigationRecommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-border bg-card/80 text-xs space-y-1.5 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        Recover: +{rec.recoveredDays} Days
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {rec.costImpact}
                      </span>
                    </div>
                    <p className="text-foreground font-medium leading-snug">{rec.strategy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls for Gantt */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card/40">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Discipline:
            </span>
            {['ALL', 'Piping', 'Civil', 'Electrical', 'Instrumentation'].map((disc) => (
              <button
                key={disc}
                onClick={() => setSelectedDiscipline(disc)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedDiscipline === disc
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {disc === 'ALL' ? 'All Disciplines' : disc}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={showCriticalOnly}
                onChange={(e) => setShowCriticalOnly(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary/40"
              />
              <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
                Critical Path Only (0 Float)
              </span>
            </label>
          </div>
        </div>

        {/* Interactive Gantt Chart & Schedule View */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Gantt Header Timeline Bar */}
          <div className="border-b border-border bg-muted/60 p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
              <span>Primavera P6 WBS & Activities ({filteredActivities.length})</span>
              <span>2026 Construction Schedule Timeline</span>
            </div>
            {/* Timeline Month Markers */}
            <div className="grid grid-cols-12 text-[10px] font-mono text-muted-foreground border-t border-border/40 pt-2 text-center">
              {months.map((m, idx) => (
                <div key={idx} className="border-r border-border/20 last:border-r-0">
                  {m.slice(0, 3)}
                </div>
              ))}
            </div>
          </div>

          {/* Activity Rows with Gantt Bars */}
          <div className="divide-y divide-border/60 max-h-[600px] overflow-y-auto">
            {filteredActivities.map((act) => {
              const startDay =
                (new Date(act.plannedStart).getTime() - timeRange.start.getTime()) /
                (1000 * 3600 * 24);
              const durationDays = act.plannedDurationDays;
              const leftPercent = Math.max(0, Math.min(100, (startDay / timeRange.totalDays) * 100));
              const widthPercent = Math.max(
                3,
                Math.min(100 - leftPercent, (durationDays / timeRange.totalDays) * 100)
              );

              const isSelected = selectedActivity?.id === act.id;

              return (
                <div
                  key={act.id}
                  onClick={() => setSelectedActivity(act)}
                  className={`p-3.5 hover:bg-muted/30 transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center gap-4 ${
                    isSelected ? 'bg-primary/5 ring-1 ring-primary/40' : ''
                  }`}
                >
                  {/* Left Metadata Column */}
                  <div className="w-full lg:w-96 shrink-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {act.activityCode}
                      </span>
                      {act.isCriticalPath ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                          Critical (0d Float)
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted text-muted-foreground">
                          Float: {act.totalFloatDays}d
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary text-secondary-foreground font-medium">
                        {act.discipline}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-foreground truncate">{act.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{act.wbsPath}</div>
                  </div>

                  {/* Right Gantt Visual Bar */}
                  <div className="grow relative py-2 min-h-[36px] flex items-center">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 grid grid-cols-12 pointer-events-none opacity-20">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="border-r border-border h-full" />
                      ))}
                    </div>

                    {/* Timeline Bar */}
                    <div
                      className="absolute h-6 rounded-md overflow-hidden shadow-xs transition-all flex items-center px-2 text-[10px] font-mono font-bold"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        backgroundColor: act.isCriticalPath
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(59, 130, 246, 0.15)',
                        border: act.isCriticalPath
                          ? '1px solid rgba(239, 68, 68, 0.8)'
                          : '1px solid rgba(59, 130, 246, 0.4)',
                      }}
                    >
                      {/* Actual Progress Fill */}
                      <div
                        className="absolute left-0 top-0 bottom-0 transition-all"
                        style={{
                          width: `${act.percentComplete}%`,
                          backgroundColor: act.isCriticalPath
                            ? 'rgb(220, 38, 38)'
                            : 'rgb(37, 99, 235)',
                        }}
                      />
                      <span className="relative z-10 text-white font-bold drop-shadow-xs">
                        {act.percentComplete}%
                      </span>
                    </div>
                  </div>

                  {/* Dates Summary */}
                  <div className="text-right text-[11px] font-mono text-muted-foreground shrink-0 w-32 hidden sm:block">
                    <div>{new Date(act.plannedStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                    <div className="text-foreground font-medium">
                      &rarr; {new Date(act.plannedFinish).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Activity Inspector */}
        {selectedActivity && (
          <div className="p-5 rounded-2xl border border-primary/30 bg-card shadow-md space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  Activity Detail & Dependency Network: {selectedActivity.activityCode}
                </h4>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold"
              >
                Close Inspector &times;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                <span className="text-muted-foreground uppercase tracking-wide text-[10px] font-bold">
                  Activity Name
                </span>
                <p className="font-semibold text-foreground">{selectedActivity.name}</p>
                <p className="text-[11px] text-muted-foreground">{selectedActivity.wbsPath}</p>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 space-y-1 font-mono">
                <span className="text-muted-foreground uppercase tracking-wide text-[10px] font-bold">
                  Duration & Floats
                </span>
                <div>Planned Duration: <span className="font-bold text-foreground">{selectedActivity.plannedDurationDays} Days</span></div>
                <div>Total Float: <span className="font-bold text-foreground">{selectedActivity.totalFloatDays}d</span></div>
                <div>Free Float: <span className="font-bold text-foreground">{selectedActivity.freeFloatDays}d</span></div>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 space-y-1 font-mono">
                <span className="text-muted-foreground uppercase tracking-wide text-[10px] font-bold">
                  Verified Actual Progress
                </span>
                <div className="text-xl font-extrabold text-primary">
                  {selectedActivity.percentComplete}%
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Actual Start: {selectedActivity.actualStart ? new Date(selectedActivity.actualStart).toLocaleDateString() : 'Pending'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                <span className="text-muted-foreground uppercase tracking-wide text-[10px] font-bold">
                  Critical Path Status
                </span>
                <div>
                  {selectedActivity.isCriticalPath ? (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                      Critical Path Element
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Non-Critical Float Buffering
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  Predecessors: {selectedActivity.predecessorCodes?.join(', ') || 'None (Project Start)'}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
