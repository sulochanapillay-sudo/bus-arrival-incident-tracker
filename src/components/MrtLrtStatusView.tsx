import React, { useState } from 'react';
import { MrtLine, StationInfo } from '../types/transit';
import {
  AlertTriangle,
  Bus,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  RefreshCw,
  Train,
  Users,
} from 'lucide-react';

interface Props {
  lines: MrtLine[];
  onToggleDelay: (lineId: string) => void;
  onSelectStationOnMap?: (station: StationInfo) => void;
}

export const MrtLrtStatusView: React.FC<Props> = ({
  lines,
  onToggleDelay,
  onSelectStationOnMap,
}) => {
  const [expandedLineId, setExpandedLineId] = useState<string | null>('TEL');
  const [selectedTimingsLine, setSelectedTimingsLine] = useState<MrtLine | null>(null);

  const disruptedLines = lines.filter((l) => l.status !== 'normal');
  const normalLinesCount = lines.filter((l) => l.status === 'normal').length;

  return (
    <div className="space-y-6">
      {/* Network Overview Summary Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Train className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Singapore MRT & LRT Rail Network Status
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Real-time Land Transport Authority (LTA) & SMRT / SBS Transit Train Service Status
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>{normalLinesCount} Lines Normal</span>
            </div>
            {disruptedLines.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>{disruptedLines.length} Line Alert</span>
              </div>
            )}
          </div>
        </div>

        {/* If any line is disrupted, show prominent commuter alert */}
        {disruptedLines.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-amber-950/20 border border-amber-800/60 space-y-3">
            {disruptedLines.map((disrupted) => (
              <div key={disrupted.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-bold font-mono text-white"
                      style={{ backgroundColor: disrupted.color }}
                    >
                      {disrupted.code}
                    </span>
                    <span className="text-sm font-semibold text-white">{disrupted.name} Disruption Alert</span>
                  </div>
                  <span className="text-xs font-mono text-amber-300 font-semibold">
                    +{disrupted.delayMinutes} mins extra time
                  </span>
                </div>

                <p className="text-xs text-amber-200/90 leading-relaxed">
                  {disrupted.disruptionMessage}
                </p>

                {disrupted.freeBridgingBusAvailable && (
                  <div className="flex items-start gap-2 pt-2 text-xs text-emerald-300 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-900/60">
                    <Bus className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold block">Free Bridging Bus Service Activated</span>
                      <span className="text-emerald-200/80 text-[11px]">{disrupted.bridgingBusDetails}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real Platform Live Station Concourse Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Train className="w-4 h-4 text-emerald-400" />
              <span>All Rail Lines Operating Status</span>
            </h3>
            <span className="text-xs text-slate-500">Tap line to expand station crowd levels</span>
          </div>

          {/* Line by line accordion */}
          <div className="space-y-2.5">
            {lines.map((line) => {
              const isExpanded = expandedLineId === line.id;
              const isDelayed = line.status !== 'normal';

              return (
                <div
                  key={line.id}
                  className={`border rounded-xl transition-all overflow-hidden ${
                    isDelayed
                      ? 'border-amber-700/60 bg-amber-950/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  {/* Line header row */}
                  <div
                    onClick={() => setExpandedLineId(isExpanded ? null : line.id)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      {/* Authentic MRT Color Badge */}
                      <div
                        className="w-10 h-7 rounded flex items-center justify-center font-mono font-bold text-xs shadow-sm"
                        style={{ backgroundColor: line.color, color: line.textColor }}
                      >
                        {line.code}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white">{line.name}</h4>
                          <span className="text-xs text-slate-500 hidden sm:inline">
                            · {line.stationsCount} Stations
                          </span>
                        </div>
                        <div className="text-xs mt-0.5">
                          {isDelayed ? (
                            <span className="text-amber-400 font-medium">{line.statusText}</span>
                          ) : (
                            <span className="text-emerald-400 font-medium">Normal Service</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Simulator Delay Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleDelay(line.id);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                          isDelayed
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                        }`}
                        title="Simulate delay on this line"
                      >
                        {isDelayed ? 'Restore Normal' : 'Test Delay'}
                      </button>

                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Station Crowd Level Matrix */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 bg-slate-900/50">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-3 pt-2">
                        <span className="font-semibold text-slate-300">Station Platform Crowd Levels:</span>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Low
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Moderate
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span> High
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {line.stations.map((st: StationInfo) => {
                          const crowdBg =
                            st.crowdLevel === 'high'
                              ? 'border-rose-800/60 bg-rose-950/20 text-rose-300'
                              : st.crowdLevel === 'moderate'
                              ? 'border-amber-800/60 bg-amber-950/20 text-amber-300'
                              : 'border-slate-800 bg-slate-900 text-slate-300';

                          return (
                            <div
                              key={st.code}
                              onClick={() => onSelectStationOnMap?.(st)}
                              className={`p-2 rounded-lg border text-xs cursor-pointer hover:border-sky-500 transition-colors ${crowdBg}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-mono text-[10px] opacity-75 font-bold">
                                  {st.code}
                                </span>
                                <span className="text-[10px] capitalize font-medium">
                                  {st.crowdLevel}
                                </span>
                              </div>
                              <div className="font-medium truncate text-white">{st.name}</div>
                              {st.interchanges && (
                                <div className="flex gap-1 mt-1.5">
                                  {st.interchanges.map((ic: string) => (
                                    <span
                                      key={ic}
                                      className="px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300"
                                    >
                                      {ic}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 text-xs">
                        <span className="text-slate-500">First train: 05:30 AM · Last train: 23:55 PM</span>
                        <button
                          onClick={() => setSelectedTimingsLine(line)}
                          className="text-sky-400 hover:text-sky-300 text-xs font-medium"
                        >
                          View Full Timetable →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Station Concourse Spotlight & Commuter Tips */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="relative aspect-video bg-slate-950">
              <img
                src="/src/assets/images/mrt_station_platform_1794368933220.jpg"
                alt="Singapore Sengkang NE16 MRT Platform"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur px-2.5 py-1 rounded text-xs font-mono text-white">
                Sengkang NE16 Concourse
              </div>
              <div className="absolute bottom-2.5 right-2.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded">
                PLATFORM SENSORS ACTIVE
              </div>
            </div>

            <div className="p-4 space-y-3">
              <h4 className="text-sm font-semibold text-white">Station Capacity Analytics</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Optical crowd flow sensors indicate peak platform boarding rates across Northeast interchanges. Commuters are advised to move towards carriage 1 and carriage 6 for smoother embarkation.
              </p>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Fare Gate Latency</span>
                  <span className="font-mono text-emerald-400 font-semibold">&lt; 0.2s</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Train Headway (Peak)</span>
                  <span className="font-mono text-slate-200">2 - 3 minutes</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Train Headway (Off-Peak)</span>
                  <span className="font-mono text-slate-200">5 - 7 minutes</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <Info className="w-4 h-4 text-sky-400" />
              <span>Singapore Rail Fast Facts</span>
            </div>
            <p>
              The Singapore MRT network spans over 230 km with 140+ stations. Operating hours run daily from approx 5:30 AM to midnight.
            </p>
          </div>
        </div>
      </div>

      {/* Timetable Modal */}
      {selectedTimingsLine && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTimingsLine(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{selectedTimingsLine.name} Timetable</h3>
                <span className="text-xs text-slate-400 font-mono">
                  Standard Train Departure Windows (Mondays - Sundays)
                </span>
              </div>
              <button
                onClick={() => setSelectedTimingsLine(null)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-200">Terminal 1: {selectedTimingsLine.stations[0]?.name}</div>
                <div className="flex justify-between text-slate-400">
                  <span>First Train (Mon - Sat):</span>
                  <span className="font-mono text-white">05:28 AM</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>First Train (Sun / Public Hol):</span>
                  <span className="font-mono text-white">05:54 AM</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Last Train (Connecting):</span>
                  <span className="font-mono text-white">23:42 PM</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-200">
                  Terminal 2: {selectedTimingsLine.stations[selectedTimingsLine.stations.length - 1]?.name}
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>First Train (Mon - Sat):</span>
                  <span className="font-mono text-white">05:32 AM</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Last Train:</span>
                  <span className="font-mono text-white">00:08 AM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
