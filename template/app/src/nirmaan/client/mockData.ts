// ponytail: Curated Oil India Limited baseline data for robust presentation & testing.

export interface MockProject {
  id: string;
  code: string;
  name: string;
  description: string;
  plannedStartDate: string;
  plannedFinishDate: string;
  currentForecastFinishDate: string;
  criticalPathDelayDays: number;
  status: 'GREEN' | 'AMBER' | 'RED';
  activitiesCount: number;
  fieldEventsCount: number;
}

export interface MockActivity {
  id: string;
  projectId: string;
  activityCode: string;
  name: string;
  wbsPath: string;
  discipline: 'Piping' | 'Civil' | 'Electrical' | 'Instrumentation';
  plannedDurationDays: number;
  plannedStart: string;
  plannedFinish: string;
  actualStart?: string | null;
  actualFinish?: string | null;
  percentComplete: number;
  totalFloatDays: number;
  freeFloatDays: number;
  isCriticalPath: boolean;
  predecessorCodes?: string[];
}

export interface MockDependency {
  id: string;
  predecessorId: string;
  successorId: string;
  predecessor: { id: string; activityCode: string; name: string };
  successor: { id: string; activityCode: string; name: string };
  dependencyType: 'FS' | 'SS' | 'FF' | 'SF';
  lagDays: number;
}

export interface MockDelayPrediction {
  id: string;
  projectId: string;
  criticalPathSlipDays: number;
  affectedMilestoneName: string;
  predictedMilestoneDate: string;
  varianceFromBaselineDays: number;
  primaryRootCause: string;
  mitigationRecommendations: Array<{
    strategy: string;
    recoveredDays: number;
    costImpact: string;
  }>;
}

export interface MockReviewerItem {
  id: string;
  fieldEventId: string;
  fieldEvent: {
    id: string;
    clientEventId: string;
    deviceId: string;
    sourceType: 'MOBILE_VOICE' | 'MOBILE_FORM' | 'EXCEL_DPR';
    rawText: string;
    audioRecordingUrl?: string | null;
    eventTimestampHw: string;
    monotonicSeq: number;
    supervisor: {
      id: string;
      username: string;
      email: string;
    };
  };
  topCandidate: {
    id: string;
    activityCode: string;
    name: string;
    wbsPath: string;
    discipline: string;
    percentComplete: number;
  };
  candidateSimilarityScore: number;
  alternateCandidates: Array<{
    activityId: string;
    code: string;
    name: string;
    score: number;
  }>;
  matchRationale: string;
  progressDeltaPercent: number;
  resolution?: string | null;
}

export interface MockBenchmark {
  id: string;
  historicalProjectCode: string;
  discipline: string;
  workType: string;
  plannedDurationDays: number;
  actualDurationDays: number;
  variancePercentage: number;
  recordedDelays: Array<{ cause: string; days: number }>;
}

export const INITIAL_PROJECTS: MockProject[] = [
  {
    id: 'proj-oil-assam-01',
    code: 'OIL-ASSAM-PL-2026',
    name: 'Duliajan to Numaligarh 132km Crude Pipeline Sec-IV',
    description: 'High-pressure 16-inch API 5L cross-country oil transmission pipeline traversing Dibrugarh and Golaghat districts.',
    plannedStartDate: '2026-01-15T00:00:00.000Z',
    plannedFinishDate: '2026-11-30T00:00:00.000Z',
    currentForecastFinishDate: '2026-12-18T00:00:00.000Z',
    criticalPathDelayDays: 18.5,
    status: 'RED',
    activitiesCount: 12,
    fieldEventsCount: 42,
  },
  {
    id: 'proj-oil-digboi-02',
    code: 'OIL-DIGBOI-REV-2026',
    name: 'Digboi Refinery Modernization & Desalter Unit-3',
    description: 'Crude distillation unit revamp and replacement of electrostatic desalter grid.',
    plannedStartDate: '2026-02-01T00:00:00.000Z',
    plannedFinishDate: '2026-09-15T00:00:00.000Z',
    currentForecastFinishDate: '2026-09-18T00:00:00.000Z',
    criticalPathDelayDays: 3.0,
    status: 'AMBER',
    activitiesCount: 8,
    fieldEventsCount: 19,
  },
  {
    id: 'proj-oil-jorhat-03',
    code: 'OIL-JORHAT-COMP-2026',
    name: 'Jorhat Gas Gathering Station & Compressor Expansion',
    description: 'Installation of 2x reciprocating natural gas compressors and high-pressure manifold.',
    plannedStartDate: '2026-03-01T00:00:00.000Z',
    plannedFinishDate: '2026-10-31T00:00:00.000Z',
    currentForecastFinishDate: '2026-10-31T00:00:00.000Z',
    criticalPathDelayDays: 0.0,
    status: 'GREEN',
    activitiesCount: 10,
    fieldEventsCount: 26,
  },
];

