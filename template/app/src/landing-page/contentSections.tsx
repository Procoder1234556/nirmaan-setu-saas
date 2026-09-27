import daBoiAvatar from "../client/static/da-boi.webp";
import kivo from "../client/static/examples/kivo.webp";
import messync from "../client/static/examples/messync.webp";
import microinfluencerClub from "../client/static/examples/microinfluencers.webp";
import promptpanda from "../client/static/examples/promptpanda.webp";
import reviewradar from "../client/static/examples/reviewradar.webp";
import scribeist from "../client/static/examples/scribeist.webp";
import searchcraft from "../client/static/examples/searchcraft.webp";
import type { GridFeature } from "./components/FeaturesGrid";

export const features: GridFeature[] = [
  {
    name: "Primavera P6 .XER Native Parser",
    description: "In-process TypeScript parsing of PROJWBS, TASK, and TASKPRED tables in <400ms without heavy Python microservices.",
    emoji: "⚡",
    href: "/projects",
    size: "medium",
  },
  {
    name: "In-Process CPM Float & Slip Engine",
    description: "Automated forward and backward pass graph calculations detecting negative total float and predicting milestone slips in real time.",
    emoji: "📐",
    href: "/projects/proj-oil-assam-01",
    size: "medium",
  },
  {
    name: "Causal Monotonic Clock Sorter",
    description: "Cryptographic hardware sequence ordering guaranteeing true physical causality across out-of-order offline batch syncs.",
    emoji: "⏱️",
    href: "/field-log",
    size: "small",
  },
  {
    name: "pgvector Semantic Reconciliation",
    description: "Vector cosine similarity matching frontline field voice notes directly to P6 schedule activities with confidence scoring.",
    emoji: "🧠",
    href: "/reviewer-queue",
    size: "large",
  },
  {
    name: "Human-in-the-Loop Review Queue",
    description: "Rapid planner keyboard triage (A Approve, R Reassign, D Dismiss) for ambiguous field events scoring between 0.60 and 0.84.",
    emoji: "🎯",
    href: "/reviewer-queue",
    size: "large",
  },
  {
    name: "Offline-First Rugged Logger PWA",
    description: "Tactile microphone voice recorder and local outbox designed for remote pipeline Right-of-Way with zero cellular signal.",
    emoji: "🎙️",
    href: "/field-log",
    size: "small",
  },
  {
    name: "Closed-Project Historical Benchmarks",
    description: "Empirical duration variance multipliers and monsoon delay metrics derived from 18 closed Oil India capital trunkline projects.",
    emoji: "📊",
    href: "/knowledge-base",
    size: "medium",
  },
  {
    name: "Direct Primavera P6 .XER Export",
    description: "Generate updated .XER schedule files with verified actuals for seamless round-trip synchronization back into Primavera P6.",
    emoji: "💾",
    href: "/projects/proj-oil-assam-01",
    size: "medium",
  },
];

export const testimonials = [
  {
    name: "Er. Pranjal Baruah",
    role: "Chief General Manager (Pipelines), Oil India Limited — Duliajan HQ",
    avatarSrc: daBoiAvatar,
    socialUrl: "#",
    quote: "Nirmaan Setu eliminated the 3-week blind spot between remote Right-of-Way trenching in Upper Assam and our Primavera P6 master schedule.",
  },
  {
    name: "Deepak Sharma",
    role: "Head of Project Controls, Numaligarh Pipeline Expansion",
    avatarSrc: daBoiAvatar,
    socialUrl: "#",
    quote: "The human-in-the-loop reviewer queue resolves 90% of field reporting ambiguities within minutes, keeping our CPM critical paths accurate.",
  },
  {
    name: "Rajesh Saikia",
    role: "Senior Construction Superintendent, Dibrugarh Section",
    avatarSrc: daBoiAvatar,
    socialUrl: "#",
    quote: "Even without cellular connectivity in dense river crossings, our supervisors' voice logs buffer safely and sync in strict causal order once back at base camp.",
  },
];

export const faqs = [
  {
    id: 1,
    question: "How does Nirmaan Setu handle remote pipeline sites without cellular connectivity?",
    answer: "Supervisors record voice and quantitative logs via the offline PWA. Events are tagged with monotonic hardware clocks and buffered locally. When a device reaches camp Wi-Fi or satellite signal, batches are uploaded and causally reordered before reconciliation.",
    href: "/field-log",
  },
  {
    id: 2,
    question: "How are Primavera P6 baseline schedules ingested?",
    answer: "Nirmaan Setu parses native Primavera P6 .XER and MS Project XML files directly inside Open SaaS Node operations, extracting tasks, WBS hierarchies, calendars, and predecessor dependencies in seconds.",
    href: "/projects",
  },
  {
    id: 3,
    question: "What happens when field voice transcripts do not match an activity exactly?",
    answer: "The multi-tier classifier routes events with >=0.85 cosine similarity to auto-match, while matches between 0.60 and 0.84 are queued for planner verification with top candidate suggestions.",
    href: "/reviewer-queue",
  },
  {
    id: 4,
    question: "Can verified actuals be exported back into enterprise Primavera P6?",
    answer: "Yes. Verified actual start dates, finish dates, and percentage completes can be exported as an updated .XER schedule ready for direct import into Primavera P6.",
    href: "/projects/proj-oil-assam-01",
  },
];

export const footerNavigation = {
  app: [
    { name: "Projects Portfolio", href: "/projects" },
    { name: "CPM Schedule & Gantt", href: "/projects/proj-oil-assam-01" },
    { name: "Reviewer Queue", href: "/reviewer-queue" },
    { name: "Field Logger PWA", href: "/field-log" },
    { name: "Historical Benchmarks", href: "/knowledge-base" },
  ],
  company: [
    { name: "Oil India Limited", href: "https://www.oil-india.com" },
    { name: "Duliajan Field Operations", href: "/projects" },
    { name: "Asset Integrity Division", href: "/knowledge-base" },
  ],
};

export const examples = [
  {
    name: "132km Crude Pipeline Sec-IV",
    description: "OIL-ASSAM-PL-2026: Cross-country high-pressure crude transmission pipeline with Brahmaputra HDD river crossing.",
    imageSrc: kivo,
    href: "/projects/proj-oil-assam-01",
  },
  {
    name: "Numaligarh Refinery Expansion Feedline",
    description: "OIL-NUMALIGARH-REF-24: 68km 18-inch supply trunkline with automated block valve stations.",
    imageSrc: messync,
    href: "/projects",
  },
  {
    name: "Barauni Trunkline River Crossing HDD",
    description: "OIL-BARAUNI-HDD-09: Specialized horizontal directional drilling across major floodplains.",
    imageSrc: microinfluencerClub,
    href: "/projects",
  },
  {
    name: "Duliajan Central Gas Gathering Station",
    description: "OIL-DULIAJAN-GGS-02: Structural piping, compressor tie-ins, and SCADA instrumentation upgrade.",
    imageSrc: promptpanda,
    href: "/projects",
  },
];
