/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActiveTab,
  TopNavigation,
} from './components/TopNavigation';
import { TrafficIncidentsView } from './components/TrafficIncidentsView';
import { BusArrivalView } from './components/BusArrivalView';
import { BackendIntegrationModal } from './components/BackendIntegrationModal';
import { LiveRefreshToolbar } from './components/LiveRefreshToolbar';
import {
  BackendSettings,
  TransitService,
} from './services/ltaClient';
import {
  TrafficCamera,
  TrafficIncident,
} from './types/transit';
import {
  Bus,
  ShieldAlert,
  Zap,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('buses');
  const [incidents, setIncidents] = useState<TrafficIncident[]>([]);
  const [cameras, setCameras] = useState<TrafficCamera[]>([]);
  const [backendSettings, setBackendSettings] = useState<BackendSettings>(() =>
    TransitService.getSettings()
  );

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsUntilNextRefresh, setSecondsUntilNextRefresh] = useState(
    backendSettings.autoRefreshInterval
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setNotificationToast(message);
    setTimeout(() => {
      setNotificationToast((current) => (current === message ? null : current));
    }, 4000);
  };

  // Fetch / Sync Data for enabled features (Traffic Incidents & CCTV)
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [inc, cam] = await Promise.all([
        TransitService.getIncidents(),
        TransitService.getCameras(),
      ]);
      setIncidents(inc);
      setCameras(cam);
      setLastUpdated(new Date());
      setSecondsUntilNextRefresh(backendSettings.autoRefreshInterval);
    } finally {
      setIsRefreshing(false);
    }
  }, [backendSettings.autoRefreshInterval]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-refresh timer interval
  useEffect(() => {
    if (!backendSettings.autoRefreshEnabled) return;

    const interval = setInterval(() => {
      setSecondsUntilNextRefresh((prev) => {
        if (prev <= 1) {
          refreshData();
          return backendSettings.autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [backendSettings.autoRefreshEnabled, backendSettings.autoRefreshInterval, refreshData]);

  // Simulator Triggers
  const handleSimulateIncident = () => {
    const newInc = TransitService.injectSimulatedIncident();
    setIncidents((prev) => [newInc, ...prev]);
    showToast(`New incident reported on ${newInc.expressway}: ${newInc.location}`);
  };

  // Metrics for active modules
  const activeIncidentsCount = incidents.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Bar Navigation (BusArrival & TrafficIncidents only) */}
      <TopNavigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        incidentsCount={activeIncidentsCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Live Refresh Status Strip */}
        <LiveRefreshToolbar
          lastUpdated={lastUpdated}
          secondsUntilNextRefresh={secondsUntilNextRefresh}
          isRefreshing={isRefreshing}
          onManualRefresh={refreshData}
          onSimulateIncident={handleSimulateIncident}
          mode={backendSettings.mode}
        />

        {/* Global Notification Toast */}
        {notificationToast && (
          <div className="flex items-center justify-between p-3.5 bg-sky-950/90 border border-sky-600/70 text-sky-200 text-xs rounded-xl shadow-lg backdrop-blur animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="font-medium">{notificationToast}</span>
            </div>
            <button
              onClick={() => setNotificationToast(null)}
              className="text-sky-300 hover:text-white text-xs ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Executive Transit Summary Bar (BusArrival & TrafficIncidents) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Next Buses at Stop (v3) */}
          <div
            onClick={() => setActiveTab('buses')}
            className={`p-5 rounded-xl border transition-all cursor-pointer group ${
              activeTab === 'buses'
                ? 'bg-slate-900 border-sky-500/70 shadow-lg ring-1 ring-sky-500/30'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Bus Arrival Telemetry (v3)</span>
              <Bus className="w-5 h-5 text-sky-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tabular-nums text-sky-400">
                83139
              </span>
              <span className="text-xs text-slate-400">Eunos / Still Rd</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-800/80">
              <span className="font-mono text-[11px] text-emerald-400">20s LTA Refresh Cadence</span>
              <span className="text-sky-400 group-hover:translate-x-0.5 transition-transform flex items-center font-medium">
                Live Departures →
              </span>
            </div>
          </div>

          {/* Card 2: Traffic Incidents */}
          <div
            onClick={() => setActiveTab('incidents')}
            className={`p-5 rounded-xl border transition-all cursor-pointer group ${
              activeTab === 'incidents'
                ? 'bg-slate-900 border-rose-500/70 shadow-lg ring-1 ring-rose-500/30'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Expressway Incidents & Surveillance</span>
              <ShieldAlert className="w-5 h-5 text-rose-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono tabular-nums text-white">
                {activeIncidentsCount}
              </span>
              <span className="text-xs text-rose-400 font-medium">Active Road Alerts</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-800/80">
              <span>EMAS Monitored (PIE, CTE, AYE)</span>
              <span className="text-rose-400 group-hover:translate-x-0.5 transition-transform flex items-center font-medium">
                Road Feed →
              </span>
            </div>
          </div>
        </div>

        {/* Tab 1: Dedicated Bus Arrival (v3) View */}
        {activeTab === 'buses' && (
          <BusArrivalView initialBusStopCode="83139" />
        )}

        {/* Tab 2: Dedicated Traffic Incidents View */}
        {activeTab === 'incidents' && (
          <TrafficIncidentsView
            incidents={incidents}
            cameras={cameras}
            onSelectIncidentOnMap={() => {}}
            onSimulateNewIncident={handleSimulateIncident}
          />
        )}
      </main>

      {/* Backend Integration Hub Modal */}
      <BackendIntegrationModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        onConfigSaved={(newSettings) => {
          setBackendSettings(newSettings);
          refreshData();
          showToast(`Backend configuration saved (${newSettings.mode} mode)`);
        }}
      />

      {/* Quiet Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Singapore Urban Mobility Console</span>
            <span aria-hidden="true">·</span>
            <span>Frontend Ready for LTA DataMall v2 Integration</span>
          </div>
          <div>
            <span>Data specifications based on LTA Open Data Services & SMRT Standards</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
