import { action, page, query, route, type Spec } from "@wasp.sh/spec";

// Pages
import { ProjectsDashboardPage } from "./client/pages/ProjectsDashboardPage" with { type: "ref" };
import { ProjectDetailsPage } from "./client/pages/ProjectDetailsPage" with { type: "ref" };
import { ReviewerQueuePage } from "./client/pages/ReviewerQueuePage" with { type: "ref" };
import { FieldLogPage } from "./client/pages/FieldLogPage" with { type: "ref" };
import { KnowledgeBasePage } from "./client/pages/KnowledgeBasePage" with { type: "ref" };

// Operations
import {
  getProjects,
  getProjectDetails,
  getReviewerQueue,
  getDelayPredictions,
  getHistoricalBenchmarks,
  uploadScheduleBaseline,
  syncFieldEventsBatch,
  resolveReviewerItem,
  triggerCPMRecalculation,
  exportPrimaveraXER,
} from "./server/operations" with { type: "ref" };

export const nirmaanSpec: Spec = [
  // Routes & Pages
  route("ProjectsRoute", "/projects", page(ProjectsDashboardPage, { authRequired: true })),
  route("ProjectDetailsRoute", "/projects/:projectId", page(ProjectDetailsPage, { authRequired: true })),
  route("ReviewerQueueRoute", "/reviewer-queue", page(ReviewerQueuePage, { authRequired: true })),
  route("FieldLogRoute", "/field-log", page(FieldLogPage, { authRequired: true })),
  route("KnowledgeBaseRoute", "/knowledge-base", page(KnowledgeBasePage, { authRequired: true })),

  // Queries
  query(getProjects, { entities: ["Project"] }),
  query(getProjectDetails, { entities: ["Project", "BaselineActivity", "ActivityDependency", "DelayPrediction"] }),
  query(getReviewerQueue, { entities: ["ReviewerQueueItem", "FieldEvent", "BaselineActivity", "User"] }),
  query(getDelayPredictions, { entities: ["DelayPrediction", "Project"] }),
  query(getHistoricalBenchmarks, { entities: ["ClosedProjectBenchmark"] }),

  // Actions
  action(uploadScheduleBaseline, { entities: ["Project", "BaselineActivity", "ActivityDependency"] }),
  action(syncFieldEventsBatch, { entities: ["FieldEvent", "BaselineActivity", "ReviewerQueueItem", "Project", "User"] }),
  action(resolveReviewerItem, { entities: ["ReviewerQueueItem", "BaselineActivity", "FieldEvent", "User"] }),
  action(triggerCPMRecalculation, { entities: ["Project", "BaselineActivity", "ActivityDependency", "DelayPrediction"] }),
  action(exportPrimaveraXER, { entities: ["Project", "BaselineActivity", "ActivityDependency"] }),
];
