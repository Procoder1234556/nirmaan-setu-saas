import { faker } from "@faker-js/faker";
import type { PrismaClient } from "@prisma/client";
import { type User } from "wasp/entities";
import {
  getSubscriptionPaymentPlanIds,
  SubscriptionStatus,
} from "../../payment/plans";

type MockUserData = Partial<Omit<User, "id">>;

/**
 * This function, which we've imported in `app.db.seeds` in the `main.wasp` file,
 * seeds the database with mock users via the `wasp db seed` command.
 * For more info see: https://wasp.sh/docs/data-model/backends#seeding-the-database
 */
export async function seedMockUsers(prismaClient: PrismaClient) {
  await Promise.all(
    generateMockUsersData(50).map((data) => prismaClient.user.create({ data })),
  );
}

/**
 * Seeds authentic Oil India Limited baseline schedules, activities, field logs,
 * delay predictions, and historical benchmarks for Nirmaan Setu.
 */
export async function seedNirmaanSetu(prismaClient: PrismaClient) {
  // 1. Seed or Upsert Key Personnel Users
  await prismaClient.user.upsert({
    where: { username: "supervisor_dibrugarh" },
    update: {},
    create: {
      email: "supervisor_oil_dibrugarh@oil.in",
      username: "supervisor_dibrugarh",
      role: "SUPERVISOR",
      department: "Piping",
    },
  });

  await prismaClient.user.upsert({
    where: { username: "planner_duliajan" },
    update: {},
    create: {
      email: "planner_duliajan@oil.in",
      username: "planner_duliajan",
      role: "PLANNER",
      department: "Project Controls",
    },
  });

  // 2. Seed Projects
  const project1 = await prismaClient.project.upsert({
    where: { code: "OIL-ASSAM-PL-2026" },
    update: {},
    create: {
      code: "OIL-ASSAM-PL-2026",
      name: "Duliajan to Numaligarh 132km Crude Pipeline Sec-IV",
      description: "High-pressure 16-inch API 5L cross-country oil transmission pipeline traversing Dibrugarh and Golaghat districts.",
      plannedStartDate: new Date("2026-01-15T00:00:00.000Z"),
      plannedFinishDate: new Date("2026-11-30T00:00:00.000Z"),
      currentForecastFinishDate: new Date("2026-12-18T00:00:00.000Z"),
      criticalPathDelayDays: 18.5,
    },
  });

  await prismaClient.project.upsert({
    where: { code: "OIL-NUMALIGARH-REF-24" },
    update: {},
    create: {
      code: "OIL-NUMALIGARH-REF-24",
      name: "Numaligarh Refinery Expansion 68km Feedline",
      description: "Dedicated 18-inch supply trunkline with 3 intermediate automated block valve stations and cathodic protection.",
      plannedStartDate: new Date("2026-03-01T00:00:00.000Z"),
      plannedFinishDate: new Date("2026-10-15T00:00:00.000Z"),
      currentForecastFinishDate: new Date("2026-10-22T00:00:00.000Z"),
      criticalPathDelayDays: 7.0,
    },
  });

  await prismaClient.project.upsert({
    where: { code: "OIL-BARAUNI-HDD-09" },
    update: {},
    create: {
      code: "OIL-BARAUNI-HDD-09",
      name: "Barauni Trunkline Brahmaputra Crossing HDD",
      description: "Specialized 1.8km horizontal directional drilling across the southern alluvial floodplains.",
      plannedStartDate: new Date("2025-11-01T00:00:00.000Z"),
      plannedFinishDate: new Date("2026-06-30T00:00:00.000Z"),
      currentForecastFinishDate: new Date("2026-08-04T00:00:00.000Z"),
      criticalPathDelayDays: 35.0,
    },
  });

  await prismaClient.project.upsert({
    where: { code: "OIL-DULIAJAN-GGS-02" },
    update: {},
    create: {
      code: "OIL-DULIAJAN-GGS-02",
      name: "Duliajan Central Gas Gathering Station Upgrade",
      description: "High-pressure booster compressor manifolds, structural piping, and SCADA tie-in modules.",
      plannedStartDate: new Date("2026-02-01T00:00:00.000Z"),
      plannedFinishDate: new Date("2026-09-15T00:00:00.000Z"),
      currentForecastFinishDate: new Date("2026-09-12T00:00:00.000Z"),
      criticalPathDelayDays: 0.0,
    },
  });

  // 3. Baseline Activities for OIL-ASSAM-PL-2026
  const sampleActivities = [
    {
      activityCode: "ACT-ROW-010",
      name: "Survey & Right of Way Clearance (Km 0 to Km 40)",
      wbsPath: "OIL-ASSAM-PL-2026 > Engineering & Right of Way",
      discipline: "Civil",
      plannedDurationDays: 45,
      plannedStart: new Date("2026-01-15T08:00:00Z"),
      plannedFinish: new Date("2026-03-01T17:00:00Z"),
      actualStart: new Date("2026-01-15T08:00:00Z"),
      actualFinish: new Date("2026-02-28T17:00:00Z"),
      percentComplete: 100,
      totalFloatDays: 0,
      freeFloatDays: 0,
      isCriticalPath: true,
    },
    {
      activityCode: "ACT-ROW-020",
      name: "Right of Way Grading & Access Road Prep (Km 40 to Km 90)",
      wbsPath: "OIL-ASSAM-PL-2026 > Engineering & Right of Way",
      discipline: "Civil",
      plannedDurationDays: 50,
      plannedStart: new Date("2026-03-02T08:00:00Z"),
      plannedFinish: new Date("2026-04-20T17:00:00Z"),
      actualStart: new Date("2026-03-05T08:00:00Z"),
      percentComplete: 75,
      totalFloatDays: -12.5,
      freeFloatDays: 0,
      isCriticalPath: true,
    },
    {
      activityCode: "ACT-TR-101",
      name: "Mainline Trenching & Rock Excavation (Km 0 to Km 40)",
      wbsPath: "OIL-ASSAM-PL-2026 > Mainline Trenching & Civil Bedding",
      discipline: "Civil",
      plannedDurationDays: 60,
      plannedStart: new Date("2026-01-25T08:00:00Z"),
      plannedFinish: new Date("2026-03-26T17:00:00Z"),
      actualStart: new Date("2026-01-26T08:00:00Z"),
      actualFinish: new Date("2026-03-24T17:00:00Z"),
      percentComplete: 100,
      totalFloatDays: 8.0,
      freeFloatDays: 8.0,
      isCriticalPath: false,
    },
    {
      activityCode: "ACT-TR-102",
      name: "Ditch Preparation & Fine Sand Padding",
      wbsPath: "OIL-ASSAM-PL-2026 > Mainline Trenching & Civil Bedding",
      discipline: "Civil",
      plannedDurationDays: 40,
      plannedStart: new Date("2026-03-27T08:00:00Z"),
      plannedFinish: new Date("2026-05-06T17:00:00Z"),
      actualStart: new Date("2026-03-28T08:00:00Z"),
      percentComplete: 80,
      totalFloatDays: 4.0,
      freeFloatDays: 4.0,
      isCriticalPath: false,
    },
    {
      activityCode: "ACT-PIPE-201",
      name: "Pipe Stringing & Cold Bending 16-inch API 5L",
      wbsPath: "OIL-ASSAM-PL-2026 > Welding, NDT & Field Joint Coating",
      discipline: "Piping",
      plannedDurationDays: 40,
      plannedStart: new Date("2026-04-21T08:00:00Z"),
      plannedFinish: new Date("2026-05-30T17:00:00Z"),
      actualStart: new Date("2026-04-25T08:00:00Z"),
      percentComplete: 60,
      totalFloatDays: -15.0,
      freeFloatDays: 0,
      isCriticalPath: true,
    },
    {
      activityCode: "ACT-WELD-202",
      name: "Mainline Automatic SMAW/GMAW Welding & NDT Radiography",
      wbsPath: "OIL-ASSAM-PL-2026 > Welding, NDT & Field Joint Coating",
      discipline: "Piping",
      plannedDurationDays: 70,
      plannedStart: new Date("2026-04-26T08:00:00Z"),
      plannedFinish: new Date("2026-07-05T17:00:00Z"),
      actualStart: new Date("2026-05-02T08:00:00Z"),
      percentComplete: 45,
      totalFloatDays: -18.5,
      freeFloatDays: 0,
      isCriticalPath: true,
    },
    {
      activityCode: "ACT-COAT-203",
      name: "Heat Shrink Sleeve Field Joint Coating (3-Layer PE)",
      wbsPath: "OIL-ASSAM-PL-2026 > Welding, NDT & Field Joint Coating",
      discipline: "Piping",
      plannedDurationDays: 35,
      plannedStart: new Date("2026-07-06T08:00:00Z"),
      plannedFinish: new Date("2026-08-09T17:00:00Z"),
      percentComplete: 20,
      totalFloatDays: -18.5,
      freeFloatDays: 0,
      isCriticalPath: true,
    },
    {
      activityCode: "ACT-HDD-301",
      name: "Brahmaputra South Channel HDD Pilot Hole & Reaming",
      wbsPath: "OIL-ASSAM-PL-2026 > Major River Crossings HDD",
      discipline: "Civil",
      plannedDurationDays: 80,
      plannedStart: new Date("2026-04-11T08:00:00Z"),
      plannedFinish: new Date("2026-06-30T17:00:00Z"),
      actualStart: new Date("2026-04-15T08:00:00Z"),
      percentComplete: 35,
      totalFloatDays: -6.0,
      freeFloatDays: 0,
      isCriticalPath: false,
    },
    {
      activityCode: "ACT-HDD-302",
      name: "16-inch Pipeline Pullback across Brahmaputra HDD Crossing",
      wbsPath: "OIL-ASSAM-PL-2026 > Major River Crossings HDD",
      discipline: "Piping",
      plannedDurationDays: 30,
      plannedStart: new Date("2026-07-01T08:00:00Z"),
      plannedFinish: new Date("2026-07-31T17:00:00Z"),
      percentComplete: 0,
      totalFloatDays: -6.0,
      freeFloatDays: 0,
      isCriticalPath: false,
    },
    {
      activityCode: "ACT-LOWER-401",
      name: "Lowering-In, Tie-Ins & Cushion Backfilling",
      wbsPath: "OIL-ASSAM-PL-2026 > Mainline Trenching & Civil Bedding",
      discipline: "Civil",
      plannedDurationDays: 45,
      plannedStart: new Date("2026-08-10T08:00:00Z"),
      plannedFinish: new Date("2026-09-24T17:00:00Z"),
      percentComplete: 0,
      totalFloatDays: -18.5,
      freeFloatDays: 0,
      isCriticalPath: true,
    },
    {
      activityCode: "ACT-HYDRO-501",
      name: "Hydrostatic Pressure Testing & Caliper Pigging (120 bar)",
      wbsPath: "OIL-ASSAM-PL-2026 > Hydrostatic Testing & Pre-Commissioning",
      discipline: "Instrumentation",
      plannedDurationDays: 30,
      plannedStart: new Date("2026-09-25T08:00:00Z"),
      plannedFinish: new Date("2026-10-25T17:00:00Z"),
      percentComplete: 0,
      totalFloatDays: -18.5,
      freeFloatDays: 0,
      isCriticalPath: true,
    },
    {
      activityCode: "ACT-COMM-502",
      name: "Nitrogen Dewatering, Vacuum Drying & Golden Tie-In",
      wbsPath: "OIL-ASSAM-PL-2026 > Hydrostatic Testing & Pre-Commissioning",
      discipline: "Piping",
      plannedDurationDays: 20,
      plannedStart: new Date("2026-10-26T08:00:00Z"),
      plannedFinish: new Date("2026-11-15T17:00:00Z"),
      percentComplete: 0,
      totalFloatDays: -18.5,
      freeFloatDays: 0,
      isCriticalPath: true,
    },
  ];

  for (const act of sampleActivities) {
    await prismaClient.baselineActivity.upsert({
      where: {
        projectId_activityCode: {
          projectId: project1.id,
          activityCode: act.activityCode,
        },
      },
      update: {},
      create: {
        projectId: project1.id,
        ...act,
      },
    });
  }

  // 4. Delay Prediction
  const existingPred = await prismaClient.delayPrediction.findFirst({
    where: { projectId: project1.id },
  });
  if (!existingPred) {
    await prismaClient.delayPrediction.create({
      data: {
        projectId: project1.id,
        criticalPathSlipDays: 18.5,
        affectedMilestoneName: "Hydrostatic Testing & Ready for Commissioning",
        predictedMilestoneDate: new Date("2026-12-18T17:00:00Z"),
        varianceFromBaselineDays: 18.5,
        primaryRootCause: "Heavy monsoon-induced RoW waterlogging between Km 40-90 causing 14-day delay in pipe stringing and cold bending access.",
        mitigationRecommendations: [
          {
            strategy: "Deploy auxiliary track-mounted side-boom crawler and swamp mats at Km 48–62",
            recoveredDays: 8.5,
            costImpact: "₹14,50,000 INR (Contingency budget)",
          },
          {
            strategy: "Accelerate mainline automatic welding via parallel double-jointing crew at Camp 02",
            recoveredDays: 6.0,
            costImpact: "₹8,20,000 INR (Crew overtime)",
          },
          {
            strategy: "Fast-track Section 1 Hydrotest approval with PESO pre-inspection clearance",
            recoveredDays: 4.0,
            costImpact: "₹0 (Administrative acceleration)",
          },
        ],
      },
    });
  }

  // 5. Closed Project Benchmarks
  const benchmarkCount = await prismaClient.closedProjectBenchmark.count();
  if (benchmarkCount === 0) {
    const benchmarks = [
      {
        historicalProjectCode: "OIL-ASSAM-2022-EXP",
        discipline: "Piping",
        workType: "Cross-Country Pipeline Stringing & Welding",
        plannedDurationDays: 120,
        actualDurationDays: 142,
        variancePercentage: 18.3,
        recordedDelays: [
          { cause: "Monsoon flooding across Brahmaputra floodplain", days: 14 },
          { cause: "Delayed delivery of API 5L induction bends", days: 8 },
        ],
      },
      {
        historicalProjectCode: "OIL-DULIAJAN-GGS-2023",
        discipline: "Civil",
        workType: "Gas Gathering Station Foundation & RoW",
        plannedDurationDays: 90,
        actualDurationDays: 99,
        variancePercentage: 10.0,
        recordedDelays: [
          { cause: "Tea garden Right-of-Way boundary dispute", days: 6 },
          { cause: "Heavy unseasonal pre-monsoon showers", days: 3 },
        ],
      },
      {
        historicalProjectCode: "OIL-NUMALIGARH-FEED-21",
        discipline: "Civil",
        workType: "Mainline Trenching & Sand Bedding",
        plannedDurationDays: 100,
        actualDurationDays: 114,
        variancePercentage: 14.0,
        recordedDelays: [
          { cause: "Hard rock strata requiring controlled chemical fracturing", days: 9 },
          { cause: "Labor remobilization following Bihu festival", days: 5 },
        ],
      },
      {
        historicalProjectCode: "OIL-BARAUNI-HDD-2020",
        discipline: "Piping",
        workType: "Horizontal Directional Drilling River Crossing",
        plannedDurationDays: 75,
        actualDurationDays: 98,
        variancePercentage: 30.7,
        recordedDelays: [
          { cause: "Drill string mud circulation loss in coarse gravel bed", days: 15 },
          { cause: "High water velocity during flash surge", days: 8 },
        ],
      },
      {
        historicalProjectCode: "OIL-JORHAT-PL-2024",
        discipline: "Instrumentation",
        workType: "SCADA Fiber Optic & Cathodic Protection Tie-Ins",
        plannedDurationDays: 45,
        actualDurationDays: 48,
        variancePercentage: 6.7,
        recordedDelays: [
          { cause: "Telecom tower fiber splicing splice-box calibration", days: 3 },
        ],
      },
      {
        historicalProjectCode: "OIL-DIGBOI-REVAMP-19",
        discipline: "Piping",
        workType: "Hydrostatic Testing & Nitrogen Inerting",
        plannedDurationDays: 30,
        actualDurationDays: 33,
        variancePercentage: 10.0,
        recordedDelays: [
          { cause: "Test manifold pressure gauge recalibration with NABL lab", days: 3 },
        ],
      },
    ];

    for (const b of benchmarks) {
      await prismaClient.closedProjectBenchmark.create({ data: b });
    }
  }
}

