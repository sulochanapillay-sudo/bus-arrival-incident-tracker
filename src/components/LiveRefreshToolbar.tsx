import React from 'react';
import { RefreshCw, Zap } from 'lucide-react';

interface Props {
  lastUpdated: Date;
  secondsUntilNextRefresh: number;
  isRefreshing: boolean;
  onManualRefresh: () => void;
  onSimulateIncident: () => void;
  mode: 'serverless' | 'simulator' | 'custom_api';
}

export const LiveRefreshToolbar: React.FC<Props> = ({
  lastUpdated,
  secondsUntilNextRefresh,
  isRefreshing,
  onManualRefresh,
  onSimulateIncident,
  mode,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs text-slate-400">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-slate-300">
            {mode === 'serverless'
              ? 'Serverless /api Endpoints Connected'
              : mode === 'simulator'
              ? 'Simulator Feed Engine'
              : 'External Gateway Connected'}
          </span>
        </div>

        <span className="text-slate-600 hidden sm:inline">·</span>

        <span className="hidden sm:inline">
          Last synced {lastUpdated.toLocaleTimeString()}
        </span>

        <span className="text-slate-600 hidden md:inline">·</span>

        <span className="hidden md:inline font-mono text-[11px] text-slate-400">
          Next tick in {secondsUntilNextRefresh}s
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSimulateIncident}
          className="px-2.5 py-1 text-[11px] font-medium text-rose-300 hover:text-white bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/50 rounded transition-colors flex items-center gap-1"
        >
          <Zap className="w-3 h-3 text-rose-400" />
          <span>Simulate Traffic Alert</span>
        </button>

        <button
          onClick={onManualRefresh}
          disabled={isRefreshing}
          className="px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3 h-3 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Sync Now</span>
        </button>
      </div>
    </div>
  );
};
