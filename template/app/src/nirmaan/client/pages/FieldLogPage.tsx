import React, { useState, useEffect } from 'react';
import { NirmaanHeader } from '../components/NirmaanHeader';
import { syncFieldEventsBatch } from '../operationsClient';
import {
  Mic,
  MicOff,
  Wifi,
  WifiOff,
  Send,
  Plus,
  Clock,
  Sparkles,
  HardHat,
  CheckCircle2,
  Trash2,
  Radio,
  FileText,
  RefreshCw,
} from 'lucide-react';

interface LocalOutboxEvent {
  clientEventId: string;
  deviceId: string;
  sourceType: 'MOBILE_VOICE' | 'MOBILE_FORM' | 'EXCEL_DPR';
  discipline: string;
  rawText: string;
  quantityMeters: number;
  eventTimestampHw: string;
  monotonicSeq: number;
  status: 'PENDING_LOCAL' | 'SYNCED';
}

const LOCAL_STORAGE_OUTBOX_KEY = 'nirmaan_field_outbox';

const SAMPLE_VOICE_TEMPLATES = [
  'Completed 120m trenching near Duliajan Valve Station. Dense rocky soil encountered.',
  'Fit-up and root pass completed for 6 pipe joints at Dihing River crossing Km 14.',
  'Hydrostatic pressure testing passed for Section 2 at 100 bar for 4 hours.',
  'Applied 3-layer PE field joint coating on 18 mainline joints between Km 32-35.',
];

