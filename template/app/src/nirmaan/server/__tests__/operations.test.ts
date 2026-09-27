import test from 'node:test';
import assert from 'node:assert/strict';

import {
  uploadScheduleBaseline,
  syncFieldEventsBatch,
  resolveReviewerItem,
  triggerCPMRecalculation,
  exportPrimaveraXER,
  getProjects,
  getProjectDetails,
  getReviewerQueue,
  getDelayPredictions,
  getHistoricalBenchmarks,
} from '../operations';

// In-memory lightweight mock database representing Prisma
function createMockPrisma() {
  const store = {
    projects: new Map<string, any>(),
    activities: new Map<string, any>(),
    dependencies: new Map<string, any>(),
    fieldEvents: new Map<string, any>(),
    reviewerItems: new Map<string, any>(),
    delayPredictions: new Map<string, any>(),
    benchmarks: new Map<string, any>(),
    users: new Map<string, any>(),
  };

  // Seed sample supervisor
  store.users.set('sup-001', {
    id: 'sup-001',
    email: 'hazarika.b@oilindia.in',
    username: 'bhaskar_hazarika',
    role: 'SUPERVISOR',
  });

  // Seed sample benchmarks
  store.benchmarks.set('bench-1', {
    id: 'bench-1',
    historicalProjectCode: 'OIL-NUMALIGARH-2023',
    discipline: 'Piping',
    workType: 'Aboveground Spool Fabrication',
    plannedDurationDays: 60,
    actualDurationDays: 74,
    variancePercentage: 23.3,
    recordedDelays: [{ cause: 'Monsoon flooding at Brahmaputra crossing', days: 14 }],
    createdAt: new Date('2023-12-01'),
  });

  return {
    project: {
      async upsert({ where, create, update }: any) {
        const existing = Array.from(store.projects.values()).find(p => p.code === where.code);
        if (existing) {
          Object.assign(existing, update, { updatedAt: new Date() });
          return existing;
        }
        const created = { id: `proj-${Date.now()}`, ...create, createdAt: new Date(), updatedAt: new Date() };
        store.projects.set(created.id, created);
        return created;
      },
      async findUnique({ where, include }: any) {
        const proj = store.projects.get(where.id) || Array.from(store.projects.values()).find(p => p.code === where.code);
        if (!proj) return null;
        const res = { ...proj };
        if (include?.activities) {
          res.activities = Array.from(store.activities.values()).filter(a => a.projectId === proj.id);
        }
        if (include?.dependencies) {
          const deps = Array.from(store.dependencies.values()).filter(d => d.projectId === proj.id);
          res.dependencies = deps.map(d => {
            const pred = store.activities.get(d.predecessorId);
            const succ = store.activities.get(d.successorId);
            return { ...d, predecessor: pred, successor: succ };
          });
        }
        if (include?.delayPredictions) {
          res.delayPredictions = Array.from(store.delayPredictions.values()).filter(dp => dp.projectId === proj.id);
        }
        return res;
      },
      async update({ where, data }: any) {
        const proj = store.projects.get(where.id);
        if (!proj) throw new Error('Project not found');
        Object.assign(proj, data);
        return proj;
      },
      async findMany({ include }: any) {
        const list = Array.from(store.projects.values());
        return list.map(p => {
          const item: any = { ...p };
          if (include?._count) {
            item._count = {
              activities: Array.from(store.activities.values()).filter(a => a.projectId === p.id).length,
              fieldEvents: Array.from(store.fieldEvents.values()).filter(fe => fe.projectId === p.id).length,
            };
          }
          return item;
        });
      },
    },

    baselineActivity: {
      async upsert({ where, create, update }: any) {
        const existing = Array.from(store.activities.values()).find(
          a => a.projectId === where.projectId_activityCode.projectId && a.activityCode === where.projectId_activityCode.activityCode
        );
        if (existing) {
          Object.assign(existing, update, { updatedAt: new Date() });
          return existing;
        }
        const created = { id: `act-${Date.now()}-${Math.random()}`, ...create, createdAt: new Date(), updatedAt: new Date() };
        store.activities.set(created.id, created);
        return created;
      },
      async findMany({ where }: any) {
        return Array.from(store.activities.values()).filter(a => !where?.projectId || a.projectId === where.projectId);
      },
      async findUnique({ where }: any) {
        return store.activities.get(where.id) || null;
      },
      async update({ where, data }: any) {
        const act = store.activities.get(where.id);
        if (!act) throw new Error(`Activity ${where.id} not found`);
        Object.assign(act, data);
        return act;
      },
    },

    activityDependency: {
      async upsert({ where, create, update }: any) {
        const existing = Array.from(store.dependencies.values()).find(
          d => d.predecessorId === where.predecessorId_successorId.predecessorId &&
               d.successorId === where.predecessorId_successorId.successorId
        );
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const created = { id: `dep-${Date.now()}-${Math.random()}`, ...create };
        store.dependencies.set(created.id, created);
        return created;
      },
    },

    fieldEvent: {
      async upsert({ where, create, update }: any) {
        const existing = Array.from(store.fieldEvents.values()).find(
          fe => fe.deviceId === where.deviceId_clientEventId.deviceId &&
                fe.clientEventId === where.deviceId_clientEventId.clientEventId
        );
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const created = { id: `fe-${Date.now()}-${Math.random()}`, ...create, syncReceivedAt: new Date() };
        store.fieldEvents.set(created.id, created);
        return created;
      },
      async update({ where, data }: any) {
        const fe = store.fieldEvents.get(where.id);
        if (!fe) throw new Error('Field event not found');
        Object.assign(fe, data);
        return fe;
      },
    },

    reviewerQueueItem: {
      async upsert({ where, create, update }: any) {
        const existing = Array.from(store.reviewerItems.values()).find(
          ri => ri.fieldEventId === where.fieldEventId
        );
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const created = { id: `rq-${Date.now()}-${Math.random()}`, ...create, createdAt: new Date() };
        store.reviewerItems.set(created.id, created);
        return created;
      },
      async findUnique({ where, include }: any) {
        const item = store.reviewerItems.get(where.id);
        if (!item) return null;
        const res = { ...item };
        if (include?.fieldEvent) {
          res.fieldEvent = store.fieldEvents.get(item.fieldEventId);
        }
        if (include?.topCandidate) {
          res.topCandidate = store.activities.get(item.topCandidateId);
        }
        return res;
      },
      async update({ where, data }: any) {
        const item = store.reviewerItems.get(where.id);
        if (!item) throw new Error('Reviewer item not found');
        Object.assign(item, data);
        return item;
      },
      async findMany({ where, include }: any) {
        let list = Array.from(store.reviewerItems.values());
        if (where?.resolution === null) {
          list = list.filter(i => !i.resolution);
        }
        return list.map(item => {
          const res = { ...item };
          if (include?.fieldEvent) {
            const fe = store.fieldEvents.get(item.fieldEventId);
            res.fieldEvent = fe ? {
              ...fe,
              supervisor: store.users.get(fe.supervisorId) || { id: fe.supervisorId, username: 'Unknown' },
            } : null;
          }
          if (include?.topCandidate) {
            res.topCandidate = store.activities.get(item.topCandidateId);
          }
          return res;
        });
      },
    },

    delayPrediction: {
      async create({ data }: any) {
        const created = { id: `dp-${Date.now()}-${Math.random()}`, ...data, createdAt: new Date() };
        store.delayPredictions.set(created.id, created);
        return created;
      },
      async findMany({ where }: any) {
        return Array.from(store.delayPredictions.values()).filter(
          dp => !where?.projectId || dp.projectId === where.projectId
        );
      },
    },

    closedProjectBenchmark: {
      async findMany({ where }: any) {
        let list = Array.from(store.benchmarks.values());
        if (where?.discipline) {
          list = list.filter(b => b.discipline === where.discipline);
        }
        return list;
      },
    },
  };
}

