/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActiveTab,
  TopNavigation,
} from './components/TopNavigation';
import { SingaporeInteractiveMap } from './components/SingaporeInteractiveMap';
import { TrafficIncidentsView } from './components/TrafficIncidentsView';
import { MrtLrtStatusView } from './components/MrtLrtStatusView';
import { CarparkLotTrackerView } from './components/CarparkLotTrackerView';
import { BusArrivalView } from './components/BusArrivalView';
import { BackendIntegrationModal } from './components/BackendIntegrationModal';
import { LiveRefreshToolbar } from './components/LiveRefreshToolbar';
import {
  BackendSettings,
  TransitService,
} from './services/ltaClient';
import {
  CarparkLot,
  MrtLine,
  StationInfo,
  TrafficCamera,
  TrafficIncident,
} from './types/transit';
import {
  AlertTriangle,
  ArrowRight,
  Bus,
  Car,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  MapPin,
  ParkingSquare,
  ShieldAlert,
  Train,
  Zap,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [incidents, setIncidents] = useState<TrafficIncident[]>([]);
  const [mrtLines, setMrtLines] = useState<MrtLine[]>([]);
  const [carparks, setCarparks] = useState<CarparkLot[]>([]);
  const [cameras, setCameras] = useState<TrafficCamera[]>([]);
  const [backendSettings, setBackendSettings] = useState<BackendSettings>(() =>
    TransitService.getSettings()
  );

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedCarparkId, setSelectedCarparkId] = useState<string | null>(null);

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

  // Fetch / Sync Data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [inc, mrt, cp, cam] = await Promise.all([
        TransitService.getIncidents(),
        TransitService.getMrtStatus(),
        TransitService.getCarparks(),
        TransitService.getCameras(),
      ]);
      setIncidents(inc);
      setMrtLines(mrt);
      setCarparks(cp);
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

  const handleToggleDelay = (lineId: string) => {
    const updatedLines = TransitService.toggleMrtLineDelay(lineId);
    setMrtLines(updatedLines);
    const line = updatedLines.find((l) => l.id === lineId);
    if (line) {
      showToast(
        line.status === 'normal'
          ? `${line.name} status restored to Normal Service`
          : `${line.name} delay alert triggered (+8 mins)`
      );
    }
  };

  const handleSelectIncidentFromList = (incident: TrafficIncident) => {
    setSelectedIncidentId(incident.id);
    setActiveTab('map');
  };

  const handleSelectCarparkFromList = (carpark: CarparkLot) => {
    setSelectedCarparkId(carpark.id);
    setActiveTab('map');
  };

  // Metrics
  const activeIncidentsCount = incidents.length;
  const delayedLines = mrtLines.filter((l) => l.status !== 'normal');
  const criticalCarparks = carparks.filter((c) => c.availableLots < 20);
  const totalAvailableLots = carparks.reduce((sum, c) => sum + c.availableLots, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Bar Navigation */}
      <TopNavigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        incidentsCount={activeIncidentsCount}
        mrtAlertCount={delayedLines.length}
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

        {/* Executive Transit Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Traffic Incidents */}
          <div
            onClick={() => setActiveTab('incidents')}
            className={`p-4 rounded-xl border transition-all cursor-pointer group ${
              activeTab === 'incidents'
                ? 'bg-slate-900 border-rose-500/60 shadow-lg'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Expressway Incidents</span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-white">
                {activeIncidentsCount}
              </span>
              <span className="text-xs text-rose-400 font-medium">Active Road Alerts</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-800/80">
              <span>EMAS Monitored (PIE, CTE, AYE)</span>
              <span className="text-sky-400 group-hover:translate-x-0.5 transition-transform flex items-center">
                Details →
              </span>
            </div>
          </div>

          {/* Card 2: MRT Rail Lines */}
          <div
            onClick={() => setActiveTab('mrt')}
            className={`p-4 rounded-xl border transition-all cursor-pointer group ${
              activeTab === 'mrt'
                ? 'bg-slate-900 border-amber-500/60 shadow-lg'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">MRT / LRT Network</span>
              <Train className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-white">
                {mrtLines.length - delayedLines.length} / {mrtLines.length}
              </span>
              <span
                className={`text-xs font-medium ${
                  delayedLines.length > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {delayedLines.length > 0 ? `${delayedLines.length} Disruption` : 'Normal Service'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-800/80">
              <span>9 Lines · SMRT / SBS Transit</span>
              <span className="text-sky-400 group-hover:translate-x-0.5 transition-transform flex items-center">
                Crowd Levels →
              </span>
            </div>
          </div>

          {/* Card 3: Carpark Availability */}
          <div
            onClick={() => setActiveTab('carparks')}
            className={`p-4 rounded-xl border transition-all cursor-pointer group ${
              activeTab === 'carparks'
                ? 'bg-slate-900 border-emerald-500/60 shadow-lg'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Carpark Lots</span>
              <ParkingSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
                {totalAvailableLots.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">Lots Free</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-800/80">
              <span>{carparks.length} Monitored Facilities</span>
              <span className="text-sky-400 group-hover:translate-x-0.5 transition-transform flex items-center">
                Lot Tracker →
              </span>
            </div>
          </div>

          {/* Card 4: Next Buses at Stop (v3) */}
          <div
            onClick={() => setActiveTab('buses')}
            className={`p-4 rounded-xl border transition-all cursor-pointer group ${
              activeTab === 'buses'
                ? 'bg-slate-900 border-sky-500/60 shadow-lg'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Bus Arrival (v3)</span>
              <Bus className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-sky-400">
                83139
              </span>
              <span className="text-xs text-slate-400">Stop Telemetry</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-800/80">
              <span>20s Refresh Cadence</span>
              <span className="text-sky-400 group-hover:translate-x-0.5 transition-transform flex items-center">
                Arrivals →
              </span>
            </div>
          </div>
        </div>

        {/* Tab 1: Unified Spatial Map View */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <SingaporeInteractiveMap
              incidents={incidents}
              mrtLines={mrtLines}
              carparks={carparks}
              cameras={cameras}
              selectedIncidentId={selectedIncidentId}
              selectedCarparkId={selectedCarparkId}
              onSelectIncident={(inc) => setSelectedIncidentId(inc.id)}
              onSelectCarpark={(cp) => setSelectedCarparkId(cp.id)}
            />

            {/* Split Feed Under Map */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Critical Traffic Alerts Feed */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>Active Traffic Incidents</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('incidents')}
                    className="text-xs text-sky-400 hover:text-sky-300 font-medium"
                  >
                    View All ({incidents.length}) →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {incidents.slice(0, 3).map((inc) => (
                    <div
                      key={inc.id}
                      onClick={() => setSelectedIncidentId(inc.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedIncidentId === inc.id
                          ? 'border-sky-500 bg-sky-950/20'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                            {inc.expressway}
                          </span>
                          <span className="font-semibold text-slate-200">{inc.type}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2">{inc.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critical / High-Demand Carpark Availability Feed */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <ParkingSquare className="w-4 h-4 text-emerald-400" />
                    <span>Real-Time Carpark Availability</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('carparks')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    Search All Lots →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {carparks.slice(0, 3).map((cp) => {
                    const isAbundant = cp.availableLots > 50;
                    return (
                      <div
                        key={cp.id}
                        onClick={() => setSelectedCarparkId(cp.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between ${
                          selectedCarparkId === cp.id
                            ? 'border-emerald-500 bg-emerald-950/20'
                            : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs text-white">{cp.name}</div>
                          <span className="text-[11px] text-slate-400">
                            {cp.area} · {cp.agency}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="flex items-baseline gap-1 justify-end">
                            <span
                              className={`text-lg font-bold font-mono tabular-nums ${
                                isAbundant ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              {cp.availableLots}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              / {cp.totalLots}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {cp.occupancyPercent}% Occupied
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Dedicated Traffic Incidents View */}
        {activeTab === 'incidents' && (
          <TrafficIncidentsView
            incidents={incidents}
            cameras={cameras}
            onSelectIncidentOnMap={handleSelectIncidentFromList}
            onSimulateNewIncident={handleSimulateIncident}
          />
        )}

        {/* Tab 3: Dedicated MRT & LRT Status View */}
        {activeTab === 'mrt' && (
          <MrtLrtStatusView
            lines={mrtLines}
            onToggleDelay={handleToggleDelay}
            onSelectStationOnMap={(st) => {
              setActiveTab('map');
            }}
          />
        )}

        {/* Tab 4: Dedicated Carpark Lots Tracker View */}
        {activeTab === 'carparks' && (
          <CarparkLotTrackerView
            carparks={carparks}
            onSelectCarparkOnMap={handleSelectCarparkFromList}
          />
        )}

        {/* Tab 5: Dedicated Bus Arrival (v3) View */}
        {activeTab === 'buses' && (
          <BusArrivalView initialBusStopCode="83139" />
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
