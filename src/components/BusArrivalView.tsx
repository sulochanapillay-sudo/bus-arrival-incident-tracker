import React, { useEffect, useState } from 'react';
import {
  BusArrivalResponse,
  BusRouteImpact,
  BusServiceArrival,
  NextBusInfo,
  TrafficCamera,
  TrafficIncident,
} from '../types/transit';
import { TransitService } from '../services/ltaClient';
import {
  KNOWN_BUS_STOPS,
  correlateIncidentsForBusStop,
} from '../data/singaporeData';
import {
  Accessibility,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bus,
  Camera,
  Clock,
  Compass,
  ExternalLink,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
  X,
  Zap,
} from 'lucide-react';

interface Props {
  initialBusStopCode?: string;
  incidents: TrafficIncident[];
  cameras: TrafficCamera[];
  onNavigateToIncident?: (incident: TrafficIncident) => void;
}

const COMMON_STOPS = [
  { code: '83139', name: 'Opp Block 831 (Eunos / Still Rd)' },
  { code: '01012', name: 'Bugis Stn Exit B (Victoria St)' },
  { code: '03218', name: 'Opp Suntec Convention Ctr' },
  { code: '10011', name: 'Opp VivoCity (Telok Blangah Rd)' },
  { code: '65009', name: 'Tampines Interchange' },
  { code: '28009', name: 'Jurong East Interchange' },
];