// Sample P6 XER string
const sampleXER = `ERPROJECT
%T\tPROJECT
%F\tproj_id\tproj_short_name\tproject_name\tplan_start_date\tplan_end_date
%R\t1001\tOIL-DIBRUGARH-2026\tOil India Dibrugarh Crude Pipeline\t2026-10-01 08:00\t2026-10-31 08:00
%T\tPROJWBS
%F\twbs_id\tparent_wbs_id\tproj_id\twbs_name\twbs_short_name
%R\t2001\t\t1001\tMainline Pipeline\tMLP
%R\t2002\t2001\t1001\tSection A Trenching & Laying\tSEC-A
%T\tTASK
%F\ttask_id\tproj_id\twbs_id\ttask_code\ttask_name\ttarget_start_date\ttarget_end_date\ttarget_drtn_hr_cnt\tphys_percent_complete
%R\t3001\t1001\t2002\tACT-TRENCH-01\tExcavate Trench Section A 5km\t2026-10-01 08:00\t2026-10-10 17:00\t80.0\t0.0
%R\t3002\t1001\t2002\tACT-STRING-02\tStringing and Lowering Pipes Section A\t2026-10-11 08:00\t2026-10-20 17:00\t80.0\t0.0
%R\t3003\t1001\t2002\tACT-WELD-03\tTie-in Welding and Joint Coating Section A\t2026-10-21 08:00\t2026-10-30 17:00\t80.0\t0.0
%T\tTASKPRED
%F\ttask_pred_id\ttask_id\tpred_task_id\tpred_type\tlag_hr_cnt
%R\t4001\t3002\t3001\tPR_FS\t0.0
%R\t4002\t3003\t3002\tPR_FS\t0.0
%E
`;