export const INITIAL_ACTIVITIES: MockActivity[] = [
  {
    id: 'act-01',
    projectId: 'proj-oil-assam-01',
    activityCode: 'ACT-ROW-01',
    name: 'Right of Way Clearing & Grading Km 0-35',
    wbsPath: 'Pipeline > Unit 01 > Civil RoW',
    discipline: 'Civil',
    plannedDurationDays: 30,
    plannedStart: '2026-01-15T00:00:00.000Z',
    plannedFinish: '2026-02-14T00:00:00.000Z',
    actualStart: '2026-01-15T00:00:00.000Z',
    actualFinish: '2026-02-13T00:00:00.000Z',
    percentComplete: 100,
    totalFloatDays: 14,
    freeFloatDays: 0,
    isCriticalPath: false,
  },
  {
    id: 'act-02',
    projectId: 'proj-oil-assam-01',
    activityCode: 'ACT-TR-02',
    name: 'Mainline Trenching & Bedding Km 0-35',
    wbsPath: 'Pipeline > Unit 01 > Trenching',
    discipline: 'Civil',
    plannedDurationDays: 45,
    plannedStart: '2026-02-01T00:00:00.000Z',
    plannedFinish: '2026-03-17T00:00:00.000Z',
    actualStart: '2026-02-01T00:00:00.000Z',
    actualFinish: null,
    percentComplete: 95,
    totalFloatDays: 8,
    freeFloatDays: 0,
    isCriticalPath: false,
    predecessorCodes: ['ACT-ROW-01'],
  },
  {
    id: 'act-03',
    projectId: 'proj-oil-assam-01',
    activityCode: 'ACT-STR-03',
    name: 'Pipe Stringing & Bending 16-inch API 5L',
    wbsPath: 'Pipeline > Unit 02 > Piping',
    discipline: 'Piping',
    plannedDurationDays: 40,
    plannedStart: '2026-02-15T00:00:00.000Z',
    plannedFinish: '2026-03-26T00:00:00.000Z',
    actualStart: '2026-02-16T00:00:00.000Z',
    actualFinish: null,
    percentComplete: 90,
    totalFloatDays: 5,
    freeFloatDays: 0,
    isCriticalPath: false,
    predecessorCodes: ['ACT-TR-02'],
  },
  {
    id: 'act-04',
    projectId: 'proj-oil-assam-01',
    activityCode: 'ACT-WELD-04',
    name: 'Automatic Orbital Welding & NDT Testing',
    wbsPath: 'Pipeline > Unit 02 > Mainline Welding',
    discipline: 'Piping',
    plannedDurationDays: 50,
    plannedStart: '2026-03-01T00:00:00.000Z',
    plannedFinish: '2026-04-19T00:00:00.000Z',
    actualStart: '2026-03-05T00:00:00.000Z',
    actualFinish: null,
    percentComplete: 75,
    totalFloatDays: 0,
    freeFloatDays: 0,
    isCriticalPath: true,
    predecessorCodes: ['ACT-STR-03'],
  },
  {
    id: 'act-05',
    projectId: 'proj-oil-assam-01',
    activityCode: 'ACT-HDD-05',
    name: 'Dihing River Crossing HDD Reaming & Pullback',
    wbsPath: 'Pipeline > Special Crossings > HDD',
    discipline: 'Piping',
    plannedDurationDays: 60,
    plannedStart: '2026-04-01T00:00:00.000Z',
    plannedFinish: '2026-05-30T00:00:00.000Z',
    actualStart: '2026-04-10T00:00:00.000Z',
    actualFinish: null,
    percentComplete: 45,
    totalFloatDays: 0,
    freeFloatDays: 0,
    isCriticalPath: true,
    predecessorCodes: ['ACT-WELD-04'],
  },
  {
    id: 'act-06',
    projectId: 'proj-oil-assam-01',
    activityCode: 'ACT-COAT-06',
    name: 'Field Joint Coating & Holiday Detection',
    wbsPath: 'Pipeline > Unit 03 > Corrosion Protection',
    discipline: 'Piping',
    plannedDurationDays: 35,
    plannedStart: '2026-05-01T00:00:00.000Z',
    plannedFinish: '2026-06-04T00:00:00.000Z',
    actualStart: '2026-05-05T00:00:00.000Z',
    actualFinish: null,
    percentComplete: 60,
    totalFloatDays: 12,
    freeFloatDays: 4,
    isCriticalPath: false,
    predecessorCodes: ['ACT-WELD-04'],
  },
  {
    id: 'act-07',
    projectId: 'proj-oil-assam-01',
    activityCode: 'ACT-LOW-07',
    name: 'Lowering-in & Tie-in Operations Sec-IV',
    wbsPath: 'Pipeline > Unit 03 > Tie-in',
    discipline: 'Piping',
    plannedDurationDays: 45,
    plannedStart: '2026-06-01T00:00:00.000Z',
    plannedFinish: '2026-07-15T00:00:00.000Z',
    actualStart: null,
    actualFinish: null,
    percentComplete: 30,
    totalFloatDays: 0,
    freeFloatDays: 0,
    isCriticalPath: true,
    predecessorCodes: ['ACT-HDD-05', 'ACT-COAT-06'],
  },
  {
    id: 'act-08',
    projectId: 'proj-oil-assam-01',
    activityCode: 'ACT-BACK-08',
    name: 'Trench Backfilling & Reinstatement',
    wbsPath: 'Pipeline > Unit 03 > Civil Reinstatement',
    discipline: 'Civil',
    plannedDurationDays: 40,
    plannedStart: '2026-07-01T00:00:00.000Z',
    plannedFinish: '2026-08-09T00:00:00.000Z',
    actualStart: null,
    actualFinish: null,
    percentComplete: 20,
    totalFloatDays: 15,
    freeFloatDays: 5,
    isCriticalPath: false,
    predecessorCodes: ['ACT-LOW-07'],
  },
  {
    id: 'act-09',
    projectId: 'proj-oil-assam-01',
    activityCode: 'ACT-CATH-09',
    name: 'Impressed Current Cathodic Protection Setup',
    wbsPath: 'Pipeline > Ancillary > CP System',
    discipline: 'Electrical',
    plannedDurationDays: 30,
    plannedStart: '2026-08-01T00:00:00.000Z',
    plannedFinish: '2026-08-30T00:00:00.000Z',
    actualStart: null,
    actualFinish: null,
    percentComplete: 15,
    totalFloatDays: 20,
    freeFloatDays: 10,
    isCriticalPath: false,
    predecessorCodes: ['ACT-LOW-07'],
  },
  {
    id: 'act-10',
    projectId: 'proj-oil-assam-01',
    activityCode: 'ACT-SCADA-10',
    name: 'OFC Telecom & Leak Detection Fiber Pulling',
    wbsPath: 'Pipeline > Instrumentation > SCADA',
    discipline: 'Instrumentation',
    plannedDurationDays: 35,
    plannedStart: '2026-08-15T00:00:00.000Z',
    plannedFinish: '2026-09-18T00:00:00.000Z',
    actualStart: null,
    actualFinish: null,
    percentComplete: 10,
    totalFloatDays: 15,
    freeFloatDays: 5,
    isCriticalPath: false,
    predecessorCodes: ['ACT-BACK-08'],
  },
  {
    id: 'act-11',
    projectId: 'proj-oil-assam-01',
    activityCode: 'ACT-HT-11',
    name: 'Hydrostatic Pressure Testing 100 Bar 24-hr',
    wbsPath: 'Pipeline > Pre-Commissioning > Hydrotest',
    discipline: 'Piping',
    plannedDurationDays: 30,
    plannedStart: '2026-09-20T00:00:00.000Z',
    plannedFinish: '2026-10-19T00:00:00.000Z',
    actualStart: null,
    actualFinish: null,
    percentComplete: 0,
    totalFloatDays: 0,
    freeFloatDays: 0,
    isCriticalPath: true,
    predecessorCodes: ['ACT-LOW-07', 'ACT-SCADA-10'],
  },
  {
    id: 'act-12',
    projectId: 'proj-oil-assam-01',
    activityCode: 'ACT-COMM-12',
    name: 'Pre-Commissioning Nitrogen Purging & Handover',
    wbsPath: 'Pipeline > Commissioning > Handover',
    discipline: 'Piping',
    plannedDurationDays: 42,
    plannedStart: '2026-10-20T00:00:00.000Z',
    plannedFinish: '2026-11-30T00:00:00.000Z',
    actualStart: null,
    actualFinish: null,
    percentComplete: 0,
    totalFloatDays: 0,
    freeFloatDays: 0,
    isCriticalPath: true,
    predecessorCodes: ['ACT-HT-11'],
  },
];