export const BusArrivalView: React.FC<Props> = ({
  initialBusStopCode = '83139',
  incidents,
  cameras,
  onNavigateToIncident,
}) => {
  const [busStopCode, setBusStopCode] = useState(initialBusStopCode);
  const [inputCode, setInputCode] = useState(initialBusStopCode);
  const [data, setData] = useState<BusArrivalResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(20);
  const [activeIncidentModal, setActiveIncidentModal] = useState<TrafficIncident | null>(null);

  // Compute real-time correlated traffic impact for current bus stop
  const correlation = correlateIncidentsForBusStop(busStopCode, incidents);

  const fetchArrivals = async (codeToFetch: string) => {
    setIsLoading(true);
    try {
      const res = await TransitService.getBusArrival(codeToFetch);
      setData(res);
      setLastRefreshed(new Date());
      setCountdown(20);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArrivals(busStopCode);
  }, [busStopCode]);

  // 20-second auto refresh loop
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchArrivals(busStopCode);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [busStopCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      setBusStopCode(inputCode.trim());
    }
  };

  // ETA calculator helper
  const calculateMinutesUntil = (estimatedIso?: string): { text: string; isArriving: boolean; minutes: number } => {
    if (!estimatedIso) return { text: '—', isArriving: false, minutes: 999 };
    const arrivalTime = new Date(estimatedIso).getTime();
    const now = Date.now();
    const diffMs = arrivalTime - now;
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins <= 0) {
      return { text: 'Arr', isArriving: true, minutes: 0 };
    }
    if (diffMins === 1) {
      return { text: '1 min', isArriving: true, minutes: 1 };
    }
    return { text: `${diffMins} mins`, isArriving: false, minutes: diffMins };
  };

  const getLoadBadge = (load?: string) => {
    switch (load) {
      case 'SEA':
        return { label: 'Seats Available', color: 'text-emerald-400 border-emerald-800/60 bg-emerald-950/40' };
      case 'SDA':
        return { label: 'Standing Available', color: 'text-amber-400 border-amber-800/60 bg-amber-950/40' };
      case 'LSD':
        return { label: 'Limited Standing', color: 'text-rose-400 border-rose-800/60 bg-rose-950/40' };
      default:
        return { label: 'Normal Capacity', color: 'text-slate-400 border-slate-800 bg-slate-900' };
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'DD':
        return 'Double Deck';
      case 'SD':
        return 'Single Deck';
      case 'BD':
        return 'Bendy';
      default:
        return 'Standard';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Bus Stop Control Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bus className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Singapore Bus Arrival Telemetry & Traffic Link
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Correlates LTA v3 BusArrival predictions with active EMAS Expressway road incidents
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-mono px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Refresh in {countdown}s</span>
            </div>

            <button
              onClick={() => fetchArrivals(busStopCode)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync Now</span>
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 pt-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Enter 5-digit Bus Stop Code (e.g. 83139)..."
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-sky-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            Lookup Stop
          </button>
        </form>

        {/* Quick Test Stops */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
          <span className="text-[11px] text-slate-500">Quick Test Stops:</span>
          {COMMON_STOPS.map((st) => (
            <button
              key={st.code}
              onClick={() => {
                setInputCode(st.code);
                setBusStopCode(st.code);
              }}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                busStopCode === st.code
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st.code} · {st.name.split('(')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Correlated Traffic Incidents Impact Widget (Direct Link) */}
      <div
        className={`border rounded-xl p-4 shadow-sm transition-all ${
          correlation.overallStatus === 'severe_disruption'
            ? 'bg-rose-950/20 border-rose-800/70'
            : correlation.overallStatus === 'minor_slowdown'
            ? 'bg-amber-950/20 border-amber-800/70'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                correlation.overallStatus === 'severe_disruption'
                  ? 'bg-rose-500/20 text-rose-400'
                  : correlation.overallStatus === 'minor_slowdown'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {correlation.overallStatus === 'severe_disruption' ? (
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              ) : correlation.overallStatus === 'minor_slowdown' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Correlated Traffic & Road Corridor Status
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    correlation.overallStatus === 'severe_disruption'
                      ? 'bg-rose-500 text-white'
                      : correlation.overallStatus === 'minor_slowdown'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                  }`}
                >
                  {correlation.overallStatus === 'severe_disruption'
                    ? 'Delay Alert'
                    : correlation.overallStatus === 'minor_slowdown'
                    ? 'Minor Slowdown'
                    : 'Clear Corridor'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stop {busStopCode} ({correlation.busStop.name}) · Corridor: {correlation.busStop.corridor}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">
              {correlation.impacts.length} Incident(s) in Corridor
            </span>
          </div>
        </div>

        {/* Traffic impact summary prose */}
        <p className="text-xs text-slate-300 leading-relaxed pt-3">
          {correlation.delaySummary}
        </p>

        {/* List of Correlated Road Incidents */}
        {correlation.impacts.length > 0 && (
          <div className="mt-3 space-y-2 pt-2 border-t border-slate-800/60">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              Linked Expressway Incident Feeds:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {correlation.impacts.map((impact: BusRouteImpact) => {
                const inc = impact.incident;
                const cam = cameras.find((c) => c.id === inc.cameraFeedId || c.expressway === inc.expressway);

                return (
                  <div
                    key={inc.id}
                    className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-800 text-white">
                            {inc.expressway}
                          </span>
                          <span className="font-semibold text-slate-200">{inc.type}</span>
                        </div>
                        <span className="font-mono text-[11px] text-amber-400">
                          +{impact.estimatedDelayMins}m est. delay
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2">{inc.message}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-900 text-[11px]">
                      <span className="text-slate-500 font-mono">
                        {impact.distanceKm} km from bus stop
                      </span>
                      <button
                        onClick={() => setActiveIncidentModal(inc)}
                        className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1"
                      >
                        <Camera className="w-3 h-3 text-emerald-400" />
                        <span>Inspect CCTV Alert →</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Active Bus Stop Information Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          <span>Bus Stop Code: </span>
          <span className="font-mono font-bold text-white text-sm">{busStopCode}</span>
          <span className="text-slate-600 mx-2">·</span>
          <span>{data?.Services?.length || 0} Operating Services</span>
        </div>
        <span className="text-slate-500 text-[11px]">Last synced: {lastRefreshed.toLocaleTimeString()}</span>
      </div>

      {/* Bus Services Grid with Traffic Impact Correlation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(!data?.Services || data.Services.length === 0) ? (
          <div className="col-span-full py-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
            <Bus className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-300">No Active Services Found for Stop {busStopCode}</h4>
            <p className="text-xs text-slate-500 mt-1">
              Verify the 5-digit bus stop code or try quick stops like 83139 or 01012.
            </p>
          </div>
        ) : (
          data.Services.map((service: BusServiceArrival) => {
            const next1 = calculateMinutesUntil(service.NextBus?.EstimatedArrival);
            const next2 = calculateMinutesUntil(service.NextBus2?.EstimatedArrival);
            const next3 = calculateMinutesUntil(service.NextBus3?.EstimatedArrival);
            const loadBadge = getLoadBadge(service.NextBus?.Load);

            // Compute route-specific delay if incident occurs along serving corridor
            const routeDelay = correlation.overallStatus === 'severe_disruption' ? 6 : correlation.overallStatus === 'minor_slowdown' ? 3 : 0;
            const adjustedEtaMinutes = next1.minutes !== 999 ? Math.max(0, next1.minutes + routeDelay) : null;

            return (
              <div
                key={service.ServiceNo}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  {/* Service Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-9 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center font-bold text-base font-mono text-white">
                        {service.ServiceNo}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-300 block">{service.Operator}</span>
                        <span className="text-[10px] text-slate-500">Scheduled Route</span>
                      </div>
                    </div>

                    <div className={`px-2 py-0.5 rounded text-[10px] border font-medium ${loadBadge.color}`}>
                      {loadBadge.label}
                    </div>
                  </div>

                  {/* Primary Next Bus Highlight */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 mb-3">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                        Next Bus
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span>{getTypeLabel(service.NextBus?.Type)}</span>
                        {service.NextBus?.Feature === 'WAB' && (
                          <span title="Wheelchair Accessible">
                            <Accessibility className="w-3.5 h-3.5 text-sky-400" />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span
                        className={`text-3xl font-extrabold font-mono tabular-nums ${
                          next1.isArriving ? 'text-emerald-400 animate-pulse' : 'text-white'
                        }`}
                      >
                        {next1.text}
                      </span>
                      {service.NextBus?.EstimatedArrival && (
                        <span className="text-[11px] font-mono text-slate-500">
                          ({new Date(service.NextBus.EstimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      )}
                    </div>

                    {/* Route Traffic Delay Adjustment Indicator */}
                    {routeDelay > 0 && !next1.isArriving && (
                      <div className="mt-2 pt-2 border-t border-slate-900 text-xs flex items-center justify-between text-amber-300">
                        <span className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>Traffic adjusted:</span>
                        </span>
                        <span className="font-mono font-bold">
                          ~{adjustedEtaMinutes} mins (+{routeDelay}m slow traffic)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Following Buses Strip */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/70">
                      <span className="text-[10px] text-slate-500 block">Following Bus</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-mono font-bold text-slate-200">{next2.text}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {getTypeLabel(service.NextBus2?.Type)}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/70">
                      <span className="text-[10px] text-slate-500 block">3rd Bus</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-mono font-bold text-slate-200">{next3.text}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {getTypeLabel(service.NextBus3?.Type)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer linking Traffic Corridors */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 mt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-1">
                    {correlation.impacts.length > 0 ? (
                      <span className="text-amber-400 flex items-center gap-1 font-medium">
                        <ShieldAlert className="w-3 h-3" />
                        <span>Corridor Alert</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>Route Clear</span>
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-slate-400">
                    {service.NextBus?.Latitude ? `${service.NextBus.Latitude}, ${service.NextBus.Longitude}` : 'En route'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Incident & CCTV Modal */}
      {activeIncidentModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setActiveIncidentModal(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-white">
                    {activeIncidentModal.expressway}
                  </span>
                  <span className="text-xs font-bold text-rose-400 uppercase">
                    {activeIncidentModal.type}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {activeIncidentModal.location}
                </h3>
              </div>
              <button
                onClick={() => setActiveIncidentModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
              {activeIncidentModal.message}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Affected Lanes</span>
                <span className="font-medium text-slate-200">{activeIncidentModal.lanesAffected || 'All lanes affected'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[11px]">Est. Clearance</span>
                <span className="font-mono text-amber-300 font-semibold">
                  ~{activeIncidentModal.estimatedClearanceMinutes} minutes
                </span>
              </div>
            </div>

            {/* Camera preview if available */}
            {cameras.find((c) => c.expressway === activeIncidentModal.expressway) && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-sky-400" />
                  <span>Expressway CCTV Surveillance Snapshot</span>
                </span>
                <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-700 bg-black">
                  <img
                    src={cameras.find((c) => c.expressway === activeIncidentModal.expressway)?.imageUrl}
                    alt="Expressway Surveillance CCTV"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400">
                    LIVE LTA CAM
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveIncidentModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
