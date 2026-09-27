import test from 'node:test';
import assert from 'node:assert/strict';

import { parsePrimaveraXER, parseMSProjectXML } from '../parsers/xerParser';
import { generatePrimaveraXER } from '../parsers/xerExporter';
import { calculateCPM } from '../cpm/cpmEngine';
import {
  matchFieldEventToActivities,
  extractProgressDelta,
  cosineSimilarityDense,
} from '../matching/semanticMatcher';
import {
  reconcileFieldEventsCausally,
  processFieldEventsBatch,
} from '../sync/causalSync';
import type {
  CPMActivityInput,
  CPMDependencyInput,
  RawFieldEventInput,
  SemanticCandidate,
} from '../types';

// ==========================================
// 1. PRIMAVERA P6 (.XER) & MSP XML PARSER TESTS
// ==========================================
test('xerParser: parses authentic P6 .XER table format and reconstructs WBS tree', () => {
  const sampleXER = `ERPROJECT
%T\tPROJECT
%F\tproj_id\tproj_short_name\tproject_name\tplan_start_date\tplan_end_date
%R\t1001\tOIL-ASSAM-2026\tOil India Assam Crude Pipeline Project\t2026-10-01 08:00\t2027-04-30 17:00
%T\tPROJWBS
%F\twbs_id\tparent_wbs_id\tproj_id\twbs_name\twbs_short_name
%R\t2001\t\t1001\tAssam Pipeline Project\tAPP
%R\t2002\t2001\t1001\tUnit 02 Station\tU02
%R\t2003\t2002\t1001\tAboveground Piping\tPIP
%T\tTASK
%F\ttask_id\tproj_id\twbs_id\ttask_code\ttask_name\ttarget_start_date\ttarget_end_date\ttarget_drtn_hr_cnt\tphys_percent_complete
%R\t3001\t1001\t2003\tACT-101\tErect Spool Line 24-XX\t2026-10-01 08:00\t2026-10-10 17:00\t80.0\t0.0
%R\t3002\t1001\t2003\tACT-102\tHydrotest Line 24-XX\t2026-10-11 08:00\t2026-10-15 17:00\t40.0\t0.0
%T\tTASKPRED
%F\ttask_pred_id\ttask_id\tpred_task_id\tpred_type\tlag_hr_cnt
%R\t4001\t3002\t3001\tPR_FS\t0.0
%E
`;

  const parsed = parsePrimaveraXER(sampleXER);

  // Validate Project
  assert.equal(parsed.project.code, 'OIL-ASSAM-2026');
  assert.equal(parsed.project.name, 'Oil India Assam Crude Pipeline Project');

  // Validate WBS Path Hierarchy
  const pipWbs = parsed.wbs.find(w => w.wbsId === '2003');
  assert.ok(pipWbs);
  assert.equal(pipWbs.fullPath, 'Assam Pipeline Project > Unit 02 Station > Aboveground Piping');

  // Validate Tasks
  assert.equal(parsed.activities.length, 2);
  const act101 = parsed.activities.find(a => a.activityCode === 'ACT-101');
  assert.ok(act101);
  assert.equal(act101.name, 'Erect Spool Line 24-XX');
  assert.equal(act101.plannedDurationDays, 10); // 80 hrs / 8 = 10 days
  assert.equal(act101.discipline, 'Piping');
  assert.equal(act101.wbsPath, 'Assam Pipeline Project > Unit 02 Station > Aboveground Piping');

  // Validate Dependencies
  assert.equal(parsed.dependencies.length, 1);
  assert.equal(parsed.dependencies[0]?.predecessorId, 'ACT-101');
  assert.equal(parsed.dependencies[0]?.successorId, 'ACT-102');
  assert.equal(parsed.dependencies[0]?.dependencyType, 'FS');
  assert.equal(parsed.dependencies[0]?.lagDays, 0);
});

