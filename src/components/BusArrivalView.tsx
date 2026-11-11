import React, { useEffect, useState } from 'react';
import { BusArrivalResponse, BusServiceArrival, NextBusInfo } from '../types/transit';
import { TransitService } from '../services/ltaClient';
import {
  Accessibility,
  ArrowRight,
  Bus,
  Clock,
  Compass,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Users,
  Zap,
} from 'lucide-react';

interface Props {
  initialBusStopCode?: string;
}

const COMMON_STOPS = [
  { code: '83139', name: 'Opp Block 831 (Eunos / Still Rd)' },
  { code: '01012', name: 'Bugis Stn Exit B (Victoria St)' },
  { code: '03218', name: 'Opp Suntec Convention Ctr' },
  { code: '10011', name: 'Opp VivoCity (Telok Blangah Rd)' },
  { code: '65009', name: 'Tampines Interchange' },
  { code: '28009', name: 'Jurong East Interchange' },
];

export const BusArrivalView: React.FC<Props> = ({ initialBusStopCode = '83139' }) => {
  const [busStopCode, setBusStopCode] = useState(initialBusStopCode);
  const [inputCode, setInputCode] = useState(initialBusStopCode);
  const [data, setData] = useState<BusArrivalResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState(20); // 20-second refresh requirement

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
      {/* Header and Stop Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bus className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Singapore Bus Arrival Telemetry (v3 Endpoint)
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Live serverless proxy connection to LTA DataMall v3 BusArrival (20-second cadence)
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

        {/* Common Stop Shortcuts */}
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

      {/* Stop Information & Notice */}
      {data?._warning && (
        <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs text-amber-200/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{data._warning}</span>
          </div>
          <span className="font-mono text-[10px] text-amber-400 uppercase">Simulator Payload</span>
        </div>
      )}

      {/* Active Stop Details */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          <span>Bus Stop Code: </span>
          <span className="font-mono font-bold text-white text-sm">{busStopCode}</span>
          <span className="text-slate-600 mx-2">·</span>
          <span>{data?.Services?.length || 0} Bus Services Operating</span>
        </div>
        <span className="text-slate-500 text-[11px]">Last synced: {lastRefreshed.toLocaleTimeString()}</span>
      </div>

      {/* Bus Services Grid */}
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

                {/* Footer GPS status */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 mt-3 border-t border-slate-800/80">
                  <span>GPS Telemetry</span>
                  <span className="font-mono text-slate-400">
                    {service.NextBus?.Latitude ? `${service.NextBus.Latitude}, ${service.NextBus.Longitude}` : 'En route'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
