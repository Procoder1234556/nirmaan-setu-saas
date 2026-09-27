import { Link as ReactRouterLink } from "react-router";
import { Button } from "../../client/components/ui/button";
import {
  HardHat,
  Layers,
  Mic,
  Calendar,
  CheckCircle2,
  TrendingDown,
  Clock,
  Sparkles,
  ArrowRight,
  Database,
} from "lucide-react";

export function Hero() {
  return (
    <div className="relative w-full pt-10 sm:pt-14 pb-12">
      <TopGradient />
      <BottomGradient />
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          {/* Enterprise Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <HardHat className="w-3.5 h-3.5 text-amber-500" />
            <span>Oil India Limited — Duliajan Field Operations</span>
          </div>

          <h1 className="text-foreground text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Nirmaan Setu <span className="font-normal font-serif text-muted-foreground text-3xl sm:text-4xl">(निर्माण सेतु)</span>
            <span className="block mt-2 text-2xl sm:text-4xl font-bold bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 bg-clip-text text-transparent">
              Intelligent Data Capture & Dynamic Schedule-Linking Layer
            </span>
          </h1>

          <p className="text-muted-foreground mx-auto max-w-2xl text-base sm:text-lg leading-relaxed">
            Bridging frontline cross-country pipeline execution with Primavera P6 enterprise schedules. Monotonic hardware clock ordering, offline audio transcription, pgvector semantic candidate matching, and in-process CPM slip forecasting.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-semibold" asChild>
              <ReactRouterLink to="/projects">
                <Layers className="w-4 h-4 mr-2" />
                Launch Projects Cockpit
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </ReactRouterLink>
            </Button>
            <Button size="lg" variant="outline" className="border-border hover:bg-accent font-semibold" asChild>
              <ReactRouterLink to="/reviewer-queue">
                <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                Human-in-the-Loop Queue
              </ReactRouterLink>
            </Button>
            <Button size="lg" variant="secondary" className="font-semibold" asChild>
              <ReactRouterLink to="/field-log">
                <Mic className="w-4 h-4 mr-2 text-amber-600 dark:text-amber-400" />
                Field Logger PWA
              </ReactRouterLink>
            </Button>
          </div>
        </div>

        {/* Live System Cockpit Teaser */}
        <div className="mt-12 sm:mt-16 flow-root">
          <div className="rounded-2xl border border-border bg-card/80 p-4 sm:p-6 shadow-2xl backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <div>
                  <span className="text-xs font-mono font-bold text-foreground uppercase">
                    OIL-ASSAM-PL-2026: 132km Crude Pipeline Sec-IV
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Primavera P6 Active Baseline • Dibrugarh to Golaghat Section
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-destructive/10 text-destructive font-semibold">
                  Critical Path Delay: +18.5 Days
                </span>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                  Monotonic Sync: Seq #1043
                </span>
              </div>
            </div>

            {/* Quick KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  Active Capital Projects
                </div>
                <div className="text-2xl font-bold text-foreground mt-1">4 Trunklines</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Assam, Numaligarh, Barauni</div>
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Clock className="w-3.5 h-3.5 text-destructive" />
                  Max Milestone Slip
                </div>
                <div className="text-2xl font-bold text-destructive mt-1">+18.5 Days</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">RoW & Brahmaputra HDD</div>
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                  Pending Review Queue
                </div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">2 Verifications</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Semantic Match 0.60–0.84</div>
              </div>

              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Database className="w-3.5 h-3.5 text-blue-500" />
                  Historical Benchmarks
                </div>
                <div className="text-2xl font-bold text-foreground mt-1">18 OIL Projects</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Monsoon slip factor: +22.4%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopGradient() {
  return (
    <div
      className="absolute right-0 top-0 -z-10 w-full transform-gpu overflow-hidden blur-3xl sm:top-0"
      aria-hidden="true"
    >
      <div
        className="aspect-1020/880 w-280 bg-linear-to-tr flex-none from-amber-400 to-purple-300 opacity-10 sm:right-1/4 sm:translate-x-1/2 dark:hidden"
        style={{
          clipPath:
            "polygon(80% 20%, 90% 55%, 50% 100%, 70% 30%, 20% 50%, 50% 0)",
        }}
      />
    </div>
  );
}

function BottomGradient() {
  return (
    <div
      className="absolute inset-x-0 top-[calc(100%-40rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-65rem)]"
      aria-hidden="true"
    >
      <div
        className="aspect-1020/880 w-360 bg-linear-to-br relative from-amber-400 to-purple-300 opacity-10 sm:-left-3/4 sm:translate-x-1/4 dark:hidden"
        style={{
          clipPath: "ellipse(80% 30% at 80% 50%)",
        }}
      />
    </div>
  );
}