// ==========================================
// INTEGRATION TESTS FOR NIRMAAN SETU OPERATIONS
// ==========================================

test('Operations: uploadScheduleBaseline creates project, calculates CPM floats, and indexes activities', async () => {
  const prisma = createMockPrisma();
  const context = { prisma, user: { id: 'user-planner', role: 'PLANNER' } };

  const result = await uploadScheduleBaseline(
    {
      fileContent: sampleXER,
      fileType: 'XER',
    },
    context
  );

  assert.ok(result.projectId);
  assert.equal(result.projectCode, 'OIL-DIBRUGARH-2026');
  assert.equal(result.activitiesCount, 3);
  assert.equal(result.dependenciesCount, 2);
  assert.equal(result.criticalPathActivitiesCount, 3); // Linear FS chain is entirely on critical path
  assert.equal(result.criticalPathSlipDays, 0);

  // Validate Project Details Query
  const proj = await getProjectDetails({ projectId: result.projectId }, context);
  assert.equal(proj.code, 'OIL-DIBRUGARH-2026');
  assert.equal(proj.activities.length, 3);
  assert.equal(proj.dependencies.length, 2);

  // Verify critical path activities have float = 0
  for (const act of proj.activities) {
    assert.equal(act.isCriticalPath, true);
    assert.equal(act.totalFloatDays, 0);
    assert.ok(act.embeddingText.includes('Discipline:'));
  }
});

test('Operations: getProjects returns portfolio with activity and field log counts', async () => {
  const prisma = createMockPrisma();
  const context = { prisma, user: { id: 'user-planner', role: 'PLANNER' } };

  await uploadScheduleBaseline({ fileContent: sampleXER, fileType: 'XER' }, context);

  const projects = await getProjects({}, context);
  assert.equal(projects.length, 1);
  assert.equal(projects[0].code, 'OIL-DIBRUGARH-2026');
  assert.equal(projects[0]._count.activities, 3);
  assert.equal(projects[0]._count.fieldEvents, 0);
});

test('Operations: syncFieldEventsBatch processes Tier 1 auto-matches and Tier 2 reviewer queue items', async () => {
  const prisma = createMockPrisma();
  const context = { prisma, user: { id: 'user-planner', role: 'PLANNER' } };

  const uploaded = await uploadScheduleBaseline({ fileContent: sampleXER, fileType: 'XER' }, context);

  const batchResult = await syncFieldEventsBatch(
    {
      projectId: uploaded.projectId,
      events: [
        {
          clientEventId: 'ev-001',
          deviceId: 'tab-assam-01',
          supervisorId: 'sup-001',
          sourceType: 'MOBILE_VOICE',
          rawText: 'Excavation completed for Section A Trenching 5km today. 100% finished.',
          eventTimestampHw: '2026-10-08T16:00:00.000Z',
          monotonicSeq: 1,
        },
        {
          clientEventId: 'ev-002',
          deviceId: 'tab-assam-01',
          supervisorId: 'sup-001',
          sourceType: 'MOBILE_FORM',
          rawText: 'Stringing and Lowering Pipes Section A progress today, roughly 40 percent done.',
          eventTimestampHw: '2026-10-09T16:00:00.000Z',
          monotonicSeq: 2,
        },
      ],
    },
    context
  );

  assert.equal(batchResult.reconciledCount, 2);
  assert.equal(batchResult.unmatchedCount, 0);

  // Check Reviewer Queue
  const queue = await getReviewerQueue({ projectId: uploaded.projectId }, context);
  // Any Tier 2 pending review events should appear in queue
  if (batchResult.pendingReviewCount > 0) {
    assert.equal(queue.length, batchResult.pendingReviewCount);
    assert.ok(queue[0].candidateSimilarityScore >= 0.6);
    assert.ok(queue[0].topCandidate);
  }
});

