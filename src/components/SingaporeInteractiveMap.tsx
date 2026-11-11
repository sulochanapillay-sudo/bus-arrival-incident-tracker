import React, { useState } from 'react';
import {
  CarparkLot,
  MrtLine,
  StationInfo,
  TrafficCamera,
  TrafficIncident,
} from '../types/transit';
import {
  AlertTriangle,
  Camera,
  Layers,
  MapPin,
  Maximize2,
  Navigation,
  Train,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface Props {
  incidents: TrafficIncident[];
  mrtLines: MrtLine[];
  carparks: CarparkLot[];
  cameras: TrafficCamera[];
  onSelectIncident?: (incident: TrafficIncident) => void;
  onSelectCarpark?: (carpark: CarparkLot) => void;
  onSelectCamera?: (camera: TrafficCamera) => void;
  onSelectMrtLine?: (line: MrtLine) => void;
  selectedIncidentId?: string | null;
  selectedCarparkId?: string | null;
}

// Projection bounds for Singapore Island
const SG_BOUNDS = {
  minLat: 1.220,
  maxLat: 1.465,
  minLng: 103.600,
  maxLng: 104.040,
  width: 960,
  height: 560,
};

export const geoToSvg = (lat: number, lng: number) => {
  const x = ((lng - SG_BOUNDS.minLng) / (SG_BOUNDS.maxLng - SG_BOUNDS.minLng)) * SG_BOUNDS.width;
  const y = ((SG_BOUNDS.maxLat - lat) / (SG_BOUNDS.maxLat - SG_BOUNDS.minLat)) * SG_BOUNDS.height;
  return { x: Math.max(10, Math.min(SG_BOUNDS.width - 10, x)), y: Math.max(10, Math.min(SG_BOUNDS.height - 10, y)) };
};

export const SingaporeInteractiveMap: React.FC<Props> = ({
  incidents,
  mrtLines,
  carparks,
  cameras,
  onSelectIncident,
  onSelectCarpark,
  onSelectCamera,
  onSelectMrtLine,
  selectedIncidentId,
  selectedCarparkId,
}) => {
  // Layer toggles
  const [showIncidents, setShowIncidents] = useState(true);
  const [showMrt, setShowMrt] = useState(true);
  const [showCarparks, setShowCarparks] = useState(true);
  const [showCameras, setShowCameras] = useState(true);

  // Zoom / View state
  const [zoomLevel, setZoomLevel] = useState(1);
  const [viewCenter, setViewCenter] = useState<{ x: number; y: number }>({ x: 480, y: 280 });
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'incident' | 'carpark' | 'camera' | 'mrt';
    data: any;
  } | null>(null);

  const resetZoom = () => {
    setZoomLevel(1);
    setViewCenter({ x: 480, y: 280 });
  };

  const focusRegion = (region: 'island' | 'cbd' | 'orchard' | 'east' | 'west' | 'north') => {
    if (region === 'island') {
      resetZoom();
    } else if (region === 'cbd' || region === 'orchard') {
      setZoomLevel(2.2);
      // Orchard / Marina coords in SVG space
      const pos = geoToSvg(1.295, 103.845);
      setViewCenter(pos);
    } else if (region === 'east') {
      setZoomLevel(2.0);
      const pos = geoToSvg(1.340, 103.940);
      setViewCenter(pos);
    } else if (region === 'west') {
      setZoomLevel(2.0);
      const pos = geoToSvg(1.335, 103.730);
      setViewCenter(pos);
    } else if (region === 'north') {
      setZoomLevel(2.0);
      const pos = geoToSvg(1.430, 103.800);
      setViewCenter(pos);
    }
  };

  // Main Singapore Island SVG outline path (approximated geo polygon in SVG coords)
  const islandPath = `
    M 80,310 
    C 90,260 120,220 180,180 
    C 210,160 250,110 330,85 
    C 400,65 470,70 510,95 
    C 550,110 610,105 670,120 
    C 740,140 820,165 880,210 
    C 905,230 915,260 900,285 
    C 880,310 830,340 760,375 
    C 690,410 620,440 560,455 
    C 510,470 470,460 440,435 
    C 410,410 370,415 320,430 
    C 260,450 200,445 150,420 
    C 110,400 80,360 80,310 Z
  `;

  // Sentosa Island
  const sentosaPath = `
    M 420,475 
    C 450,470 480,480 490,495 
    C 485,510 440,515 415,505 
    C 405,495 410,480 420,475 Z
  `;

  // Jurong Island
  const jurongIslandPath = `
    M 170,420 
    C 210,410 240,430 235,460 
    C 225,485 180,490 150,465 
    C 140,440 155,425 170,420 Z
  `;

  // Pulau Ubin
  const ubinPath = `
    M 760,95 
    C 790,90 825,100 820,115 
    C 805,125 765,120 755,105 Z
  `;

  // Major expressways paths (in SVG space)
  const expressways = [
    {
      name: 'PIE',
      d: 'M 140,320 C 220,310 330,290 440,290 C 530,290 640,300 760,260 L 870,230',
      labelX: 470,
      labelY: 285,
    },
    {
      name: 'AYE',
      d: 'M 90,320 C 150,330 250,370 360,400 C 420,420 480,440 520,440',
      labelX: 280,
      labelY: 375,
    },
    {
      name: 'ECP',
      d: 'M 525,440 C 600,435 690,395 780,350 L 870,240',
      labelX: 680,
      labelY: 395,
    },
    {
      name: 'CTE',
      d: 'M 490,440 L 485,340 C 485,260 480,180 470,110',
      labelX: 495,
      labelY: 220,
    },
    {
      name: 'BKE',
      d: 'M 350,290 C 350,230 355,170 365,115',
      labelX: 340,
      labelY: 180,
    },
    {
      name: 'SLE',
      d: 'M 365,115 C 410,120 480,120 540,135',
      labelX: 440,
      labelY: 110,
    },
    {
      name: 'TPE',
      d: 'M 540,135 C 620,135 730,170 820,230',
      labelX: 680,
      labelY: 145,
    },
    {
      name: 'KPE',
      d: 'M 520,430 C 535,360 550,280 560,210',
      labelX: 570,
      labelY: 300,
    },
  ];

  return (
    <div className="relative w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/95 border-b border-slate-800 z-10 backdrop-blur">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase">Singapore Transit & Lot Map</span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400">WGS84 Real-Time Projection</span>
        </div>

        {/* Layer Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              showIncidents
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Incidents ({incidents.length})</span>
          </button>

          <button
            onClick={() => setShowMrt(!showMrt)}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              showMrt
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            <Train className="w-3.5 h-3.5" />
            <span>MRT/LRT Lines</span>
          </button>

          <button
            onClick={() => setShowCarparks(!showCarparks)}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              showCarparks
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Carparks ({carparks.length})</span>
          </button>

          <button
            onClick={() => setShowCameras(!showCameras)}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1.5 ${
              showCameras
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>CCTV Cameras</span>
          </button>
        </div>

        {/* Region Presets & Zoom */}
        <div className="flex items-center gap-1">
          <div className="hidden sm:flex items-center gap-1 mr-2 text-xs text-slate-400">
            <span>Jump to:</span>
            <button
              onClick={() => focusRegion('cbd')}
              className="px-2 py-0.5 text-xs rounded hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              CBD / Marina
            </button>
            <button
              onClick={() => focusRegion('west')}
              className="px-2 py-0.5 text-xs rounded hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              Jurong
            </button>
            <button
              onClick={() => focusRegion('east')}
              className="px-2 py-0.5 text-xs rounded hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              Bedok / Tampines
            </button>
            <button
              onClick={() => focusRegion('north')}
              className="px-2 py-0.5 text-xs rounded hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              Woodlands
            </button>
          </div>

          <div className="flex items-center bg-slate-800 rounded p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, z + 0.3))}
              className="p-1 hover:bg-slate-700 text-slate-300 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.3))}
              className="p-1 hover:bg-slate-700 text-slate-300 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetZoom}
              className="p-1 hover:bg-slate-700 text-slate-300 rounded"
              title="Reset View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full h-[460px] sm:h-[520px] bg-slate-950 overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${SG_BOUNDS.width} ${SG_BOUNDS.height}`}
          className="w-full h-full transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: `${viewCenter.x}px ${viewCenter.y}px`,
          }}
        >
          <defs>
            {/* Water gradient */}
            <linearGradient id="seaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#081020" />
              <stop offset="100%" stopColor="#0b172a" />
            </linearGradient>

            {/* Landmass gradient */}
            <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#172033" />
            </linearGradient>

            {/* Glowing incident pulse */}
            <filter id="glowIncident" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Ocean / Johor Straits / Singapore Strait */}
          <rect width={SG_BOUNDS.width} height={SG_BOUNDS.height} fill="url(#seaGrad)" />

          {/* Subtle Latitude/Longitude Grid Lines */}
          <g stroke="#334155" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.4">
            <line x1="0" y1="140" x2={SG_BOUNDS.width} y2="140" />
            <line x1="0" y1="280" x2={SG_BOUNDS.width} y2="280" />
            <line x1="0" y1="420" x2={SG_BOUNDS.width} y2="420" />
            <line x1="240" y1="0" x2="240" y2={SG_BOUNDS.height} />
            <line x1="480" y1="0" x2="480" y2={SG_BOUNDS.height} />
            <line x1="720" y1="0" x2="720" y2={SG_BOUNDS.height} />
          </g>

          {/* Geographic Landmass: Main Island & Islands */}
          <g id="landmass">
            {/* Main Island */}
            <path
              d={islandPath}
              fill="url(#landGrad)"
              stroke="#334155"
              strokeWidth="1.5"
              className="transition-all"
            />
            {/* Sentosa */}
            <path d={sentosaPath} fill="url(#landGrad)" stroke="#334155" strokeWidth="1" />
            {/* Jurong Island */}
            <path d={jurongIslandPath} fill="url(#landGrad)" stroke="#334155" strokeWidth="1" />
            {/* Pulau Ubin */}
            <path d={ubinPath} fill="url(#landGrad)" stroke="#334155" strokeWidth="1" />
          </g>

          {/* Geographic Labels */}
          <g fill="#64748b" fontSize="11" fontWeight="600" letterSpacing="0.08em" opacity="0.6">
            <text x="70" y="475">JURONG ISLAND</text>
            <text x="440" y="525">SENTOSA</text>
            <text x="760" y="80">PULAU UBIN</text>
            <text x="440" y="40">STRAITS OF JOHOR (MALAYSIA)</text>
            <text x="560" y="530">SINGAPORE STRAIT</text>
          </g>

          {/* Major Expressways Network */}
          <g id="expressways" strokeLinecap="round" strokeLinejoin="round">
            {expressways.map((exp) => (
              <g key={exp.name}>
                {/* Road Casing */}
                <path d={exp.d} fill="none" stroke="#0f172a" strokeWidth="5" />
                {/* Road Centerline */}
                <path
                  d={exp.d}
                  fill="none"
                  stroke="#475569"
                  strokeWidth="2.5"
                  className="hover:stroke-sky-400 transition-colors cursor-pointer"
                />
                {/* Road Label */}
                <text
                  x={exp.labelX}
                  y={exp.labelY}
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                >
                  {exp.name}
                </text>
              </g>
            ))}
          </g>

          {/* MRT / LRT Lines & Stations Layer */}
          {showMrt && (
            <g id="mrt-lines">
              {mrtLines.map((line) => {
                if (!line.stations || line.stations.length < 2) return null;
                // Generate path connecting stations in order
                const points = line.stations.map((st: StationInfo) => geoToSvg(st.lat, st.lng));
                const pathD = points.reduce((acc: string, p: { x: number; y: number }, idx: number) => `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x},${p.y}`, '');

                return (
                  <g key={line.id} className="cursor-pointer" onClick={() => onSelectMrtLine?.(line)}>
                    {/* Shadow / outline */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Main Line with authentic official color */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={line.color}
                      strokeWidth={line.status === 'minor_delay' ? '3.5' : '2.5'}
                      strokeDasharray={line.status === 'minor_delay' ? '6 3' : undefined}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.85"
                    />

                    {/* Stations on this line */}
                    {line.stations.map((station: StationInfo) => {
                      const pos = geoToSvg(station.lat, station.lng);
                      const isInterchange = (station.interchanges?.length || 0) > 0;
                      return (
                        <g
                          key={station.code}
                          className="hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEntity({ type: 'mrt', data: { station, line } });
                          }}
                        >
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={isInterchange ? 4.5 : 2.5}
                            fill="#0f172a"
                            stroke={line.color}
                            strokeWidth={isInterchange ? 2 : 1.5}
                          />
                          {isInterchange && (
                            <circle cx={pos.x} cy={pos.y} r={1.5} fill="#ffffff" />
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          )}

          {/* Real-Time Carpark Clusters Layer */}
          {showCarparks && (
            <g id="carparks">
              {carparks.map((cp) => {
                const pos = geoToSvg(cp.lat, cp.lng);
                const isSelected = selectedCarparkId === cp.id;
                // Availability color: Green (>50), Amber (15-50), Red (<15)
                const lotColor =
                  cp.availableLots > 50 ? '#10b981' : cp.availableLots > 15 ? '#f59e0b' : '#ef4444';

                return (
                  <g
                    key={cp.id}
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedEntity({ type: 'carpark', data: cp });
                      onSelectCarpark?.(cp);
                    }}
                  >
                    {/* Selection halo */}
                    {isSelected && (
                      <circle cx={pos.x} cy={pos.y} r="14" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 2" />
                    )}

                    {/* Carpark Marker Pin */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isSelected ? '7' : '5'}
                      fill={lotColor}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                      className="transition-transform group-hover:scale-125"
                    />

                    {/* Available lots badge text (visible on high zoom or selected) */}
                    {(zoomLevel > 1.4 || isSelected) && (
                      <g>
                        <rect
                          x={pos.x + 8}
                          y={pos.y - 10}
                          width={cp.availableLots > 999 ? 34 : 26}
                          height="14"
                          rx="3"
                          fill="#0f172a"
                          stroke={lotColor}
                          strokeWidth="1"
                        />
                        <text
                          x={pos.x + (cp.availableLots > 999 ? 25 : 21)}
                          y={pos.y}
                          fill="#f8fafc"
                          fontSize="9"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {cp.availableLots}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* Traffic Cameras Layer */}
          {showCameras && (
            <g id="traffic-cameras">
              {cameras.map((cam) => {
                const pos = geoToSvg(cam.lat, cam.lng);
                return (
                  <g
                    key={cam.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedEntity({ type: 'camera', data: cam });
                      onSelectCamera?.(cam);
                    }}
                  >
                    <rect
                      x={pos.x - 5}
                      y={pos.y - 5}
                      width="10"
                      height="10"
                      rx="2"
                      fill="#0284c7"
                      stroke="#0f172a"
                      strokeWidth="1"
                    />
                    <circle cx={pos.x} cy={pos.y} r="2" fill="#ffffff" />
                  </g>
                );
              })}
            </g>
          )}

          {/* Traffic Incidents Layer (Rendered top-most for maximum visibility) */}
          {showIncidents && (
            <g id="incidents">
              {incidents.map((inc) => {
                const pos = geoToSvg(inc.lat, inc.lng);
                const isSelected = selectedIncidentId === inc.id;
                const isSevere = inc.severity === 'severe';

                return (
                  <g
                    key={inc.id}
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedEntity({ type: 'incident', data: inc });
                      onSelectIncident?.(inc);
                    }}
                  >
                    {/* Animated Pulsing Ring */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isSevere ? 16 : 12}
                      fill="none"
                      stroke={isSevere ? '#f43f5e' : '#f59e0b'}
                      strokeWidth="1.5"
                      opacity="0.7"
                      className="animate-ping"
                      style={{ animationDuration: isSevere ? '1.8s' : '2.6s' }}
                    />

                    {/* Outer Casing */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={isSelected ? 10 : 8}
                      fill={isSevere ? '#e11d48' : '#d97706'}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />

                    {/* Warning Exclamation mark */}
                    <text
                      x={pos.x}
                      y={pos.y + 3.5}
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="sans-serif"
                    >
                      !
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        {/* Selected Entity Popup / Drawer Card */}
        {selectedEntity && (
          <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-96 bg-slate-900/95 border border-slate-700/80 rounded-xl p-4 shadow-2xl backdrop-blur-md z-20 text-slate-200">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {selectedEntity.type === 'incident' && (
                  <div className="p-1.5 rounded bg-rose-500/20 text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
                {selectedEntity.type === 'carpark' && (
                  <div className="p-1.5 rounded bg-emerald-500/20 text-emerald-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                )}
                {selectedEntity.type === 'camera' && (
                  <div className="p-1.5 rounded bg-sky-500/20 text-sky-400">
                    <Camera className="w-4 h-4" />
                  </div>
                )}
                {selectedEntity.type === 'mrt' && (
                  <div className="p-1.5 rounded bg-purple-500/20 text-purple-400">
                    <Train className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {selectedEntity.type === 'incident' && (selectedEntity.data as TrafficIncident).type}
                    {selectedEntity.type === 'carpark' && (selectedEntity.data as CarparkLot).name}
                    {selectedEntity.type === 'camera' && (selectedEntity.data as TrafficCamera).name}
                    {selectedEntity.type === 'mrt' && selectedEntity.data.station.name}
                  </h4>
                  <span className="text-xs text-slate-400">
                    {selectedEntity.type === 'incident' && (selectedEntity.data as TrafficIncident).expressway}
                    {selectedEntity.type === 'carpark' && `${(selectedEntity.data as CarparkLot).area} · ${(selectedEntity.data as CarparkLot).agency}`}
                    {selectedEntity.type === 'camera' && (selectedEntity.data as TrafficCamera).expressway}
                    {selectedEntity.type === 'mrt' && `${selectedEntity.data.line.name} (${selectedEntity.data.station.code})`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEntity(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Entity Body */}
            {selectedEntity.type === 'incident' && (
              <div className="space-y-2 text-xs">
                <p className="text-slate-300 font-medium">{(selectedEntity.data as TrafficIncident).message}</p>
                <div className="flex items-center gap-3 text-slate-400 pt-1 border-t border-slate-800">
                  <span>Lanes: {(selectedEntity.data as TrafficIncident).lanesAffected || 'All'}</span>
                  <span>·</span>
                  <span>Est. Clearance: {(selectedEntity.data as TrafficIncident).estimatedClearanceMinutes}m</span>
                </div>
                {(selectedEntity.data as TrafficIncident).diversionAdvice && (
                  <p className="text-amber-300/90 text-xs italic">
                    Advice: {(selectedEntity.data as TrafficIncident).diversionAdvice}
                  </p>
                )}
              </div>
            )}

            {selectedEntity.type === 'carpark' && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Available Car Lots</span>
                    <span className="text-lg font-bold font-mono tabular-nums text-emerald-400">
                      {(selectedEntity.data as CarparkLot).availableLots}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]"> / {(selectedEntity.data as CarparkLot).totalLots}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Occupancy</span>
                    <span className="text-base font-bold font-mono tabular-nums text-slate-200">
                      {(selectedEntity.data as CarparkLot).occupancyPercent}%
                    </span>
                  </div>
                </div>
                <div className="text-slate-400 text-xs space-y-1">
                  <div><span className="text-slate-500">Peak:</span> {(selectedEntity.data as CarparkLot).rates.weekdayPeak}</div>
                  <div><span className="text-slate-500">EV Lots:</span> {(selectedEntity.data as CarparkLot).availableEvLots} of {(selectedEntity.data as CarparkLot).evChargingLots} free</div>
                </div>
              </div>
            )}

            {selectedEntity.type === 'camera' && (
              <div className="space-y-2 text-xs">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                  <img
                    src={(selectedEntity.data as TrafficCamera).imageUrl}
                    alt={(selectedEntity.data as TrafficCamera).name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400">
                    LIVE LTA FEED
                  </div>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Updated: {new Date((selectedEntity.data as TrafficCamera).timestamp).toLocaleTimeString()}
                </div>
              </div>
            )}

            {selectedEntity.type === 'mrt' && (
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Station Crowd Level:</span>
                  <span
                    className={`font-semibold capitalize ${
                      selectedEntity.data.station.crowdLevel === 'high'
                        ? 'text-rose-400'
                        : selectedEntity.data.station.crowdLevel === 'moderate'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {selectedEntity.data.station.crowdLevel} Crowd
                  </span>
                </div>
                <div className="text-slate-400">
                  Operating Status: <span className="text-slate-200">{selectedEntity.data.line.statusText}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-3 right-3 hidden md:flex flex-col gap-1.5 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 backdrop-blur pointer-events-none">
          <div className="font-semibold text-slate-400 mb-0.5">MAP LEGEND</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span>Severe Traffic Incident</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>Moderate Incident / Heavy Flow</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Carpark Available (&gt;50 lots)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span>Carpark Nearly Full (&lt;15 lots)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-emerald-500 inline-block"></span>
            <span>MRT Rail Network</span>
          </div>
        </div>
      </div>
    </div>
  );
};
