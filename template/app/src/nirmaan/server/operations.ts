// ponytail: Lean server operations bridging in-process engines directly to Prisma.
import { parsePrimaveraXER, parseMSProjectXML } from './parsers/xerParser';
import { generatePrimaveraXER } from './parsers/xerExporter';
import { calculateCPM } from './cpm/cpmEngine';
import { processFieldEventsBatch } from './sync/causalSync';
import { formatActivityEmbeddingText } from './matching/semanticMatcher';
import type {
  CPMActivityInput,
  CPMDependencyInput,
  RawFieldEventInput,
  SemanticCandidate,
} from './types';

// ponytail: Native input interfaces with zero external dependency overhead
export interface UploadBaselineInput {
  fileContent: string;
  fileType?: 'XER' | 'XML';
  projectCodeOverride?: string;
}

export interface SyncFieldEventsInput {
  projectId: string;
  events: Array<{
    clientEventId: string;
    deviceId: string;
    supervisorId: string;
    sourceType: 'MOBILE_VOICE' | 'MOBILE_FORM' | 'EXCEL_DPR';
    rawText: string;
    audioRecordingUrl?: string | null;
    eventTimestampHw: string | Date;
    monotonicSeq: number | string | bigint;
  }>;
}

export interface ResolveReviewerInput {
  queueItemId: string;
  resolution: 'APPROVED' | 'REASSIGNED' | 'SPLIT' | 'DISMISSED';
  finalActivityId?: string;
  progressDeltaPercent?: number;
  reviewerUserId?: string;
}

export interface TriggerCPMInput {
  projectId: string;
}

export interface ExportXERInput {
  projectId: string;
}

// Dynamic import or fallback for wasp/server / prisma
let prismaClient: any = null;
async function getPrismaClient(context?: any) {
  if (context?.prisma) return context.prisma;

  // If context.entities is provided (e.g. standard Wasp context)
  if (context?.entities) {
    return new Proxy(context.entities, {
      get(target, prop: string | symbol) {
        if (typeof prop !== 'string') return (target as any)[prop];
        if (prop in target) return (target as any)[prop];
        // Convert lowercase e.g. project -> Project, baselineActivity -> BaselineActivity
        const capitalized = prop.charAt(0).toUpperCase() + prop.slice(1);
        if (capitalized in target) return (target as any)[capitalized];
        return (target as any)[prop];
      },
    });
  }

  if (prismaClient) return prismaClient;

  try {
    const wasp = await import('wasp/server');
    if (wasp.prisma) {
      prismaClient = wasp.prisma;
      return prismaClient;
    }
  } catch {
    // Ignore and fallback
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    prismaClient = new PrismaClient();
    return prismaClient;
  } catch {
    // Ignore and fallback
  }

  return null;
}

function throwHttpError(status: number, message: string): never {
  const err = new Error(message) as any;
  err.statusCode = status;
  err.status = status;
  throw err;
}

function validateInput<T>(args: any, name: string): T {
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    throwHttpError(400, `Invalid input for ${name}: expected object`);
  }
  return args as T;
}