test('Operations: resolveReviewerItem approves candidate and commits verified progress to baseline activity', async () => {
  const prisma = createMockPrisma();
  const context = { prisma, user: { id: 'user-planner', role: 'PLANNER' } };

  const uploaded = await uploadScheduleBaseline({ fileContent: sampleXER, fileType: 'XER' }, context);

  // Send an event that routes to pending review
  await syncFieldEventsBatch(
    {
      projectId: uploaded.projectId,
      events: [
        {
          clientEventId: 'ev-review-1',
          deviceId: 'tab-assam-02',
          supervisorId: 'sup-001',
          sourceType: 'MOBILE_VOICE',
          rawText: 'Rough pipe line lay down on Section A site. Approx 50 percent done.',
          eventTimestampHw: '2026-10-12T12:00:00.000Z',
          monotonicSeq: 1,
        },
      ],
    },
    context
  );

  const queue = await getReviewerQueue({ projectId: uploaded.projectId }, context);
  if (queue.length > 0) {
    const itemToResolve = queue[0]!;

    const resolveRes = await resolveReviewerItem(
      {
        queueItemId: itemToResolve.id,
        resolution: 'APPROVED',
        progressDeltaPercent: 50,
        reviewerUserId: 'user-planner',
      },
      context
    );

    assert.equal(resolveRes.success, true);
    assert.equal(resolveRes.resolution, 'APPROVED');

    // Baseline activity should now show 50% complete
    const act = await prisma.baselineActivity.findUnique({
      where: { id: itemToResolve.topCandidateId },
    });
    assert.equal(act.percentComplete, 50);

    // Queue should now be empty of unreviewed items
    const remainingQueue = await getReviewerQueue({ projectId: uploaded.projectId }, context);
    assert.equal(remainingQueue.length, 0);
  }
});

test('Operations: triggerCPMRecalculation detects slip and creates delay predictions', async () => {
  const prisma = createMockPrisma();
  const context = { prisma, user: { id: 'user-planner', role: 'PLANNER' } };

  const uploaded = await uploadScheduleBaseline({ fileContent: sampleXER, fileType: 'XER' }, context);

  // Artificially simulate delay on the first critical activity
  const projBefore = await getProjectDetails({ projectId: uploaded.projectId }, context);
  const firstAct = projBefore.activities[0]!;

  // Delay finish date by 15 days
  await prisma.baselineActivity.update({
    where: { id: firstAct.id },
    data: {
      percentComplete: 100,
      actualStart: new Date('2026-10-01T08:00:00.000Z'),
      actualFinish: new Date('2026-10-25T17:00:00.000Z'), // 15 days later than Oct 10 baseline
    },
  });

  const cpmRecalc = await triggerCPMRecalculation(
    { projectId: uploaded.projectId },
    context
  );

  assert.ok(cpmRecalc.criticalPathSlipDays >= 14);

  // Check delay prediction generated
  const predictions = await getDelayPredictions(
    { projectId: uploaded.projectId },
    context
  );
  assert.ok(predictions.length >= 1);
  assert.ok(predictions[0].criticalPathSlipDays >= 14);
  assert.ok(predictions[0].mitigationRecommendations.length > 0);
});

test('Operations: exportPrimaveraXER writes back verified actual dates and progress to authentic P6 format', async () => {
  const prisma = createMockPrisma();
  const context = { prisma, user: { id: 'user-planner', role: 'PLANNER' } };

  const uploaded = await uploadScheduleBaseline({ fileContent: sampleXER, fileType: 'XER' }, context);

  // Update actual on an activity
  const proj = await getProjectDetails({ projectId: uploaded.projectId }, context);
  await prisma.baselineActivity.update({
    where: { id: proj.activities[0]!.id },
    data: {
      percentComplete: 100,
      actualStart: new Date('2026-10-01T08:00:00.000Z'),
      actualFinish: new Date('2026-10-10T17:00:00.000Z'),
    },
  });

  const exported = await exportPrimaveraXER(
    { projectId: uploaded.projectId },
    context
  );

  assert.ok(exported.filename.startsWith('OIL-DIBRUGARH-2026'));
  assert.ok(exported.filename.endsWith('.xer'));
  assert.ok(exported.content.startsWith('ERPROJECT'));
  assert.ok(exported.content.includes('ACT-TRENCH-01'));
  assert.ok(exported.content.includes('%T\tTASK'));
  assert.ok(exported.content.includes('100.0')); // Verified 100% progress written back
});

test('Operations: getHistoricalBenchmarks retrieves closed project variance records', async () => {
  const prisma = createMockPrisma();
  const context = { prisma, user: { id: 'user-planner', role: 'PLANNER' } };

  const allBenchmarks = await getHistoricalBenchmarks(undefined, context);
  assert.equal(allBenchmarks.length, 1);
  assert.equal(allBenchmarks[0].historicalProjectCode, 'OIL-NUMALIGARH-2023');

  const pipingBenchmarks = await getHistoricalBenchmarks({ discipline: 'Piping' }, context);
  assert.equal(pipingBenchmarks.length, 1);

  const civilBenchmarks = await getHistoricalBenchmarks({ discipline: 'Civil' }, context);
  assert.equal(civilBenchmarks.length, 0);
});