export const INITIAL_PREDICTIONS: MockDelayPrediction[] = [
  {
    id: 'pred-01',
    projectId: 'proj-oil-assam-01',
    criticalPathSlipDays: 18.5,
    affectedMilestoneName: 'Pre-Commissioning Nitrogen Purging & Handover (ACT-COMM-12)',
    predictedMilestoneDate: '2026-12-18T00:00:00.000Z',
    varianceFromBaselineDays: 18.5,
    primaryRootCause:
      'Bottleneck in Dihing River HDD Crossing (ACT-HDD-05): dense gravel strata encountered at depth 18m and high mud pressure, delaying reamer pullback by 14 days with downstream cascade on tie-ins.',
    mitigationRecommendations: [
      {
        strategy: 'Deploy secondary dual-rig crew on south bank for parallel pilot reaming',
        recoveredDays: 8.5,
        costImpact: 'Moderate (+₹4.2 Lakh)',
      },
      {
        strategy: 'Pre-fabricate and pre-test tie-in spools offsite at Duliajan fabrication yard',
        recoveredDays: 6.0,
        costImpact: 'Low (+₹1.8 Lakh)',
      },
      {
        strategy: 'Transition orbital welding shifts from 10-hr to 24-hr dual-welder rotation',
        recoveredDays: 4.0,
        costImpact: 'Low (+₹2.1 Lakh)',
      },
    ],
  },
];