// ==========================================
// 1. UPLOAD & INGEST SCHEDULE BASELINE
// ==========================================
export async function uploadScheduleBaseline(
  rawArgs: UploadBaselineInput,
  context: any
) {
  const args = validateInput<UploadBaselineInput>(rawArgs, 'uploadScheduleBaseline');
  if (!args.fileContent || typeof args.fileContent !== 'string') {
    throwHttpError(400, 'fileContent must be a valid non-empty string');
  }
  const fileType = args.fileType === 'XML' ? 'XML' : 'XER';
  const prisma = await getPrismaClient(context);

  // Parse using in-process TS parsers
  const parsed = fileType === 'XML'
    ? parseMSProjectXML(args.fileContent)
    : parsePrimaveraXER(args.fileContent);

  const projCode = args.projectCodeOverride || parsed.project.code;

  // Run initial CPM calculation to calculate Float & Critical Path
  const cpmActivities: CPMActivityInput[] = parsed.activities.map(a => ({
    id: a.activityCode,
    name: a.name,
    durationDays: a.plannedDurationDays,
    baselineStart: a.plannedStart,
    baselineFinish: a.plannedFinish,
    percentComplete: a.percentComplete || 0,
    discipline: a.discipline,
    wbsPath: a.wbsPath,
  }));

  const cpmDependencies: CPMDependencyInput[] = parsed.dependencies.map(d => ({
    predecessorId: d.predecessorId,
    successorId: d.successorId,
    dependencyType: d.dependencyType,
    lagDays: d.lagDays,
  }));

  const cpmResult = calculateCPM(cpmActivities, cpmDependencies, parsed.project.plannedFinishDate);

  // Upsert Project
  const project = await prisma.project.upsert({
    where: { code: projCode },
    create: {
      code: projCode,
      name: parsed.project.name,
      plannedStartDate: parsed.project.plannedStartDate,
      plannedFinishDate: parsed.project.plannedFinishDate,
      currentForecastFinishDate: cpmResult.projectForecastFinish,
      criticalPathDelayDays: cpmResult.criticalPathSlipDays,
    },
    update: {
      name: parsed.project.name,
      plannedStartDate: parsed.project.plannedStartDate,
      plannedFinishDate: parsed.project.plannedFinishDate,
      currentForecastFinishDate: cpmResult.projectForecastFinish,
      criticalPathDelayDays: cpmResult.criticalPathSlipDays,
    },
  });

  // Upsert Baseline Activities
  const activityCodeToIdMap = new Map<string, string>();

  for (const act of parsed.activities) {
    const calc = cpmResult.activities.get(act.activityCode);
    const embeddingText = formatActivityEmbeddingText({
      discipline: act.discipline,
      wbsPath: act.wbsPath,
      name: act.name,
    });

    const record = await prisma.baselineActivity.upsert({
      where: {
        projectId_activityCode: {
          projectId: project.id,
          activityCode: act.activityCode,
        },
      },
      create: {
        projectId: project.id,
        activityCode: act.activityCode,
        name: act.name,
        wbsPath: act.wbsPath,
        discipline: act.discipline,
        plannedDurationDays: act.plannedDurationDays,
        plannedStart: act.plannedStart,
        plannedFinish: act.plannedFinish,
        percentComplete: act.percentComplete || 0,
        totalFloatDays: calc?.totalFloatDays ?? 0,
        freeFloatDays: calc?.freeFloatDays ?? 0,
        isCriticalPath: calc?.isCriticalPath ?? false,
        embeddingText,
      },
      update: {
        name: act.name,
        wbsPath: act.wbsPath,
        discipline: act.discipline,
        plannedDurationDays: act.plannedDurationDays,
        plannedStart: act.plannedStart,
        plannedFinish: act.plannedFinish,
        totalFloatDays: calc?.totalFloatDays ?? 0,
        freeFloatDays: calc?.freeFloatDays ?? 0,
        isCriticalPath: calc?.isCriticalPath ?? false,
        embeddingText,
      },
    });

    activityCodeToIdMap.set(act.activityCode, record.id);
  }

  // Create Dependencies
  for (const dep of parsed.dependencies) {
    const predId = activityCodeToIdMap.get(dep.predecessorId);
    const succId = activityCodeToIdMap.get(dep.successorId);
    if (!predId || !succId) continue;

    await prisma.activityDependency.upsert({
      where: {
        predecessorId_successorId: {
          predecessorId: predId,
          successorId: succId,
        },
      },
      create: {
        projectId: project.id,
        predecessorId: predId,
        successorId: succId,
        dependencyType: dep.dependencyType,
        lagDays: dep.lagDays,
      },
      update: {
        dependencyType: dep.dependencyType,
        lagDays: dep.lagDays,
      },
    });
  }

  return {
    projectId: project.id,
    projectCode: project.code,
    activitiesCount: parsed.activities.length,
    dependenciesCount: parsed.dependencies.length,
    criticalPathActivitiesCount: cpmResult.criticalPath.length,
    criticalPathSlipDays: cpmResult.criticalPathSlipDays,
  };
}

