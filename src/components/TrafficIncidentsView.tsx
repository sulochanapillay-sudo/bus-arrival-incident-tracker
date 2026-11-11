import React, { useState } from 'react';
import {
  Expressway,
  IncidentType,
  TrafficCamera,
  TrafficIncident,
} from '../types/transit';
import { EXPRESSWAYS_LIST } from '../data/singaporeData';
import {
  AlertCircle,
  AlertTriangle,
  Bus,
  Camera,
  Clock,
  ExternalLink,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  incidents: TrafficIncident[];
  cameras: TrafficCamera[];
  onSelectIncidentOnMap: (incident: TrafficIncident) => void;
  onSimulateNewIncident: () => void;
  onCheckBusStop?: (busStopCode: string) => void;
}

export const TrafficIncidentsView: React.FC<Props> = ({
  incidents,
  cameras,
  onSelectIncidentOnMap,
  onSimulateNewIncident,
  onCheckBusStop,
}) => {
  const [selectedExpressway, setSelectedExpressway] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCamModal, setActiveCamModal] = useState<TrafficCamera | null>(null);

  const filteredIncidents = incidents.filter((inc) => {
    if (selectedExpressway !== 'ALL' && inc.expressway !== selectedExpressway) {
      return false;
    }
    if (selectedType !== 'ALL' && inc.type !== selectedType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        inc.location.toLowerCase().includes(q) ||
        inc.message.toLowerCase().includes(q) ||
        inc.expressway.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const incidentTypes: Array<IncidentType | 'ALL'> = [
    'ALL',
    'Accident',
    'Heavy Traffic',
    'Roadwork',
    'Vehicle breakdown',
    'Obstacle',
    'Weather / Ponding',
  ];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Live Traffic Incidents & Road Surveillance
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Singapore Expressway Monitoring and Advisory System (EMAS) Real-Time Feed
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onSimulateNewIncident}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Simulate Incident</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search expressway or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Expressway Filter */}
          <div>
            <select
              value={selectedExpressway}
              onChange={(e) => setSelectedExpressway(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">All Expressways ({incidents.length})</option>
              {EXPRESSWAYS_LIST.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.name} - {exp.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Incident Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              {incidentTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'ALL' ? 'All Incident Types' : type}
                </option>
              ))}
            </select>
          </div>

          {/* Results Counter / Clear */}
          <div className="flex items-center justify-between px-3 py-1 bg-slate-950 rounded-lg border border-slate-800/80 text-xs text-slate-400">
            <span>Showing <span className="font-mono text-white font-semibold">{filteredIncidents.length}</span> active alerts</span>
            {(selectedExpressway !== 'ALL' || selectedType !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedExpressway('ALL');
                  setSelectedType('ALL');
                  setSearchQuery('');
                }}
                className="text-sky-400 hover:text-sky-300 text-[11px]"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredIncidents.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
            <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-300">No Incidents Matching Filters</h4>
            <p className="text-xs text-slate-500 mt-1">
              All monitored sections for this query are currently flowing nominally.
            </p>
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const isSevere = incident.severity === 'severe';
            const relatedCam = cameras.find((c) => c.id === incident.cameraFeedId || c.expressway === incident.expressway);

            return (
              <div
                key={incident.id}
                className={`bg-slate-900 border rounded-xl p-5 flex flex-col justify-between transition-all hover:border-slate-600 ${
                  isSevere ? 'border-rose-900/50 bg-rose-950/10' : 'border-slate-800'
                }`}
              >
                <div>
                  {/* Top metadata strip (NO PILLS - Clean unboxed text with subtle separators) */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-slate-800 text-[11px]">
                        {incident.expressway}
                      </span>
                      <span>{incident.type}</span>
                      <span aria-hidden="true">·</span>
                      <span className={isSevere ? 'text-rose-400 font-semibold' : 'text-amber-400 font-medium'}>
                        {incident.severity.toUpperCase()} PRIORITY
                      </span>
                    </div>

                    <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Primary Location Title */}
                  <h3 className="text-base font-semibold text-white tracking-tight mb-2">
                    {incident.location}
                  </h3>

                  {/* Message Detail */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {incident.message}
                  </p>

                  {/* Road condition details */}
                  <div className="space-y-1.5 text-xs text-slate-400 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 mb-4">
                    {incident.lanesAffected && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Lane Status:</span>
                        <span className="font-medium text-slate-200">{incident.lanesAffected}</span>
                      </div>
                    )}
                    {incident.estimatedClearanceMinutes && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Est. Clearance:</span>
                        <span className="font-mono tabular-nums text-amber-300 font-semibold">
                          ~{incident.estimatedClearanceMinutes} minutes
                        </span>
                      </div>
                    )}
                    {incident.diversionAdvice && (
                      <div className="pt-1.5 border-t border-slate-800/60 text-slate-300">
                        <span className="text-sky-400 font-medium">Diversion: </span>
                        {incident.diversionAdvice}
                      </div>
                    )}
                  </div>

                  {/* Correlated Bus Feeder Stop */}
                  {(() => {
                    const busHint =
                      incident.expressway === 'PIE'
                        ? { code: '83139', name: 'Still Rd / Eunos' }
                        : incident.expressway === 'CTE'
                        ? { code: '01012', name: 'Victoria St / Bugis' }
                        : incident.expressway === 'ECP'
                        ? { code: '03218', name: 'Suntec Ctr' }
                        : incident.expressway === 'AYE'
                        ? { code: '28009', name: 'Jurong East Int' }
                        : { code: '83139', name: 'Still Rd' };

                    return (
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/90 border border-slate-800/80 mb-4 text-[11px]">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Bus className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <span>Feeder Bus Stop:</span>
                          <span className="font-mono text-slate-200 font-medium">
                            {busHint.code} ({busHint.name})
                          </span>
                        </div>
                        {onCheckBusStop && (
                          <button
                            onClick={() => onCheckBusStop(busHint.code)}
                            className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors"
                          >
                            <span>Check Arrivals</span>
                            <span>→</span>
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">
                    EMAS ID: {incident.id}
                  </span>

                  {relatedCam && (
                    <button
                      onClick={() => setActiveCamModal(relatedCam)}
                      className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      <span>View CCTV</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Traffic Cameras Showcase Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Camera className="w-4 h-4 text-sky-400" />
              <span>Singapore Expressway Traffic Surveillance Cameras</span>
            </h3>
            <p className="text-xs text-slate-400">
              Direct LTA EMAS CCTV Feeds with automatic 2-minute cadence
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800/50">
            {cameras.length} CAMERAS OPERATIONAL
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cameras.map((cam) => (
            <div
              key={cam.id}
              onClick={() => setActiveCamModal(cam)}
              className="group cursor-pointer bg-slate-950 border border-slate-800 rounded-lg overflow-hidden hover:border-sky-500 transition-colors"
            >
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                <img
                  src={cam.imageUrl}
                  alt={cam.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 bg-black/80 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-white">
                  {cam.expressway}
                </div>
                <div className="absolute bottom-2 right-2 bg-emerald-950/80 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-mono border border-emerald-800/60">
                  LIVE
                </div>
              </div>
              <div className="p-3">
                <h4 className="text-xs font-semibold text-slate-200 truncate group-hover:text-sky-300">
                  {cam.name}
                </h4>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>ID: {cam.id}</span>
                  <span className="font-mono">
                    {new Date(cam.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for full CCTV snapshot inspection */}
      {activeCamModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setActiveCamModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{activeCamModal.name}</h3>
                <span className="text-xs text-slate-400 font-mono">
                  Camera Feed {activeCamModal.id} · {activeCamModal.expressway} Expressway
                </span>
              </div>
              <button
                onClick={() => setActiveCamModal(null)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-xs font-medium"
              >
                Close
              </button>
            </div>

            <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-700 bg-black">
              <img
                src={activeCamModal.imageUrl}
                alt={activeCamModal.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/80 text-white font-mono text-xs px-2.5 py-1 rounded">
                LTA SURVEILLANCE FEED · LIVE
              </div>
              <div className="absolute bottom-3 right-3 bg-black/80 text-slate-300 font-mono text-xs px-2.5 py-1 rounded">
                {new Date(activeCamModal.timestamp).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>GPS Coordinates: {activeCamModal.lat.toFixed(4)}°N, {activeCamModal.lng.toFixed(4)}°E</span>
              <span className="text-emerald-400">Stream Connection Stable</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
