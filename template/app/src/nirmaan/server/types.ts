// ponytail: Minimal shared domain interfaces matching schema.prisma and in-process TS engines
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';
export type MatchStatus = 'AUTO_MATCHED' | 'PENDING_REVIEW' | 'UNMATCHED';

export interface ParsedProject {
  code: string;
  name: string;
  plannedStartDate: Date;
  plannedFinishDate: Date;
}

export interface ParsedWBS {
  wbsId: string;
  parentWbsId?: string;
  name: string;
  fullPath: string;
}

export interface ParsedActivity {
  activityCode: string;
  name: string;
  wbsPath: string;
  discipline: string;
  plannedDurationDays: number;
  plannedStart: Date;
  plannedFinish: Date;
  percentComplete?: number;
  wbsId?: string;
  taskId?: string;
}

export interface ParsedDependency {
  predecessorId: string; // task_id or activityCode
  successorId: string;   // task_id or activityCode
  dependencyType: DependencyType;
  lagDays: number;
}

export interface ParsedSchedule {
  project: ParsedProject;
  wbs: ParsedWBS[];
  activities: ParsedActivity[];
  dependencies: ParsedDependency[];
}

export interface CPMActivityInput {
  id: string;
  name: string;
  durationDays: number;
  baselineStart: Date;
  baselineFinish: Date;
  actualStart?: Date | null;
  actualFinish?: Date | null;
  percentComplete?: number;
  discipline?: string;
  wbsPath?: string;
}

export interface CPMDependencyInput {
  predecessorId: string;
  successorId: string;
  dependencyType?: DependencyType;
  lagDays?: number;
}

export interface CPMCalculatedActivity {
  id: string;
  name: string;
  durationDays: number;
  remainingDurationDays: number;
  earlyStartDay: number;
  earlyFinishDay: number;
  lateStartDay: number;
  lateFinishDay: number;
  totalFloatDays: number;
  freeFloatDays: number;
  isCriticalPath: boolean;
  earlyStartDate: Date;
  earlyFinishDate: Date;
  lateStartDate: Date;
  lateFinishDate: Date;
  percentComplete: number;
}

export interface CPMScheduleResult {
  activities: Map<string, CPMCalculatedActivity>;
  criticalPath: string[]; // Activity IDs
  projectPlannedFinish: Date;
  projectForecastFinish: Date;
  criticalPathSlipDays: number;
  delayedMilestones: Array<{
    activityId: string;
    name: string;
    baselineFinish: Date;
    forecastFinish: Date;
    slipDays: number;
  }>;
  mitigationRecommendations: Array<{
    criticalActivityId: string;
    criticalActivityName: string;
    slipDays: number;
    recommendedSourceActivityId?: string;
    recommendedSourceActivityName?: string;
    availableFloatDays?: number;
    strategy: string;
    recoveredDays: number;
  }>;
}

export interface SemanticCandidate {
  id: string;
  activityCode: string;
  name: string;
  wbsPath: string;
  discipline: string;
  percentComplete?: number;
}

export interface MatchScoreResult {
  candidate: SemanticCandidate;
  score: number;
}

export interface SemanticMatchOutput {
  status: MatchStatus;
  confidenceScore: number;
  topCandidate?: SemanticCandidate;
  alternateCandidates: MatchScoreResult[];
  matchRationale: string;
}

export interface RawFieldEventInput {
  clientEventId: string;
  deviceId: string;
  supervisorId: string;
  sourceType: 'MOBILE_VOICE' | 'MOBILE_FORM' | 'EXCEL_DPR';
  rawText: string;
  audioRecordingUrl?: string | null;
  eventTimestampHw: Date | string;
  monotonicSeq: number | bigint | string;
}

export interface ReconciledEvent extends RawFieldEventInput {
  reconciledCausalOrder: bigint;
  syncReceivedAt: Date;
  isClockTampered?: boolean;
}