// ==========================================
// 2. FIELD EVENTS BATCH SYNC & SEMANTIC MATCH
// ==========================================
export async function syncFieldEventsBatch(
  rawArgs: SyncFieldEventsInput,
  context: any
) {
  const args = validateInput<SyncFieldEventsInput>(rawArgs, 'syncFieldEventsBatch');
  if (!args.projectId) throwHttpError(400, 'projectId is required');
  if (!Array.isArray(args.events)) throwHttpError(400, 'events must be an array');
  const prisma = await getPrismaClient(context);

  // Load project's candidate activities
  const activities = await prisma.baselineActivity.findMany({
    where: { projectId: args.projectId },
  });

  const candidates: SemanticCandidate[] = activities.map((a: any) => ({
    id: a.id,
    activityCode: a.activityCode,
    name: a.name,
    wbsPath: a.wbsPath,
    discipline: a.discipline,
    percentComplete: a.percentComplete,
  }));

  // In-process causal reordering & semantic match
  const batchResult = processFieldEventsBatch(args.events as RawFieldEventInput[], candidates);

  // Persist reconciled events
  for (const item of batchResult.processedItems) {
    const { event, match, proposedProgressDelta } = item;

    const fieldEvent = await prisma.fieldEvent.upsert({
      where: {
        deviceId_clientEventId: {
          deviceId: event.deviceId,
          clientEventId: event.clientEventId,
        },
      },
      create: {
        projectId: args.projectId,
        clientEventId: event.clientEventId,
        deviceId: event.deviceId,
        supervisorId: event.supervisorId,
        sourceType: event.sourceType,
        rawText: event.rawText,
        audioRecordingUrl: event.audioRecordingUrl,
        eventTimestampHw: new Date(event.eventTimestampHw),
        monotonicSeq: BigInt(event.monotonicSeq.toString()),
        reconciledCausalOrder: event.reconciledCausalOrder,
        matchedActivityId: match.topCandidate?.id,
        matchConfidence: match.confidenceScore,
        status: match.status,
      },
      update: {
        reconciledCausalOrder: event.reconciledCausalOrder,
        status: match.status,
      },
    });

    if (match.status === 'AUTO_MATCHED' && match.topCandidate) {
      // Direct commit to schedule actuals
      const existingAct = await prisma.baselineActivity.findUnique({
        where: { id: match.topCandidate.id },
      });
      const actStart = existingAct?.actualStart && existingAct.actualStart < new Date(event.eventTimestampHw)
        ? existingAct.actualStart
        : new Date(event.eventTimestampHw);

      await prisma.baselineActivity.update({
        where: { id: match.topCandidate.id },
        data: {
          percentComplete: Math.min(100, Math.max(existingAct?.percentComplete || 0, proposedProgressDelta)),
          actualStart: actStart,
          actualFinish: proposedProgressDelta >= 100 ? new Date(event.eventTimestampHw) : undefined,
        },
      });
    } else if (match.status === 'PENDING_REVIEW' && match.topCandidate) {
      // Create Reviewer Queue Item for human verification
      await prisma.reviewerQueueItem.upsert({
        where: { fieldEventId: fieldEvent.id },
        create: {
          fieldEventId: fieldEvent.id,
          topCandidateId: match.topCandidate.id,
          candidateSimilarityScore: match.confidenceScore,
          alternateCandidates: match.alternateCandidates.map(alt => ({
            activityId: alt.candidate.id,
            code: alt.candidate.activityCode,
            name: alt.candidate.name,
            score: alt.score,
          })),
          matchRationale: match.matchRationale,
          progressDeltaPercent: proposedProgressDelta,
        },
        update: {
          candidateSimilarityScore: match.confidenceScore,
          matchRationale: match.matchRationale,
        },
      });
    }
  }

  return {
    reconciledCount: batchResult.reconciledEvents.length,
    autoMatchedCount: batchResult.autoMatchedCount,
    pendingReviewCount: batchResult.pendingReviewCount,
    unmatchedCount: batchResult.unmatchedCount,
    tamperedClockCount: batchResult.tamperedClockCount,
  };
}

