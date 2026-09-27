import { routes } from "wasp/client/router";
import type { NavigationItem } from "./NavBar";

export const nirmaanNavigationItems: NavigationItem[] = [
  { name: "Projects", to: "/projects" },
  { name: "CPM Schedule & Gantt", to: "/projects/proj-oil-assam-01" },
  { name: "Reviewer Queue", to: "/reviewer-queue" },
  { name: "Field Logger PWA", to: "/field-log" },
  { name: "Historical Benchmarks", to: "/knowledge-base" },
];

export const marketingNavigationItems: NavigationItem[] = [
  { name: "Features", to: "/#features" },
  ...nirmaanNavigationItems,
] as const;

export const demoNavigationitems: NavigationItem[] = [
  ...nirmaanNavigationItems,
] as const;

