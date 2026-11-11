import React from 'react';
import { Server, ShieldAlert } from 'lucide-react';

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
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3.5">
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
          </button>
        </nav>

        {/* Zone 3: Total Traffic Incidents counter & backend hub in right corner */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => onTabChange('incidents')}
            title="Total islandwide active traffic incidents. Click to view all."
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border transition-all text-xs font-medium cursor-pointer shadow-sm ${
              activeTab === 'incidents'
                ? 'border-rose-500 bg-rose-950/60 text-white ring-1 ring-rose-500/50'
                : 'border-rose-900/60 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 hover:border-rose-700 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-slate-300 font-medium">
              <span className="hidden sm:inline">Total Incidents:</span>
              <span className="sm:hidden">Incidents:</span>
            </span>
            <span className="font-mono font-bold text-white tabular-nums bg-rose-600/80 px-2 py-0.5 rounded text-[11px] min-w-[20px] text-center shadow-inner">
              {incidentsCount}
            </span>
          </button>

          <button
            onClick={onOpenBackendModal}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 hover:border-sky-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            <Server className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Backend API Hub</span>
            <span className="md:hidden">API</span>
          </button>
        </div>
      </div>
    </header>
  );
};