// ==========================================
// 3. RESOLVE REVIEWER ITEM
// ==========================================
export async function resolveReviewerItem(
  rawArgs: ResolveReviewerInput,
  context: any
) {
  const args = validateInput<ResolveReviewerInput>(rawArgs, 'resolveReviewerItem');
  if (!args.queueItemId) throwHttpError(400, 'queueItemId is required');
  if (!args.resolution) throwHttpError(400, 'resolution is required');
  const prisma = await getPrismaClient(context);

  const item = await prisma.reviewerQueueItem.findUnique({
    where: { id: args.queueItemId },
    include: { fieldEvent: true, topCandidate: true },
  });

  if (!item) {
    throwHttpError(404, 'Reviewer queue item not found.');
  }

  const finalActId = args.finalActivityId || item.topCandidateId;
  const progress = args.progressDeltaPercent ?? item.progressDeltaPercent ?? 100;

  // Update item
  const resolved = await prisma.reviewerQueueItem.update({
    where: { id: args.queueItemId },
    data: {
      resolution: args.resolution,
      finalActivityId: finalActId,
      progressDeltaPercent: progress,
      reviewedById: args.reviewerUserId || context?.user?.id,
      resolvedAt: new Date(),
    },
  });

  if (args.resolution === 'APPROVED' || args.resolution === 'REASSIGNED') {
    const existingAct = await prisma.baselineActivity.findUnique({
      where: { id: finalActId },
    });
    // Commit verified actual to baseline activity
    await prisma.baselineActivity.update({
      where: { id: finalActId },
      data: {
        percentComplete: Math.min(100, Math.max(existingAct?.percentComplete || 0, progress)),
        actualStart: existingAct?.actualStart ?? new Date(),
        actualFinish: progress >= 100 ? (existingAct?.actualFinish ?? new Date()) : undefined,
      },
    });

    await prisma.fieldEvent.update({
      where: { id: item.fieldEventId },
      data: {
        status: 'MANUALLY_MATCHED',
        matchedActivityId: finalActId,
      },
    });
  } else if (args.resolution === 'DISMISSED') {
    await prisma.fieldEvent.update({
      where: { id: item.fieldEventId },
      data: { status: 'REJECTED' },
    });
  }

  return { success: true, resolution: args.resolution, resolvedId: resolved.id };
}

// ==========================================
// 4. TRIGGER CPM RECALCULATION & DELAY PREDICTION
// ==========================================
export async function triggerCPMRecalculation(
  rawArgs: TriggerCPMInput,
  context: any
) {
  const args = validateInput<TriggerCPMInput>(rawArgs, 'triggerCPMRecalculation');
  if (!args.projectId) throwHttpError(400, 'projectId is required');
  const prisma = await getPrismaClient(context);

  const project = await prisma.project.findUnique({
    where: { id: args.projectId },
    include: {
      activities: true,
      dependencies: {
        include: {
          predecessor: true,
          successor: true,
        },
      },
    },
  });

  if (!project) {
    throwHttpError(404, 'Project not found.');
  }

  const cpmActivities: CPMActivityInput[] = project.activities.map((a: any) => ({
    id: a.activityCode,
    name: a.name,
    durationDays: a.plannedDurationDays,
    baselineStart: a.plannedStart,
    baselineFinish: a.plannedFinish,
    actualStart: a.actualStart,
    actualFinish: a.actualFinish,
    percentComplete: a.percentComplete,
    discipline: a.discipline,
    wbsPath: a.wbsPath,
  }));

  const cpmDependencies: CPMDependencyInput[] = project.dependencies.map((d: any) => ({
    predecessorId: d.predecessor.activityCode,
    successorId: d.successor.activityCode,
    dependencyType: d.dependencyType,
    lagDays: d.lagDays,
  }));

  const cpmResult = calculateCPM(cpmActivities, cpmDependencies, project.plannedFinishDate);

  // Update activities with calculated floats
  for (const act of project.activities) {
    const calc = cpmResult.activities.get(act.activityCode);
    if (!calc) continue;

    await prisma.baselineActivity.update({
      where: { id: act.id },
      data: {
        totalFloatDays: calc.totalFloatDays,
        freeFloatDays: calc.freeFloatDays,
        isCriticalPath: calc.isCriticalPath,
      },
    });
  }

  // Update Project stats
  await prisma.project.update({
    where: { id: project.id },
    data: {
      currentForecastFinishDate: cpmResult.projectForecastFinish,
      criticalPathDelayDays: cpmResult.criticalPathSlipDays,
    },
  });

  // Store Delay Predictions if slips detected
  if (cpmResult.delayedMilestones.length > 0 || cpmResult.criticalPathSlipDays > 0) {
    const firstDelayed = cpmResult.delayedMilestones[0] || {
      name: project.name,
      forecastFinish: cpmResult.projectForecastFinish,
      slipDays: cpmResult.criticalPathSlipDays,
    };
    await prisma.delayPrediction.create({
      data: {
        projectId: project.id,
        criticalPathSlipDays: cpmResult.criticalPathSlipDays,
        affectedMilestoneName: firstDelayed.name,
        predictedMilestoneDate: firstDelayed.forecastFinish,
        varianceFromBaselineDays: firstDelayed.slipDays,
        primaryRootCause: `Critical path downstream bottleneck following activity ${firstDelayed.name}.`,
        mitigationRecommendations: cpmResult.mitigationRecommendations as any,
      },
    });
  }

  return {
    projectId: project.id,
    criticalPath: cpmResult.criticalPath,
    criticalPathSlipDays: cpmResult.criticalPathSlipDays,
    forecastFinish: cpmResult.projectForecastFinish,
    delayedMilestonesCount: cpmResult.delayedMilestones.length,
    mitigationsCount: cpmResult.mitigationRecommendations.length,
  };
}

