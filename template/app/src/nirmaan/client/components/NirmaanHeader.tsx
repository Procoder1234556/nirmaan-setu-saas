import React from 'react';
import { useReviewerQueue } from '../operationsClient';
import {
  HardHat,
  Layers,
  CheckCircle2,
  Mic,
  Database,
  Calendar,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface NirmaanHeaderProps {
  currentTab: 'projects' | 'details' | 'queue' | 'field-log' | 'knowledge-base';
  projectId?: string;
}

export function NirmaanHeader({ currentTab, projectId }: NirmaanHeaderProps) {
  const { pendingCount } = useReviewerQueue();

  const navLinks = [
    {
      id: 'projects',
      label: 'Projects Portfolio',
      href: '/projects',
      icon: Layers,
    },
    {
      id: 'details',
      label: 'CPM Schedule & Gantt',
      href: projectId ? `/projects/${projectId}` : '/projects/proj-oil-assam-01',
      icon: Calendar,
    },
    {
      id: 'queue',
      label: 'Reviewer Queue',
      href: '/reviewer-queue',
      icon: CheckCircle2,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      id: 'field-log',
      label: 'Field Logger PWA',
      href: '/field-log',
      icon: Mic,
    },
    {
      id: 'knowledge-base',
      label: 'Historical Benchmarks',
      href: '/knowledge-base',
      icon: Database,
    },
  ];

  return (
    <header className="border-b border-border/80 bg-card/60 backdrop-blur-md sticky top-0 z-30 transition-all">
      {/* Top Enterprise Ribbon */}
      <div className="border-b border-border/40 bg-muted/40 px-4 py-1.5 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            OIL INDIA LIMITED
          </span>
          <span className="hidden sm:inline text-muted-foreground/60">|</span>
          <span className="hidden sm:inline font-mono">Duliajan Field Headquarters — Asset Integrity Division</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Causal Sync Gateway: Active
          </span>
          <span className="text-muted-foreground/60">|</span>
          <span className="font-semibold text-foreground">Role: SENIOR_PLANNER</span>
        </div>
      </div>

      {/* Main Title & Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  Nirmaan Setu
                  <span className="text-sm font-normal text-muted-foreground font-serif">
                    (निर्माण सेतु)
                  </span>
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  v2.4 Primavera P6 Sync
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Intelligent Field Data Capture & Dynamic CPM Schedule-Linking Layer
              </p>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentTab === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                  {link.badge !== null && link.badge !== undefined && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-primary-foreground text-primary'
                          : 'bg-destructive text-destructive-foreground'
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
