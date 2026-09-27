import React, { useState, useEffect, useCallback } from 'react';
import { NirmaanHeader } from '../components/NirmaanHeader';
import { useReviewerQueue, resolveReviewerItem } from '../operationsClient';
import { type MockReviewerItem } from '../mockData';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  Volume2,
  Play,
  Pause,
  Clock,
  Radio,
  User,
  ArrowRight,
  ShieldCheck,
  Sliders,
  ChevronDown,
  Check,
  X,
  Keyboard,
  Info,
} from 'lucide-react';

export function ReviewerQueuePage() {
  const { items, allItemsCount, pendingCount, refetch } = useReviewerQueue();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  const [progressDelta, setProgressDelta] = useState<number>(85);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const currentItem: MockReviewerItem | undefined = items[selectedIndex];

  // Sync active candidate when item changes
  useEffect(() => {
    if (currentItem) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveCandidateId(currentItem.topCandidate.id);
      setProgressDelta(currentItem.progressDeltaPercent || 85);
    }
  }, [currentItem]);

  // Handle Resolution Action
  const handleResolve = useCallback(
    async (resolution: 'APPROVED' | 'REASSIGNED' | 'DISMISSED') => {
      if (!currentItem) return;

      const candidateId = activeCandidateId || currentItem.topCandidate.id;
      try {
        await resolveReviewerItem({
          queueItemId: currentItem.id,
          resolution,
          finalActivityId: candidateId,
          progressDeltaPercent: progressDelta,
        });

        setFeedbackMessage(
          resolution === 'APPROVED'
            ? `✓ Approved "${currentItem.topCandidate.activityCode}" at ${progressDelta}% progress`
            : resolution === 'REASSIGNED'
            ? `✓ Reassigned to candidate "${candidateId}"`
            : `✓ Discrepancy dismissed`
        );
        setTimeout(() => setFeedbackMessage(null), 3000);

        refetch();
        if (selectedIndex >= items.length - 1) {
          setSelectedIndex(Math.max(0, items.length - 2));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        alert('Resolution failed: ' + msg);
      }
    },
    [currentItem, activeCandidateId, progressDelta, selectedIndex, items.length, refetch]
  );

  // Global Keyboard Shortcuts (A, R, D, ArrowUp, ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is in input or textarea
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (e.target as HTMLElement)?.tagName || ''
        )
      ) {
        return;
      }

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleResolve('APPROVED');
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleResolve('REASSIGNED');
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleResolve('DISMISSED');
      } else if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(items.length - 1, prev + 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResolve, items.length]);

  return (
    <div className="min-h-screen bg-background">
      <NirmaanHeader currentTab="queue" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header & Keyboard Hotkeys Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Human-in-the-Loop Semantic Verification Queue
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {pendingCount} Pending Triage
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Field voice & form actuals mapped against Primavera P6 activities via pgvector cosine similarity.
            </p>
          </div>

          {/* Hotkey Guide */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card/60 text-xs text-muted-foreground shadow-2xs">
            <Keyboard className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">Hotkeys:</span>
            <div className="flex items-center gap-1.5 font-mono">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground font-bold">
                A
              </kbd>
              <span>Approve</span>
              <span className="text-muted-foreground/40">|</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground font-bold">
                R
              </kbd>
              <span>Reassign</span>
              <span className="text-muted-foreground/40">|</span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground font-bold">
                D
              </kbd>
              <span>Dismiss</span>
            </div>
          </div>
        </div>

        {/* Temporary Toast Banner */}
        {feedbackMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150">
            <span>{feedbackMessage}</span>
            <Check className="w-4 h-4 text-emerald-600" />
          </div>
        )}

        {items.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              Reviewer Queue Fully Cleared!
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              All field supervisor actuals have been reconciled and linked directly to Primavera P6 baseline activities.
            </p>
            <div className="pt-2">
              <a
                href="/field-log"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 shadow-sm"
              >
                Open Field Supervisor Logger &rarr;
              </a>
            </div>
          </div>
        ) : (
          /* Dual-Panel Verification Interface */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Queue Selector & Ground-Truth Field Note (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Queue Navigation List */}
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-1">
                <span>Verification Items ({items.length})</span>
                <span className="font-mono">Item {selectedIndex + 1} of {items.length}</span>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => {
                  const isCur = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedIndex(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isCur
                          ? 'border-primary bg-primary/5 shadow-xs'
                          : 'border-border bg-card/60 hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-primary">
                          {item.fieldEvent.deviceId}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-mono text-muted-foreground">
                          Seq #{item.fieldEvent.monotonicSeq}
                        </span>
                      </div>
                      <p className="text-xs text-foreground font-medium mt-1.5 line-clamp-2">
                        "{item.fieldEvent.rawText}"
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2">
                        <span>{item.fieldEvent.supervisor.username}</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {(item.candidateSimilarityScore * 100).toFixed(1)}% Match
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Ground-Truth Detail Card */}
              {currentItem && (
                <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Ground-Truth Field Note
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {currentItem.fieldEvent.sourceType}
                    </span>
                  </div>

                  {/* Hardware & Supervisor Meta */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-muted/40 p-3 rounded-xl border border-border/50">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Supervisor:</span>
                      <span className="font-semibold text-foreground">
                        {currentItem.fieldEvent.supervisor.username}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Device ID:</span>
                      <span className="font-semibold text-foreground">
                        {currentItem.fieldEvent.deviceId}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Hardware Clock:</span>
                      <span className="text-foreground">
                        {new Date(currentItem.fieldEvent.eventTimestampHw).toLocaleTimeString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Monotonic Seq:</span>
                      <span className="font-bold text-primary">
                        #{currentItem.fieldEvent.monotonicSeq}
                      </span>
                    </div>
                  </div>

                  {/* Audio Player Simulation if VOICE */}
                  {currentItem.fieldEvent.sourceType === 'MOBILE_VOICE' && (
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-primary flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4" />
                          Voice Recording (0:14s)
                        </span>
                        <button
                          onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                          className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-1 cursor-pointer hover:opacity-90"
                        >
                          {isPlayingAudio ? (
                            <>
                              <Pause className="w-3.5 h-3.5" /> Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" /> Play Voice
                            </>
                          )}
                        </button>
                      </div>

                      {/* Animated Audio Waveform */}
                      <div className="flex items-center gap-1 h-6 px-1">
                        {Array.from({ length: 24 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 rounded-full bg-primary/70 transition-all ${
                              isPlayingAudio ? 'animate-pulse' : 'opacity-40'
                            }`}
                            style={{
                              height: `${Math.max(4, ((i * 7) % 20) + 4)}px`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw Transcript Quote */}
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80 text-xs italic text-foreground leading-relaxed">
                    "{currentItem.fieldEvent.rawText}"
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Top Candidate & Alternate Candidates & Triage Bar (7 Cols) */}
            {currentItem && (
              <div className="lg:col-span-7 space-y-5">
                <div className="p-6 rounded-2xl border border-primary/30 bg-card shadow-md space-y-6">
                  {/* Top Candidate Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        AI Recommended Top Match
                      </span>
                      <h3 className="text-lg font-bold text-foreground mt-1">
                        {currentItem.topCandidate.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs font-bold text-primary">
                          {currentItem.topCandidate.activityCode}
                        </span>
                        <span className="text-muted-foreground/60">&bull;</span>
                        <span className="text-xs text-muted-foreground">
                          {currentItem.topCandidate.wbsPath}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {(currentItem.candidateSimilarityScore * 100).toFixed(1)}% Cosine Match
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                        Tier 2 Semantic Match
                      </div>
                    </div>
                  </div>

                  {/* Match Rationale */}
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1">
                    <span className="font-bold text-foreground uppercase text-[10px] tracking-wide flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-primary" />
                      Vector Embedding Match Rationale:
                    </span>
                    <p className="text-muted-foreground leading-relaxed">
                      {currentItem.matchRationale}
                    </p>
                  </div>

                  {/* Progress Delta Adjuster */}
                  <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-primary" />
                        Verified Activity Completion Delta
                      </label>
                      <span className="font-mono text-sm font-extrabold text-primary">
                        {progressDelta}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={progressDelta}
                      onChange={(e) => setProgressDelta(Number(e.target.value))}
                      className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                    />

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                      <span>Baseline Prior: {currentItem.topCandidate.percentComplete}%</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        Delta: +{Math.max(0, progressDelta - currentItem.topCandidate.percentComplete)}%
                      </span>
                      <span>Target: 100%</span>
                    </div>
                  </div>

                  {/* Alternate Candidates Selection */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wide text-[10px]">
                      Or Reassign to Alternate Candidate:
                    </span>
                    <div className="space-y-2">
                      {currentItem.alternateCandidates.map((alt) => {
                        const isChosen = activeCandidateId === alt.activityId;
                        return (
                          <div
                            key={alt.activityId}
                            onClick={() => setActiveCandidateId(alt.activityId)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isChosen
                                ? 'border-primary bg-primary/5 shadow-2xs'
                                : 'border-border bg-muted/20 hover:bg-muted/50'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-foreground">
                                  {alt.code}
                                </span>
                                <span className="text-xs font-medium text-foreground">
                                  {alt.name}
                                </span>
                              </div>
                            </div>
                            <span className="font-mono text-xs font-semibold text-muted-foreground">
                              {(alt.score * 100).toFixed(0)}% Score
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Triage Decision Action Buttons */}
                  <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center gap-3">
                    {/* Approve Top Candidate */}
                    <button
                      onClick={() => handleResolve('APPROVED')}
                      className="w-full sm:w-auto grow inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve Top Match (A)
                    </button>

                    {/* Reassign Candidate */}
                    <button
                      onClick={() => handleResolve('REASSIGNED')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reassign Candidate (R)
                    </button>

                    {/* Dismiss */}
                    <button
                      onClick={() => handleResolve('DISMISSED')}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 font-semibold text-xs transition-all cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      Dismiss (D)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