export function FieldLogPage() {
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [discipline, setDiscipline] = useState<'Piping' | 'Civil' | 'Electrical' | 'Instrumentation'>('Piping');
  const [quantity, setQuantity] = useState<number>(25);
  const [noteText, setNoteText] = useState<string>('');

  // Monotonic sequence simulation
  const [currentSeq, setCurrentSeq] = useState<number>(1043);
  const deviceId = 'OIL-FIELD-RUGGED-09';

  // Local outbox list
  const [outbox, setOutbox] = useState<LocalOutboxEvent[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_OUTBOX_KEY);
      return raw
        ? JSON.parse(raw)
        : [
            {
              clientEventId: 'cl-evt-demo-1',
              deviceId: 'OIL-FIELD-RUGGED-09',
              sourceType: 'MOBILE_VOICE',
              discipline: 'Piping',
              rawText: 'Section 4 pipe bending completed 50 meters near Km 38.',
              quantityMeters: 50,
              eventTimestampHw: new Date(Date.now() - 3600 * 1000).toISOString(),
              monotonicSeq: 1041,
              status: 'PENDING_LOCAL',
            },
            {
              clientEventId: 'cl-evt-demo-2',
              deviceId: 'OIL-FIELD-RUGGED-09',
              sourceType: 'MOBILE_FORM',
              discipline: 'Civil',
              rawText: 'Excavated 80m trench bedding with sand padding at crossing.',
              quantityMeters: 80,
              eventTimestampHw: new Date(Date.now() - 1800 * 1000).toISOString(),
              monotonicSeq: 1042,
              status: 'PENDING_LOCAL',
            },
          ];
    } catch {
      return [];
    }
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Save outbox to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_OUTBOX_KEY, JSON.stringify(outbox));
    } catch {
      // Ignore localStorage write error
    }
  }, [outbox]);

  // Voice recording timer simulation
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Handle Recording Toggle
  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingSeconds(0);
    } else {
      setIsRecording(false);
      // Auto-transcribe sample text
      const randomSample =
        SAMPLE_VOICE_TEMPLATES[Math.floor(Math.random() * SAMPLE_VOICE_TEMPLATES.length)];
      setNoteText(randomSample);
    }
  };

  // Add Event to Outbox
  const handleAddToOutbox = () => {
    if (!noteText.trim()) {
      alert('Please enter a note or record voice first.');
      return;
    }

    const nextSeq = currentSeq + 1;
    setCurrentSeq(nextSeq);

    const newEvent: LocalOutboxEvent = {
      clientEventId: `cl-evt-${Date.now()}`,
      deviceId,
      sourceType: isRecording ? 'MOBILE_VOICE' : 'MOBILE_FORM',
      discipline,
      rawText: `${noteText} [Progress: +${quantity}m / joints]`,
      quantityMeters: quantity,
      eventTimestampHw: new Date().toISOString(),
      monotonicSeq: nextSeq,
      status: 'PENDING_LOCAL',
    };

    setOutbox((prev) => [newEvent, ...prev]);
    setNoteText('');
  };

  // Sync Outbox Batch
  const handleSyncOutbox = async () => {
    const pendingEvents = outbox.filter((e) => e.status === 'PENDING_LOCAL');
    if (pendingEvents.length === 0) {
      alert('Outbox is empty or all items are already synced.');
      return;
    }

    if (isOfflineMode) {
      alert('Device is currently in simulated Offline Mode. Toggle to Online to sync with central server.');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await syncFieldEventsBatch({
        projectId: 'proj-oil-assam-01',
        events: pendingEvents.map((e) => ({
          clientEventId: e.clientEventId,
          deviceId: e.deviceId,
          supervisorId: 'user-field-supervisor',
          sourceType: e.sourceType,
          rawText: e.rawText,
          eventTimestampHw: e.eventTimestampHw,
          monotonicSeq: e.monotonicSeq,
        })),
      });

      // Mark local items as synced
      setOutbox((prev) =>
        prev.map((item) => ({ ...item, status: 'SYNCED' as const }))
      );

      setSyncFeedback(
        `✓ Batch Synced: ${res.reconciledCount} causal events reconciled! (${res.pendingReviewCount} routed to Reviewer Queue)`
      );
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err: any) {
      alert('Sync failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const pendingCount = outbox.filter((e) => e.status === 'PENDING_LOCAL').length;

  return (
    <div className="min-h-screen bg-background pb-12">
      <NirmaanHeader currentTab="field-log" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Offline / Online Simulated Network Ribbon */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card/60 shadow-xs">
          <div className="flex items-center gap-3">
            {isOfflineMode ? (
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <WifiOff className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Wifi className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-foreground flex items-center gap-2">
                {isOfflineMode ? (
                  <span className="text-amber-600 dark:text-amber-400">
                    Offline Mode Active (Remote Jungle / RoW Site)
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Online & Connected to Oil India Gateway
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Hardware Clock Monotonic Sorter: <span className="font-mono font-bold text-foreground">Seq #{currentSeq}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isOfflineMode
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {isOfflineMode ? 'Switch to Online' : 'Simulate Offline'}
          </button>
        </div>

        {/* Sync Success Feedback */}
        {syncFeedback && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-150">
            <span>{syncFeedback}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        )}

        {/* Rugged Touch Input Terminal */}
        <div className="rounded-3xl border border-border bg-card shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <HardHat className="w-5 h-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">
                Supervisor Voice & Progress Outbox Logger
              </h2>
            </div>
            <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground font-semibold">
              {deviceId}
            </span>
          </div>

          {/* Large Tactile Microphone Button */}
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <button
              onClick={toggleRecording}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer ${
                isRecording
                  ? 'bg-red-600 text-white ring-8 ring-red-600/30 scale-105 animate-pulse'
                  : 'bg-gradient-to-br from-primary to-orange-600 text-white hover:scale-105 active:scale-95 shadow-orange-500/25'
              }`}
            >
              {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
            </button>

            <div className="text-center">
              <div className="text-sm font-bold text-foreground">
                {isRecording ? (
                  <span className="text-red-600 dark:text-red-400 font-mono">
                    Recording Audio... {recordingSeconds}s
                  </span>
                ) : (
                  'Tap to Record Field Note Voice'
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRecording
                  ? 'Tap again to finish and auto-transcribe'
                  : 'Speech-to-text with local Assam pipeline acoustic vocabulary'}
              </p>
            </div>
          </div>

          {/* Discipline Selector Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wide text-[10px]">
              Discipline Sector:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Piping', 'Civil', 'Electrical', 'Instrumentation'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDiscipline(d)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    discipline === d
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Increments (+5, +10, +25, +50) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wide text-[10px]">
              Quantity Increment:
            </label>
            <div className="flex items-center gap-2 overflow-x-auto">
              {[5, 10, 25, 50, 100].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => setQuantity(inc)}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    quantity === inc
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  +{inc}m / units
                </button>
              ))}
            </div>
          </div>

          {/* Text Area Note */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wide text-[10px]">
              Field Observation / Speech Transcript:
            </label>
            <textarea
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. 16-inch pipe stringing completed near Valve Station 3. 3 cold bends inspected and passed."
              className="w-full p-3.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
            />
          </div>

          {/* Quick Voice Prompt Presets */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Quick Voice Presets:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAMPLE_VOICE_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNoteText(tmpl)}
                  className="text-left p-2.5 rounded-lg border border-border/60 bg-muted/20 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all cursor-pointer truncate"
                >
                  &ldquo;{tmpl}&rdquo;
                </button>
              ))}
            </div>
          </div>

          {/* Queue Button */}
          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="button"
              onClick={handleAddToOutbox}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/20 hover:opacity-95 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Record to Hardware Outbox
            </button>
          </div>
        </div>

        {/* Local Outbox Queue Table */}
        <div className="rounded-3xl border border-border bg-card shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>Hardware Local Outbox Queue</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary">
                  {pendingCount} Pending Local
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Locally buffered events with hardware monotonic ordering.
              </p>
            </div>

            <button
              onClick={handleSyncOutbox}
              disabled={isSyncing || pendingCount === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 shadow-md shadow-primary/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync Outbox Batch ({pendingCount})
            </button>
          </div>

          {outbox.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No items in outbox queue.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {outbox.map((item) => (
                <div
                  key={item.clientEventId}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-primary">Seq #{item.monotonicSeq}</span>
                      <span className="text-muted-foreground">&bull;</span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(item.eventTimestampHw).toLocaleTimeString()}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-muted text-[10px] font-semibold text-muted-foreground">
                        {item.discipline}
                      </span>
                    </div>
                    <p className="text-foreground font-medium">{item.rawText}</p>
                  </div>

                  <div>
                    {item.status === 'SYNCED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Reconciled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        Queued in Outbox
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