test('xerParser: parses MS Project XML format', () => {
  const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<Project>
  <Title>Oil India Refinery MS Project</Title>
  <Tasks>
    <Task>
      <UID>10</UID>
      <Name>Trench Excavation Section 1</Name>
      <WBS>Pipeline > Civil</WBS>
      <Start>2026-10-01T08:00:00</Start>
      <Finish>2026-10-05T17:00:00</Finish>
      <PercentComplete>100</PercentComplete>
    </Task>
    <Task>
      <UID>20</UID>
      <Name>Lower Pipe String Section 1</Name>
      <WBS>Pipeline > Mechanical</WBS>
      <Start>2026-10-06T08:00:00</Start>
      <Finish>2026-10-12T17:00:00</Finish>
      <PercentComplete>0</PercentComplete>
      <PredecessorLink>
        <PredecessorUID>10</PredecessorUID>
        <Type>1</Type>
      </PredecessorLink>
    </Task>
  </Tasks>
</Project>`;

  const parsed = parseMSProjectXML(sampleXML);
  assert.equal(parsed.activities.length, 2);
  assert.equal(parsed.activities[0]?.discipline, 'Civil');
  assert.equal(parsed.activities[1]?.discipline, 'Piping');
  assert.equal(parsed.dependencies.length, 1);
  assert.equal(parsed.dependencies[0]?.predecessorId, 'ACT-10');
  assert.equal(parsed.dependencies[0]?.successorId, 'ACT-20');
});

// ==========================================
// 2. CPM ENGINE TESTS
// ==========================================
test('cpmEngine: accurately calculates critical path, total float, and free float on DAG', () => {
  // Graph:
  //      [Act1 (5d)]
  //      /         \
  // [Act2 (8d)]   [Act3 (3d)]  (Parallel: Act2 critical, Act3 has float)
  //      \         /
  //      [Act4 (4d)]
  const baseStart = new Date('2026-10-01T00:00:00Z');
  const baseFinish = new Date('2026-10-20T00:00:00Z');

  const activities: CPMActivityInput[] = [
    {
      id: 'ACT-1',
      name: 'Site Clearance',
      durationDays: 5,
      baselineStart: baseStart,
      baselineFinish: new Date('2026-10-06T00:00:00Z'),
    },
    {
      id: 'ACT-2',
      name: 'Main Trenching (Long path)',
      durationDays: 8,
      baselineStart: new Date('2026-10-06T00:00:00Z'),
      baselineFinish: new Date('2026-10-14T00:00:00Z'),
    },
    {
      id: 'ACT-3',
      name: 'Survey Marker Placement (Short path)',
      durationDays: 3,
      baselineStart: new Date('2026-10-06T00:00:00Z'),
      baselineFinish: new Date('2026-10-09T00:00:00Z'),
    },
    {
      id: 'ACT-4',
      name: 'Pipe Lowering',
      durationDays: 4,
      baselineStart: new Date('2026-10-14T00:00:00Z'),
      baselineFinish: new Date('2026-10-18T00:00:00Z'),
    },
  ];

  const dependencies: CPMDependencyInput[] = [
    { predecessorId: 'ACT-1', successorId: 'ACT-2', dependencyType: 'FS', lagDays: 0 },
    { predecessorId: 'ACT-1', successorId: 'ACT-3', dependencyType: 'FS', lagDays: 0 },
    { predecessorId: 'ACT-2', successorId: 'ACT-4', dependencyType: 'FS', lagDays: 0 },
    { predecessorId: 'ACT-3', successorId: 'ACT-4', dependencyType: 'FS', lagDays: 0 },
  ];

  const result = calculateCPM(activities, dependencies, baseFinish);

  // Total critical duration: ACT-1 (5) + ACT-2 (8) + ACT-4 (4) = 17 days
  assert.ok(result.criticalPath.includes('ACT-1'));
  assert.ok(result.criticalPath.includes('ACT-2'));
  assert.ok(result.criticalPath.includes('ACT-4'));
  assert.ok(!result.criticalPath.includes('ACT-3'));

  const act3 = result.activities.get('ACT-3');
  assert.ok(act3);
  // Float for ACT-3: Path 17d vs (5 + 3 + 4 = 12d) -> Total Float = 5 days
  assert.equal(act3.totalFloatDays, 5);
  assert.equal(act3.freeFloatDays, 5);
  assert.equal(act3.isCriticalPath, false);

  const act2 = result.activities.get('ACT-2');
  assert.ok(act2);
  assert.equal(act2.totalFloatDays, 0);
  assert.equal(act2.isCriticalPath, true);
});

test('cpmEngine: detects milestone slips and generates resource reallocations', () => {
  const baseStart = new Date('2026-10-01T00:00:00Z');
  // Baseline contract finish was Day 10
  const baselineFinish = new Date('2026-10-10T00:00:00Z');

  const activities: CPMActivityInput[] = [
    {
      id: 'ACT-A',
      name: 'Critical Foundation Welding',
      durationDays: 14, // Causes slip beyond Day 10
      baselineStart: baseStart,
      baselineFinish: new Date('2026-10-08T00:00:00Z'),
    },
    {
      id: 'ACT-B',
      name: 'Non-Critical Signage Painting',
      durationDays: 2,
      baselineStart: baseStart,
      baselineFinish: new Date('2026-10-03T00:00:00Z'),
    },
  ];

  const result = calculateCPM(activities, [], baselineFinish);

  assert.ok(result.criticalPathSlipDays >= 4);
  assert.ok(result.delayedMilestones.length > 0);
  assert.ok(result.mitigationRecommendations.length > 0);
  assert.equal(result.mitigationRecommendations[0]?.criticalActivityId, 'ACT-A');
});

// ==========================================
// 3. SEMANTIC MATCHER TESTS
// ==========================================
test('semanticMatcher: routes ground-truth field notes to correct confidence tiers', () => {
  const candidates: SemanticCandidate[] = [
    {
      id: 'uuid-1',
      activityCode: 'ACT-PIPING-24',
      name: 'Erect and Spool Line 24-XX Hydrotest',
      wbsPath: 'Oil Gathering Station 3 > Area B > Piping',
      discipline: 'Piping',
    },
    {
      id: 'uuid-2',
      activityCode: 'ACT-CIVIL-01',
      name: 'Excavation of Trench Pad 04',
      wbsPath: 'Oil Gathering Station 3 > Civil Works',
      discipline: 'Civil',
    },
    {
      id: 'uuid-3',
      activityCode: 'ACT-ELEC-88',
      name: 'Transformer Substation Cable Pulling',
      wbsPath: 'Electrical Substation > Cabling',
      discipline: 'Electrical',
    },
  ];

  // Tier 1 Test: Exact domain keywords -> Auto Match (>= 0.85)
  const tier1Input = 'Erect and Spool Line 24-XX Hydrotest completed on schedule';
  const tier1Result = matchFieldEventToActivities(tier1Input, candidates);
  assert.equal(tier1Result.status, 'AUTO_MATCHED');
  assert.ok(tier1Result.confidenceScore >= 0.85);
  assert.equal(tier1Result.topCandidate?.activityCode, 'ACT-PIPING-24');

  // Tier 2 Test: Partial/ambiguous keywords -> Reviewer Queue (0.60 to 0.84)
  const tier2Input = 'Line 24 pipeline pipe erection ongoing';
  const tier2Result = matchFieldEventToActivities(tier2Input, candidates);
  assert.equal(tier2Result.status, 'PENDING_REVIEW');
  assert.ok(tier2Result.confidenceScore >= 0.60 && tier2Result.confidenceScore < 0.85);
  assert.equal(tier2Result.topCandidate?.activityCode, 'ACT-PIPING-24');
  assert.ok(tier2Result.alternateCandidates.length >= 1);

  // Tier 3 Test: Completely unrelated note -> Unmatched (< 0.60)
  const tier3Input = 'Canteen food supply delivered to camp mess';
  const tier3Result = matchFieldEventToActivities(tier3Input, candidates);
  assert.equal(tier3Result.status, 'UNMATCHED');
  assert.ok(tier3Result.confidenceScore < 0.60);
});

test('semanticMatcher: extracts progress delta and vector similarity', () => {
  assert.equal(extractProgressDelta('Erected spool line 24, completed 75%'), 75);
  assert.equal(extractProgressDelta('Hydrotest finished for line'), 100);
  assert.equal(extractProgressDelta('Excavation started today'), 20);

  // Test dense cosine similarity
  const vec1 = [1, 0, 1];
  const vec2 = [1, 0, 1];
  assert.equal(Math.round(cosineSimilarityDense(vec1, vec2) * 100) / 100, 1.0);
});

// ==========================================
// 4. CAUSAL SYNC GATEWAY TESTS
// ==========================================
test('causalSync: reorders outbox events monotonically and detects tampering', () => {
  const events: RawFieldEventInput[] = [
    // Device 1: Arrived out of sequence order in network batch
    {
      clientEventId: 'ev-3',
      deviceId: 'dev-alpha',
      supervisorId: 'sup-1',
      sourceType: 'MOBILE_VOICE',
      rawText: 'Third event from alpha',
      eventTimestampHw: '2026-10-01T10:30:00Z',
      monotonicSeq: 3,
    },
    {
      clientEventId: 'ev-1',
      deviceId: 'dev-alpha',
      supervisorId: 'sup-1',
      sourceType: 'MOBILE_FORM',
      rawText: 'First event from alpha',
      eventTimestampHw: '2026-10-01T10:10:00Z',
      monotonicSeq: 1,
    },
    {
      clientEventId: 'ev-2',
      deviceId: 'dev-alpha',
      supervisorId: 'sup-1',
      sourceType: 'MOBILE_FORM',
      rawText: 'Second event from alpha',
      eventTimestampHw: '2026-10-01T10:20:00Z',
      monotonicSeq: 2,
    },
    // Device 2: Clock was manually rolled back (tampering test)
    {
      clientEventId: 'ev-b1',
      deviceId: 'dev-beta',
      supervisorId: 'sup-2',
      sourceType: 'MOBILE_VOICE',
      rawText: 'Beta seq 1',
      eventTimestampHw: '2026-10-01T10:15:00Z',
      monotonicSeq: 101,
    },
    {
      clientEventId: 'ev-b2',
      deviceId: 'dev-beta',
      supervisorId: 'sup-2',
      sourceType: 'MOBILE_VOICE',
      rawText: 'Beta seq 2 (Clock jumped back 2 hours)',
      eventTimestampHw: '2026-10-01T08:15:00Z', // Tampered!
      monotonicSeq: 102,
    },
    // Duplicate test: Duplicate of ev-1
    {
      clientEventId: 'ev-1',
      deviceId: 'dev-alpha',
      supervisorId: 'sup-1',
      sourceType: 'MOBILE_FORM',
      rawText: 'Duplicate of first event',
      eventTimestampHw: '2026-10-01T10:10:00Z',
      monotonicSeq: 1,
    },
  ];

  const { reconciled, deduplicatedCount, tamperedCount } = reconcileFieldEventsCausally(events);

  // 1 duplicate filtered out
  assert.equal(deduplicatedCount, 1);
  assert.equal(reconciled.length, 5);

  // 1 tampered clock detected on dev-beta
  assert.equal(tamperedCount, 1);
  const tamperedEv = reconciled.find(e => e.deviceId === 'dev-beta' && e.monotonicSeq === 102);
  assert.ok(tamperedEv?.isClockTampered);

  // Device alpha events must be strictly sorted by monotonicSeq (1 -> 2 -> 3)
  const alphaOrders = reconciled
    .filter(e => e.deviceId === 'dev-alpha')
    .map(e => e.monotonicSeq);
  assert.deepEqual(alphaOrders, [1, 2, 3]);

  // Global causal order must be monotonically increasing (1n, 2n, 3n, 4n, 5n)
  for (let i = 0; i < reconciled.length; i++) {
    assert.equal(reconciled[i]?.reconciledCausalOrder, BigInt(i + 1));
  }
});

test('causalSync: processFieldEventsBatch performs end-to-end reconciliation and semantic routing', () => {
  const candidates: SemanticCandidate[] = [
    {
      id: 'act-1',
      activityCode: 'ACT-WELD-01',
      name: 'Tie-in Welding at Valve Station 4',
      wbsPath: 'Pipeline > Welding',
      discipline: 'Piping',
    },
  ];

  const batch: RawFieldEventInput[] = [
    {
      clientEventId: 'c1',
      deviceId: 'phone-01',
      supervisorId: 'sup-1',
      sourceType: 'MOBILE_VOICE',
      rawText: 'Tie-in Welding at Valve Station 4 completed 100%',
      eventTimestampHw: '2026-10-01T12:00:00Z',
      monotonicSeq: 1,
    },
  ];

  const result = processFieldEventsBatch(batch, candidates);

  assert.equal(result.reconciledEvents.length, 1);
  assert.equal(result.autoMatchedCount, 1);
  assert.equal(result.processedItems[0]?.proposedProgressDelta, 100);
  assert.equal(result.processedItems[0]?.match.status, 'AUTO_MATCHED');
});

// ==========================================
// 5. PRIMAVERA P6 .XER EXPORT WRITE-BACK TESTS
// ==========================================
test('xerExporter: generates valid P6 .XER file that parses cleanly back with updated actuals', () => {
  const exported = generatePrimaveraXER({
    projectCode: 'OIL-ASSAM-EXP-2026',
    projectName: 'Assam Pipeline Export Test',
    plannedStartDate: new Date('2026-10-01T08:00:00Z'),
    plannedFinishDate: new Date('2026-10-30T17:00:00Z'),
    activities: [
      {
        activityCode: 'ACT-EXP-01',
        name: 'Hydrotest Segment 4',
        wbsPath: 'Oil Project > Testing',
        plannedDurationDays: 5,
        plannedStart: new Date('2026-10-01T08:00:00Z'),
        plannedFinish: new Date('2026-10-06T17:00:00Z'),
        actualStart: new Date('2026-10-01T08:00:00Z'),
        actualFinish: new Date('2026-10-05T17:00:00Z'),
        percentComplete: 100,
        isCriticalPath: true,
      },
      {
        activityCode: 'ACT-EXP-02',
        name: 'Tie-in Joint Valve 4',
        wbsPath: 'Oil Project > Piping',
        plannedDurationDays: 3,
        plannedStart: new Date('2026-10-07T08:00:00Z'),
        plannedFinish: new Date('2026-10-10T17:00:00Z'),
        percentComplete: 20,
        isCriticalPath: false,
      },
    ],
    dependencies: [
      {
        predecessorCode: 'ACT-EXP-01',
        successorCode: 'ACT-EXP-02',
        dependencyType: 'FS',
        lagDays: 0,
      },
    ],
  });

  assert.ok(exported.includes('%T\tPROJECT'));
  assert.ok(exported.includes('%T\tTASK'));
  assert.ok(exported.includes('%T\tTASKPRED'));
  assert.ok(exported.includes('OIL-ASSAM-EXP-2026'));
  assert.ok(exported.includes('TK_Complete'));

  // Round-trip verification: re-parse with parsePrimaveraXER
  const reParsed = parsePrimaveraXER(exported);
  assert.equal(reParsed.project.code, 'OIL-ASSAM-EXP-2026');
  assert.equal(reParsed.activities.length, 2);
  const act1 = reParsed.activities.find(a => a.activityCode === 'ACT-EXP-01');
  assert.ok(act1);
  assert.equal(act1.name, 'Hydrotest Segment 4');
  assert.equal(act1.percentComplete, 100);
  assert.equal(reParsed.dependencies.length, 1);
  assert.equal(reParsed.dependencies[0]?.predecessorId, 'ACT-EXP-01');
  assert.equal(reParsed.dependencies[0]?.successorId, 'ACT-EXP-02');
});

