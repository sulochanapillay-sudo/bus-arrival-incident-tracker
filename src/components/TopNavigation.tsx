import React from 'react';
import { Server } from 'lucide-react';

export type ActiveTab = 'buses' | 'incidents';

interface Props {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenBackendModal: () => void;
  incidentsCount: number;
}

export const TopNavigation: React.FC<Props> = ({
  activeTab,
  onTabChange,
  onOpenBackendModal,
  incidentsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 border-b border-slate-800/80 backdrop-blur">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Brand wordmark (single text element) */}
        <div
          onClick={() => onTabChange('buses')}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2"
        >
          <span className="text-sky-400 font-extrabold tracking-tighter">SG</span>
          <span>TransitPulse</span>
        </div>

        {/* Zone 2: Active navigation links (BusArrival & TrafficIncidents) */}
        <nav className="flex items-center gap-6 sm:gap-8 text-xs sm:text-sm font-medium text-slate-400 overflow-x-auto py-1">
          <button
            onClick={() => onTabChange('buses')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 flex items-center gap-2 ${
              activeTab === 'buses'
                ? 'text-white border-sky-400 font-semibold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <span>Bus Arrivals (v3)</span>
            <span className="text-[10px] font-mono text-sky-400 px-1.5 py-0.2 rounded bg-sky-950/60 border border-sky-800/50">
              Stop 83139
            </span>
          </button>

          <button
            onClick={() => onTabChange('incidents')}
            className={`whitespace-nowrap shrink-0 transition-colors pb-0.5 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'incidents'
                ? 'text-white border-rose-500 font-semibold'
                : 'border-transparent hover:text-slate-200'
            }`}
          >
            <span>Traffic Incidents</span>
            {incidentsCount > 0 && (
              <span className="text-[10px] font-mono font-bold text-rose-400">({incidentsCount})</span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 primary action button */}
        <div className="flex items-center shrink-0">
          <button
            onClick={onOpenBackendModal}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 border border-slate-700 hover:border-sky-500 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            <Server className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Backend API Hub</span>
            <span className="sm:hidden">API Hub</span>
          </button>
        </div>
      </div>
    </header>
  );
};