// ==========================================
// 5. EXPORT PRIMAVERA P6 .XER
// ==========================================
export async function exportPrimaveraXER(
  rawArgs: ExportXERInput,
  context: any
) {
  const args = validateInput<ExportXERInput>(rawArgs, 'exportPrimaveraXER');
  if (!args.projectId) throwHttpError(400, 'projectId is required');
  const prisma = await getPrismaClient(context);

  const project = await prisma.project.findUnique({
    where: { id: args.projectId },
    include: {
      activities: true,
      dependencies: {
        include: { predecessor: true, successor: true },
      },
    },
  });

  if (!project) {
    throwHttpError(404, 'Project not found.');
  }

  const xerString = generatePrimaveraXER({
    projectCode: project.code,
    projectName: project.name,
    plannedStartDate: project.plannedStartDate,
    plannedFinishDate: project.plannedFinishDate,
    activities: project.activities.map((a: any) => ({
      activityCode: a.activityCode,
      name: a.name,
      wbsPath: a.wbsPath,
      plannedDurationDays: a.plannedDurationDays,
      plannedStart: a.plannedStart,
      plannedFinish: a.plannedFinish,
      actualStart: a.actualStart,
      actualFinish: a.actualFinish,
      percentComplete: a.percentComplete,
      isCriticalPath: a.isCriticalPath,
    })),
    dependencies: project.dependencies.map((d: any) => ({
      predecessorCode: d.predecessor.activityCode,
      successorCode: d.successor.activityCode,
      dependencyType: d.dependencyType,
      lagDays: d.lagDays,
    })),
  });

  return {
    filename: `${project.code}_Actuals_${new Date().toISOString().slice(0, 10)}.xer`,
    content: xerString,
  };
}

// ==========================================
// 6. QUERIES
// ==========================================
export async function getProjects(_args: unknown, context: any) {
  const prisma = await getPrismaClient(context);
  return prisma.project.findMany({
    include: {
      _count: {
        select: {
          activities: true,
          fieldEvents: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProjectDetails(rawArgs: { projectId: string }, context: any) {
  const prisma = await getPrismaClient(context);
  const project = await prisma.project.findUnique({
    where: { id: rawArgs.projectId },
    include: {
      activities: {
        orderBy: { plannedStart: 'asc' },
      },
      dependencies: {
        include: {
          predecessor: { select: { id: true, activityCode: true, name: true } },
          successor: { select: { id: true, activityCode: true, name: true } },
        },
      },
      delayPredictions: {
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
    },
  });

  if (!project) throwHttpError(404, 'Project not found');
  return project;
}

export async function getReviewerQueue(rawArgs: { projectId?: string } | undefined, context: any) {
  const prisma = await getPrismaClient(context);
  return prisma.reviewerQueueItem.findMany({
    where: {
      resolution: null,
      fieldEvent: rawArgs?.projectId ? { projectId: rawArgs.projectId } : undefined,
    },
    include: {
      fieldEvent: {
        include: {
          supervisor: { select: { id: true, email: true, username: true } },
        },
      },
      topCandidate: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDelayPredictions(rawArgs: { projectId: string }, context: any) {
  const prisma = await getPrismaClient(context);
  return prisma.delayPrediction.findMany({
    where: { projectId: rawArgs.projectId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getHistoricalBenchmarks(rawArgs: { discipline?: string } | undefined, context: any) {
  const prisma = await getPrismaClient(context);
  return prisma.closedProjectBenchmark.findMany({
    where: rawArgs?.discipline ? { discipline: rawArgs.discipline } : undefined,
    orderBy: { variancePercentage: 'desc' },
  });
}
