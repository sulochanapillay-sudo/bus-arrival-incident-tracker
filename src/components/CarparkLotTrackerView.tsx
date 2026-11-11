import React, { useState } from 'react';
import { CarparkAgency, CarparkArea, CarparkLot } from '../types/transit';
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  Clock,
  Compass,
  Filter,
  Info,
  Layers,
  MapPin,
  ParkingSquare,
  Search,
  SlidersHorizontal,
  Table,
  Zap,
} from 'lucide-react';

interface Props {
  carparks: CarparkLot[];
  onSelectCarparkOnMap: (carpark: CarparkLot) => void;
}

export const CarparkLotTrackerView: React.FC<Props> = ({
  carparks,
  onSelectCarparkOnMap,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [selectedAgency, setSelectedAgency] = useState<string>('ALL');
  const [onlyEvAvailable, setOnlyEvAvailable] = useState(false);
  const [onlyHighAvailability, setOnlyHighAvailability] = useState(false);
  const [sortBy, setSortBy] = useState<'available_desc' | 'occupancy_asc' | 'filling_fast' | 'name'>('available_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('sg_bookmarked_carparks') || '[]');
    } catch {
      return [];
    }
  });
  const [inspectCarparkRates, setInspectCarparkRates] = useState<CarparkLot | null>(null);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      try {
        localStorage.setItem('sg_bookmarked_carparks', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Calculations for summary KPI strip
  const totalLotsCount = carparks.reduce((acc, c) => acc + c.totalLots, 0);
  const totalAvailableCount = carparks.reduce((acc, c) => acc + c.availableLots, 0);
  const avgOccupancy = Math.round(((totalLotsCount - totalAvailableCount) / totalLotsCount) * 100);
  const totalEvAvailable = carparks.reduce((acc, c) => acc + c.availableEvLots, 0);
  const totalEvLots = carparks.reduce((acc, c) => acc + c.evChargingLots, 0);

  // Filtering
  const filtered = carparks.filter((cp) => {
    if (selectedArea !== 'ALL' && cp.area !== selectedArea) return false;
    if (selectedAgency !== 'ALL' && cp.agency !== selectedAgency) return false;
    if (onlyEvAvailable && cp.availableEvLots === 0) return false;
    if (onlyHighAvailability && cp.availableLots < 30) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        cp.name.toLowerCase().includes(q) ||
        cp.address.toLowerCase().includes(q) ||
        cp.area.toLowerCase().includes(q) ||
        cp.agency.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'available_desc') return b.availableLots - a.availableLots;
    if (sortBy === 'occupancy_asc') return a.occupancyPercent - b.occupancyPercent;
    if (sortBy === 'filling_fast') {
      const score = (x: CarparkLot) => (x.trend === 'filling_fast' ? 2 : x.trend === 'stable' ? 1 : 0);
      return score(b) - score(a);
    }
    return a.name.localeCompare(b.name);
  });

  const areas: Array<CarparkArea | 'ALL'> = [
    'ALL',
    'Marina Bay',
    'Orchard',
    'Central / CBD',
    'East',
    'West',
    'North',
    'North-East',
  ];

  const agencies: Array<CarparkAgency | 'ALL'> = ['ALL', 'HDB', 'URA', 'Commercial'];

  return (
    <div className="space-y-6">
      {/* High-Level Carpark KPI Strip (Tabular Numerals) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Available Lots Islandwide</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
              {totalAvailableCount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ {totalLotsCount.toLocaleString()}</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">LTA & HDB Sensor Network</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Islandwide Occupancy</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-100">
              {avgOccupancy}%
            </span>
            <span className="text-xs text-amber-400 font-mono font-medium">Moderate</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${avgOccupancy}%` }}></div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">EV Chargers Available</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-sky-400">
              {totalEvAvailable}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ {totalEvLots} total points</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">Type 2 AC & CCS DC Fast</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block mb-1">Monitored Facilities</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-100">
              {carparks.length}
            </span>
            <span className="text-xs text-slate-500">Carparks</span>
          </div>
          <span className="text-[11px] text-emerald-400 block mt-1">HDB, URA & Major Malls</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ParkingSquare className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Real-Time Carpark Lot Availability
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Live capacity monitoring across Singapore Shopping Centres, HDB Hubs, and URA public parking
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                  viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Card Grid</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
                  viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Data Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search mall name, HDB estate or road..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Area Filter */}
          <div>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a === 'ALL' ? 'All Areas' : a}
                </option>
              ))}
            </select>
          </div>

          {/* Agency Filter */}
          <div>
            <select
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              {agencies.map((ag) => (
                <option key={ag} value={ag}>
                  {ag === 'ALL' ? 'All Agencies' : `${ag} Managed`}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="available_desc">Most Available Lots</option>
              <option value="occupancy_asc">Lowest Occupancy %</option>
              <option value="filling_fast">Filling Fast Alert</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Quick Checkbox Toggles & Results Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyEvAvailable}
                onChange={(e) => setOnlyEvAvailable(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span className="flex items-center gap-1 text-slate-300">
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                <span>EV Charging Available</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyHighAvailability}
                onChange={(e) => setOnlyHighAvailability(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0"
              />
              <span className="text-slate-300">&gt; 30 Lots Available</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span>
              Found <span className="font-mono text-white font-semibold">{sorted.length}</span> carparks
            </span>
            {bookmarkedIds.length > 0 && (
              <span className="text-amber-400 font-mono text-[11px]">
                ({bookmarkedIds.length} Bookmarked)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* View Mode: Card Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((cp) => {
            const isBookmarked = bookmarkedIds.includes(cp.id);
            const isCritical = cp.availableLots < 15;
            const isAbundant = cp.availableLots > 50;

            return (
              <div
                key={cp.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  {/* Top metadata strip (NO PILLS - Clean unboxed text with subtle separators) */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-200">{cp.agency}</span>
                      <span aria-hidden="true">·</span>
                      <span>{cp.area}</span>
                      {cp.epsSystem && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-[10px] text-slate-400">EPS</span>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => toggleBookmark(cp.id)}
                      className={`p-1 rounded transition-colors ${
                        isBookmarked ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={isBookmarked ? 'Remove bookmark' : 'Bookmark carpark'}
                    >
                      {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Carpark Name */}
                  <h3 className="text-base font-bold text-white tracking-tight mb-1">
                    {cp.name}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mb-4">{cp.address}</p>

                  {/* Real-Time Availability Highlight */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 mb-4">
                    <div className="flex items-baseline justify-between mb-2">
                      <div>
                        <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
                          Available Lots
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span
                            className={`text-3xl font-extrabold font-mono tabular-nums ${
                              isAbundant
                                ? 'text-emerald-400'
                                : isCritical
                                ? 'text-rose-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {cp.availableLots}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">/ {cp.totalLots} total</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block font-medium">Occupancy</span>
                        <span className="text-lg font-bold font-mono tabular-nums text-slate-200">
                          {cp.occupancyPercent}%
                        </span>
                      </div>
                    </div>

                    {/* Occupancy bar */}
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCritical ? 'bg-rose-500' : isAbundant ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${cp.occupancyPercent}%` }}
                      ></div>
                    </div>

                    {/* Trend & EV status */}
                    <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-slate-900">
                      <div className="flex items-center gap-1.5">
                        {cp.trend === 'filling_fast' && (
                          <span className="flex items-center gap-1 text-rose-400 text-[11px] font-medium">
                            <ArrowUp className="w-3.5 h-3.5" /> Filling Fast
                          </span>
                        )}
                        {cp.trend === 'emptying' && (
                          <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-medium">
                            <ArrowDown className="w-3.5 h-3.5" /> Lots Opening
                          </span>
                        )}
                        {cp.trend === 'stable' && (
                          <span className="text-slate-400 text-[11px]">Stable Inflow</span>
                        )}
                      </div>

                      {cp.evChargingLots > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-sky-400">
                          <Zap className="w-3 h-3" />
                          <span>
                            {cp.availableEvLots} of {cp.evChargingLots} EV Free
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                  <button
                    onClick={() => setInspectCarparkRates(cp)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    View Parking Rates
                  </button>

                  <button
                    onClick={() => onSelectCarparkOnMap(cp)}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Show on Map</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* View Mode: High-Density Data Table (SaaS Reference Compliant) */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Carpark / Facility</th>
                  <th className="py-3 px-4">Agency & Area</th>
                  <th className="py-3 px-4 text-right">Available Lots</th>
                  <th className="py-3 px-4 text-right">Total Capacity</th>
                  <th className="py-3 px-4 text-right">Occupancy %</th>
                  <th className="py-3 px-4">EV Charging</th>
                  <th className="py-3 px-4">Trend</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-normal">
                {sorted.map((cp) => {
                  const isCritical = cp.availableLots < 15;
                  const isAbundant = cp.availableLots > 50;

                  return (
                    <tr
                      key={cp.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectCarparkOnMap(cp)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white group-hover:text-emerald-300">
                          {cp.name}
                        </div>
                        <span className="text-[11px] text-slate-500 truncate block max-w-xs">
                          {cp.address}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        <div>{cp.area}</div>
                        <span className="text-[11px] text-slate-500 font-mono">{cp.agency}</span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <span
                          className={`text-sm font-bold ${
                            isAbundant
                              ? 'text-emerald-400'
                              : isCritical
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {cp.availableLots}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-400">
                        {cp.totalLots}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-200">
                        {cp.occupancyPercent}%
                      </td>

                      <td className="py-3 px-4">
                        {cp.evChargingLots > 0 ? (
                          <span className="text-sky-400 font-mono">
                            {cp.availableEvLots} / {cp.evChargingLots}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {cp.trend === 'filling_fast' && (
                          <span className="text-rose-400 text-[11px] font-medium flex items-center gap-1">
                            <ArrowUp className="w-3 h-3" /> Filling
                          </span>
                        )}
                        {cp.trend === 'emptying' && (
                          <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                            <ArrowDown className="w-3 h-3" /> Freeing
                          </span>
                        )}
                        {cp.trend === 'stable' && <span className="text-slate-500 text-[11px]">Stable</span>}
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setInspectCarparkRates(cp)}
                            className="p-1 text-slate-400 hover:text-white rounded"
                            title="Rates"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onSelectCarparkOnMap(cp)}
                            className="p-1 text-emerald-400 hover:text-emerald-300 rounded"
                            title="Show on Map"
                          >
                            <MapPin className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Parking Rates Inspector Modal */}
      {inspectCarparkRates && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setInspectCarparkRates(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{inspectCarparkRates.name}</h3>
                <span className="text-xs text-slate-400">
                  {inspectCarparkRates.agency} · {inspectCarparkRates.area} · Electronic Parking (EPS)
                </span>
              </div>
              <button
                onClick={() => setInspectCarparkRates(null)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-xs"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">
                  Weekday Day Rates
                </span>
                <p className="text-slate-200 font-medium">{inspectCarparkRates.rates.weekdayPeak}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">
                  Weekday Evening / Night Rates
                </span>
                <p className="text-slate-200 font-medium">{inspectCarparkRates.rates.weekdayOffPeak}</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">
                  Saturday, Sunday & Public Holidays
                </span>
                <p className="text-slate-200 font-medium">{inspectCarparkRates.rates.weekend}</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-lg text-emerald-300">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Grace Period for Drop-off / Pick-up</span>
                </div>
                <span className="font-mono font-bold text-sm">
                  {inspectCarparkRates.rates.gracePeriodMinutes} mins
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