export const INITIAL_QUEUE_ITEMS: MockReviewerItem[] = [
  {
    id: 'queue-01',
    fieldEventId: 'evt-01',
    fieldEvent: {
      id: 'evt-01',
      clientEventId: 'cl-evt-1042',
      deviceId: 'OIL-FIELD-TAB-04',
      sourceType: 'MOBILE_VOICE',
      rawText:
        'Completed 90 meters of 16-inch pipe stringing and cold bending between Dihing River approach and Km 38. Soil wet due to morning rain. 3 cold bends passed ovality check.',
      audioRecordingUrl: '/audio/sample_supervisor_note_1.mp3',
      eventTimestampHw: '2026-09-26T14:15:22.000Z',
      monotonicSeq: 1042,
      supervisor: {
        id: 'user-01',
        username: 'Bikash Gogoi',
        email: 'bikash.gogoi@oilindia.in',
      },
    },
    topCandidate: {
      id: 'act-03',
      activityCode: 'ACT-STR-03',
      name: 'Pipe Stringing & Bending 16-inch API 5L',
      wbsPath: 'Pipeline > Unit 02 > Piping',
      discipline: 'Piping',
      percentComplete: 90,
    },
    candidateSimilarityScore: 0.848,
    alternateCandidates: [
      {
        activityId: 'act-04',
        code: 'ACT-WELD-04',
        name: 'Automatic Orbital Welding & NDT Testing',
        score: 0.682,
      },
      {
        activityId: 'act-02',
        code: 'ACT-TR-02',
        name: 'Mainline Trenching & Bedding Km 0-35',
        score: 0.541,
      },
    ],
    matchRationale:
      'High semantic affinity with stringing/bending. Ingested tokens "16-inch", "stringing", "cold bending", "Km 38" match ACT-STR-03 embedding keywords.',
    progressDeltaPercent: 90,
    resolution: null,
  },
  {
    id: 'queue-02',
    fieldEventId: 'evt-02',
    fieldEvent: {
      id: 'evt-02',
      clientEventId: 'cl-evt-921',
      deviceId: 'OIL-FIELD-TAB-07',
      sourceType: 'MOBILE_FORM',
      rawText:
        'Dihing River crossing HDD 28-inch pilot hole reaming advanced by 45 meters. Encountered dense boulder gravel stratum at depth 18m. Mud pressure elevated to 65 psi. Bentonite slurry adjusted.',
      audioRecordingUrl: null,
      eventTimestampHw: '2026-09-26T15:40:10.000Z',
      monotonicSeq: 921,
      supervisor: {
        id: 'user-02',
        username: 'Arunav Sharma',
        email: 'arunav.sharma@oilindia.in',
      },
    },
    topCandidate: {
      id: 'act-05',
      activityCode: 'ACT-HDD-05',
      name: 'Dihing River Crossing HDD Reaming & Pullback',
      wbsPath: 'Pipeline > Special Crossings > HDD',
      discipline: 'Piping',
      percentComplete: 45,
    },
    candidateSimilarityScore: 0.885,
    alternateCandidates: [
      {
        activityId: 'act-02',
        code: 'ACT-TR-02',
        name: 'Mainline Trenching & Bedding Km 0-35',
        score: 0.523,
      },
    ],
    matchRationale:
      'Exact technical alignment with HDD crossing reaming operations. Key terms "Dihing River", "HDD", "28-inch pilot hole", "reaming" match ACT-HDD-05.',
    progressDeltaPercent: 50,
    resolution: null,
  },
  {
    id: 'queue-03',
    fieldEventId: 'evt-03',
    fieldEvent: {
      id: 'evt-03',
      clientEventId: 'cl-evt-1105',
      deviceId: 'OIL-FIELD-TAB-02',
      sourceType: 'EXCEL_DPR',
      rawText:
        'Radiographic testing (RT) completed on 14 butt welds at Section 4 tie-in. 13 joints accepted, 1 weld repair required on joint #42-W-18 (porosity defect). Repair gouging scheduled for tomorrow.',
      audioRecordingUrl: null,
      eventTimestampHw: '2026-09-26T16:12:45.000Z',
      monotonicSeq: 1105,
      supervisor: {
        id: 'user-03',
        username: 'Ratul Barua',
        email: 'ratul.barua@oilindia.in',
      },
    },
    topCandidate: {
      id: 'act-04',
      activityCode: 'ACT-WELD-04',
      name: 'Automatic Orbital Welding & NDT Testing',
      wbsPath: 'Pipeline > Unit 02 > Mainline Welding',
      discipline: 'Piping',
      percentComplete: 75,
    },
    candidateSimilarityScore: 0.792,
    alternateCandidates: [
      {
        activityId: 'act-06',
        code: 'ACT-COAT-06',
        name: 'Field Joint Coating & Holiday Detection',
        score: 0.61,
      },
    ],
    matchRationale:
      'NDT / RT joint testing corresponds directly with ACT-WELD-04 Quality Assurance scope. Welds accepted advance completion to 75%.',
    progressDeltaPercent: 75,
    resolution: null,
  },
];

