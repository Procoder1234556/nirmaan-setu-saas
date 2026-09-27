export function Announcement() {
  return (
    <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white relative flex w-full items-center justify-center gap-3 py-2 px-4 text-center text-xs font-medium shadow-sm">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
        <span className="font-bold tracking-wide">OIL INDIA LIMITED:</span>
        <span className="hidden sm:inline">Nirmaan Setu Live — Causal Hardware Monotonic Sync & Primavera P6 Linking Active</span>
        <span className="sm:hidden">Nirmaan Setu Live Sync Active</span>
      </div>
      <div className="bg-white/30 hidden w-px h-3.5 sm:block" />
      <a
        href="/projects"
        className="bg-white/15 hover:bg-white/25 border border-white/20 transition-colors rounded-full px-2.5 py-0.5 text-[11px] font-semibold flex items-center gap-1"
      >
        Launch Portfolio Cockpit →
      </a>
    </div>
  );
}