function generateMockUsersData(numOfUsers: number): MockUserData[] {
  return faker.helpers.multiple(generateMockUserData, { count: numOfUsers });
}

function generateMockUserData(): MockUserData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const subscriptionStatus =
    faker.helpers.arrayElement<SubscriptionStatus | null>([
      ...Object.values(SubscriptionStatus),
      null,
    ]);
  const now = new Date();
  const createdAt = faker.date.past({ refDate: now });
  const timePaid = faker.date.between({ from: createdAt, to: now });
  const credits = subscriptionStatus
    ? 0
    : faker.number.int({ min: 0, max: 10 });
  const hasUserPaidOnStripe = !!subscriptionStatus || credits > 3;
  return {
    email: faker.internet.email({ firstName, lastName }),
    username: faker.internet.userName({ firstName, lastName }),
    createdAt,
    isAdmin: false,
    credits,
    subscriptionStatus,
    lemonSqueezyCustomerPortalUrl: null,
    paymentProcessorUserId: hasUserPaidOnStripe
      ? `cus_test_${faker.string.uuid()}`
      : null,
    datePaid: hasUserPaidOnStripe
      ? faker.date.between({ from: createdAt, to: timePaid })
      : null,
    subscriptionPlan: subscriptionStatus
      ? faker.helpers.arrayElement(getSubscriptionPaymentPlanIds())
      : null,
    role: "PLANNER",
    department: "Project Controls",
  };
}