export const INITIAL_BENCHMARKS: MockBenchmark[] = [
  {
    id: 'bm-01',
    historicalProjectCode: 'OIL-NUMALIGARH-2021',
    discipline: 'Piping',
    workType: 'Cross-Country Pipeline Welding & Hydrotesting',
    plannedDurationDays: 240,
    actualDurationDays: 278,
    variancePercentage: 15.8,
    recordedDelays: [
      { cause: 'Monsoon flash flooding at river tributaries', days: 22 },
      { cause: 'Right-of-Way crop compensation local arbitration', days: 16 },
    ],
  },
  {
    id: 'bm-02',
    historicalProjectCode: 'OIL-DULIAJAN-EXP-2023',
    discipline: 'Civil',
    workType: 'Heavy Equipment Foundation & Piling',
    plannedDurationDays: 180,
    actualDurationDays: 212,
    variancePercentage: 17.8,
    recordedDelays: [
      { cause: 'Unseasonal torrential rainfall in Upper Assam', days: 18 },
      { cause: 'Cement supply logistics delay via NH-37', days: 14 },
    ],
  },
  {
    id: 'bm-03',
    historicalProjectCode: 'OIL-BARAUNI-PL-2019',
    discipline: 'Piping',
    workType: 'Horizontal Directional Drilling (HDD) River Crossing',
    plannedDurationDays: 120,
    actualDurationDays: 165,
    variancePercentage: 37.5,
    recordedDelays: [
      { cause: 'Subsurface boulder strata causing borehole collapse', days: 35 },
      { cause: 'Mud motor mechanical failure & replacement from Kolkata', days: 10 },
    ],
  },
  {
    id: 'bm-04',
    historicalProjectCode: 'OIL-SIBSAGAR-ELEC-2024',
    discipline: 'Electrical',
    workType: 'Transformer & 33kV Switchgear HT Cabling',
    plannedDurationDays: 90,
    actualDurationDays: 98,
    variancePercentage: 8.9,
    recordedDelays: [
      { cause: 'Port clearance delay for imported SF6 switchgear breaker', days: 8 },
    ],
  },
  {
    id: 'bm-05',
    historicalProjectCode: 'OIL-JORHAT-INST-2023',
    discipline: 'Instrumentation',
    workType: 'OFC SCADA Network & Leak Detection Integration',
    plannedDurationDays: 110,
    actualDurationDays: 104,
    variancePercentage: -5.5,
    recordedDelays: [
      { cause: 'Zero critical path delays; dry season execution completed early', days: 0 },
    ],
  },
];
