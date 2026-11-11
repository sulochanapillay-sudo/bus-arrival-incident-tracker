/**
 * Singapore Transport & Mobility Type Definitions
 * Conforms to Singapore LTA DataMall v2 specifications for:
 * - TrafficIncidents
 * - TrainServiceAlerts
 * - CarParkAvailabilityv2
 * - Traffic-Images
 */

export type Expressway =
  | 'PIE' // Pan Island Expressway
  | 'CTE' // Central Expressway
  | 'AYE' // Ayer Rajah Expressway
  | 'ECP' // East Coast Parkway
  | 'BKE' // Bukit Timah Expressway
  | 'KJE' // Kranji Expressway
  | 'SLE' // Seletar Expressway
  | 'TPE' // Tampines Expressway
  | 'KPE' // Kallang-Paya Lebar Expressway
  | 'MCE' // Marina Coastal Expressway
  | 'Arterial'; // Major arterial roads

export type IncidentType =
  | 'Accident'
  | 'Roadwork'
  | 'Vehicle breakdown'
  | 'Heavy Traffic'
  | 'Obstacle'
  | 'Weather / Ponding'
  | 'Road Closure';

export type IncidentSeverity = 'low' | 'moderate' | 'severe';

export interface TrafficIncident {
  id: string;
  type: IncidentType;
  expressway: Expressway;
  location: string;
  message: string;
  timestamp: string; // ISO string
  severity: IncidentSeverity;
  lanesAffected?: string;
  estimatedClearanceMinutes?: number;
  diversionAdvice?: string;
  lat: number;
  lng: number;
  cameraFeedId?: string;
}

export interface TrafficCamera {
  id: string;
  name: string;
  expressway: Expressway;
  lat: number;
  lng: number;
  imageUrl: string;
  timestamp: string;
  status: 'operational' | 'offline';
}

export type RailLineCode =
  | 'NSL'
  | 'EWL'
  | 'CCL'
  | 'NEL'
  | 'DTL'
  | 'TEL'
  | 'BPLRT'
  | 'SKLRT'
  | 'PGLRT';

export type RailLineStatus =
  | 'normal'
  | 'minor_delay'
  | 'major_disruption'
  | 'track_fault'
  | 'signal_fault'
  | 'maintenance';

export type StationCrowdLevel = 'low' | 'moderate' | 'high';

export interface StationInfo {
  code: string;
  name: string;
  crowdLevel: StationCrowdLevel;
  lat: number;
  lng: number;
  interchanges?: RailLineCode[];
  firstTrain?: string;
  lastTrain?: string;
}

export interface RailLine {
  id: RailLineCode;
  name: string;
  code: string;
  color: string;
  textColor: string;
  status: RailLineStatus;
  statusText: string;
  delayMinutes?: number;
  disruptionMessage?: string;
  affectedStretch?: string;
  freeBridgingBusAvailable: boolean;
  bridgingBusDetails?: string;
  stationsCount: number;
  stations: StationInfo[];
}

export type MrtLine = RailLine;

export type CarparkArea =
  | 'Central / CBD'
  | 'Orchard'
  | 'Marina Bay'
  | 'East'
  | 'West'
  | 'North'
  | 'North-East';

export type CarparkAgency = 'HDB' | 'URA' | 'LTA' | 'Commercial';

export type LotType = 'C' | 'H' | 'Y'; // Car, Heavy Vehicle, Motorcycle

export interface CarparkRates {
  weekdayPeak: string;
  weekdayOffPeak: string;
  weekend: string;
  gracePeriodMinutes: number;
}

export interface CarparkLot {
  id: string;
  name: string;
  area: CarparkArea;
  agency: CarparkAgency;
  address: string;
  lat: number;
  lng: number;
  totalLots: number;
  availableLots: number;
  lotType: LotType;
  evChargingLots: number;
  availableEvLots: number;
  rates: CarparkRates;
  occupancyPercent: number; // 0 to 100
  trend: 'filling_fast' | 'stable' | 'emptying';
  epsSystem: boolean;
  updatedAt: string;
}

export interface BackendConfig {
  mode: 'simulator' | 'custom_api';
  apiBaseUrl: string;
  ltaApiKey: string;
  autoRefreshIntervalSeconds: number;
  autoRefreshEnabled: boolean;
}

export interface NextBusInfo {
  OriginCode: string;
  DestinationCode: string;
  EstimatedArrival: string; // ISO string
  Latitude: string;
  Longitude: string;
  VisitNumber: string;
  Load: 'SEA' | 'SDA' | 'LSD' | string; // Seats Available, Standing Available, Limited Standing
  Feature: 'WAB' | string; // Wheelchair Accessible Bus
  Type: 'SD' | 'DD' | 'BD' | string; // Single Decker, Double Decker, Bendy
}

export interface BusServiceArrival {
  ServiceNo: string;
  Operator: string;
  NextBus?: NextBusInfo;
  NextBus2?: NextBusInfo;
  NextBus3?: NextBusInfo;
}

export interface BusArrivalResponse {
  odata_metadata?: string;
  BusStopCode: string;
  Services: BusServiceArrival[];
  _warning?: string;
  _liveMode?: boolean;
}

