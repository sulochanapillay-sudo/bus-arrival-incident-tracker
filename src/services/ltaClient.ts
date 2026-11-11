/**
 * Singapore LTA DataMall & Serverless Service Client
 * Connects to:
 * - /api/BusArrival?BusStopCode=83139 (v3 - 20-second refresh)
 * - /api/TrafficIncidents
 * - /api/TrainServiceAlerts
 * - /api/CarParkAvailability
 * - /api/health and /health
 */

import {
  BusArrivalResponse,
  CarparkLot,
  MrtLine,
  RailLine,
  TrafficCamera,
  TrafficIncident,
} from '../types/transit';
import {
  INITIAL_CARPARKS,
  INITIAL_MRT_LINES,
  INITIAL_TRAFFIC_CAMERAS,
  INITIAL_TRAFFIC_INCIDENTS,
} from '../data/singaporeData';

const CONFIG_STORAGE_KEY = 'sg_transit_backend_config';

export interface BackendSettings {
  mode: 'serverless' | 'simulator' | 'custom_api';
  customBaseUrl: string;
  ltaAccountKey: string;
  autoRefreshInterval: number; // in seconds
  autoRefreshEnabled: boolean;
}

export const DEFAULT_BACKEND_SETTINGS: BackendSettings = {
  mode: 'serverless',
  customBaseUrl: '/api',
  ltaAccountKey: '',
  autoRefreshInterval: 20,
  autoRefreshEnabled: true,
};

export class TransitService {
  private static settings: BackendSettings = TransitService.loadSettings();
  private static incidents: TrafficIncident[] = [...INITIAL_TRAFFIC_INCIDENTS];
  private static mrtLines: RailLine[] = [...INITIAL_MRT_LINES];
  private static carparks: CarparkLot[] = [...INITIAL_CARPARKS];
  private static cameras: TrafficCamera[] = [...INITIAL_TRAFFIC_CAMERAS];

  public static loadSettings(): BackendSettings {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_BACKEND_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_BACKEND_SETTINGS;
  }

  public static saveSettings(settings: BackendSettings) {
    this.settings = settings;
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }

  public static getSettings(): BackendSettings {
    return this.settings;
  }

  /**
   * Health check query to /health or /api/health
   */
  public static async getHealth(): Promise<{ status: string; ltaAccountKeyConfigured: boolean; [key: string]: any }> {
    try {
      const res = await fetch('/health');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Health check query failed:', e);
    }
    return { status: 'unknown', ltaAccountKeyConfigured: false };
  }

  /**
   * Fetch Next buses at a stop (v3 - 20-second refresh)
   * Upstream: https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139
   */
  public static async getBusArrival(busStopCode: string = '83139'): Promise<BusArrivalResponse> {
    const baseUrl = this.settings.mode === 'custom_api' ? this.settings.customBaseUrl : '/api';
    try {
      const headers: Record<string, string> = {};
      if (this.settings.ltaAccountKey) {
        headers['AccountKey'] = this.settings.ltaAccountKey;
      }
      const response = await fetch(`${baseUrl}/BusArrival?BusStopCode=${encodeURIComponent(busStopCode)}`, {
        headers,
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('BusArrival fetch failed:', err);
    }

    // Fallback simulation
    return {
      BusStopCode: busStopCode,
      Services: [
        {
          ServiceNo: '15',
          Operator: 'GAS',
          NextBus: {
            OriginCode: '77009',
            DestinationCode: '17009',
            EstimatedArrival: new Date(Date.now() + 4 * 60 * 1000).toISOString(),
            Latitude: '1.3142',
            Longitude: '103.8821',
            VisitNumber: '1',
            Load: 'SEA',
            Feature: 'WAB',
            Type: 'DD',
          },
          NextBus2: {
            OriginCode: '77009',
            DestinationCode: '17009',
            EstimatedArrival: new Date(Date.now() + 12 * 60 * 1000).toISOString(),
            Latitude: '',
            Longitude: '',
            VisitNumber: '1',
            Load: 'SDA',
            Feature: 'WAB',
            Type: 'SD',
          },
        },
      ],
      _warning: 'Live connection pending or offline.',
      _liveMode: false,
    };
  }

  /**
   * Fetch current traffic incidents
   */
  public static async getIncidents(): Promise<TrafficIncident[]> {
    if (this.settings.mode !== 'simulator') {
      const baseUrl = this.settings.mode === 'custom_api' ? this.settings.customBaseUrl : '/api';
      try {
        const headers: Record<string, string> = {};
        if (this.settings.ltaAccountKey) {
          headers['AccountKey'] = this.settings.ltaAccountKey;
        }

        const response = await fetch(`${baseUrl}/TrafficIncidents`, { headers });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.value) && data.value.length > 0) {
            return data.value.map((item: any, idx: number) => {
              // Parse expressway from message if not provided
              const msg = item.Message || '';
              let exp: any = 'PIE';
              const match = msg.match(/\b(PIE|CTE|AYE|ECP|BKE|KJE|SLE|TPE|KPE|MCE)\b/i);
              if (match) exp = match[1].toUpperCase();

              return {
                id: item.IncidentID || `INC-LTA-${idx}`,
                type: (item.Type || 'Accident') as any,
                expressway: exp,
                location: msg.split('.')[0] || 'Expressway stretch',
                message: msg,
                timestamp: new Date().toISOString(),
                severity: item.Type === 'Accident' ? 'severe' : 'moderate',
                lat: typeof item.Latitude === 'number' ? item.Latitude : parseFloat(item.Latitude) || 1.3521,
                lng: typeof item.Longitude === 'number' ? item.Longitude : parseFloat(item.Longitude) || 103.8198,
                cameraFeedId: 'CAM_CTE_085',
              };
            });
          }
        }
      } catch (err) {
        console.warn('API TrafficIncidents request failed, falling back to local dataset:', err);
      }
    }
    return [...this.incidents];
  }

  /**
   * Fetch MRT/LRT rail line statuses
   */
  public static async getMrtStatus(): Promise<RailLine[]> {
    if (this.settings.mode !== 'simulator') {
      const baseUrl = this.settings.mode === 'custom_api' ? this.settings.customBaseUrl : '/api';
      try {
        const headers: Record<string, string> = {};
        if (this.settings.ltaAccountKey) {
          headers['AccountKey'] = this.settings.ltaAccountKey;
        }

        const response = await fetch(`${baseUrl}/TrainServiceAlerts`, { headers });
        if (response.ok) {
          const data = await response.json();
          if (data?.value?.Status === 2) {
            // Disruption detected
            console.info('Live disruption detected from TrainServiceAlerts:', data.value);
          }
        }
      } catch (err) {
        console.warn('API TrainServiceAlerts fetch failed, falling back to local dataset:', err);
      }
    }
    return [...this.mrtLines];
  }

  /**
   * Fetch Real-Time Carpark lots
   */
  public static async getCarparks(): Promise<CarparkLot[]> {
    if (this.settings.mode !== 'simulator') {
      const baseUrl = this.settings.mode === 'custom_api' ? this.settings.customBaseUrl : '/api';
      try {
        const headers: Record<string, string> = {};
        if (this.settings.ltaAccountKey) {
          headers['AccountKey'] = this.settings.ltaAccountKey;
        }

        const response = await fetch(`${baseUrl}/CarParkAvailability`, { headers });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.value) && data.value.length > 0) {
            return this.carparks.map((cp) => {
              const match = data.value.find(
                (v: any) =>
                  v.CarParkID === cp.id ||
                  v.Development?.toLowerCase().includes(cp.name.toLowerCase()) ||
                  cp.name.toLowerCase().includes(v.Development?.toLowerCase() || '')
              );
              if (match) {
                const avail = parseInt(match.AvailableLots, 10);
                if (!isNaN(avail)) {
                  return {
                    ...cp,
                    availableLots: avail,
                    occupancyPercent: Math.min(100, Math.round(((cp.totalLots - avail) / cp.totalLots) * 100)),
                    updatedAt: new Date().toISOString(),
                  };
                }
              }
              return cp;
            });
          }
        }
      } catch (err) {
        console.warn('Carpark API fetch failed, falling back to simulator:', err);
      }
    }

    // Fluctuate lots slightly in simulator mode for live realism
    this.carparks = this.carparks.map((cp) => {
      const delta = Math.floor(Math.random() * 5) - 2;
      const newAvail = Math.max(0, Math.min(cp.totalLots, cp.availableLots + delta));
      const occ = Math.round(((cp.totalLots - newAvail) / cp.totalLots) * 100);
      return {
        ...cp,
        availableLots: newAvail,
        occupancyPercent: occ,
        trend: delta > 0 ? 'emptying' : delta < 0 ? 'filling_fast' : 'stable',
        updatedAt: new Date().toISOString(),
      };
    });

    return [...this.carparks];
  }

  /**
   * Fetch traffic camera streams
   */
  public static async getCameras(): Promise<TrafficCamera[]> {
    return [...this.cameras];
  }

  /**
   * Simulator action: Inject a new incident to test real-time alerts
   */
  public static injectSimulatedIncident(): TrafficIncident {
    const expresswayList = ['PIE', 'CTE', 'AYE', 'ECP', 'SLE', 'BKE', 'TPE'] as const;
    const randomExp = expresswayList[Math.floor(Math.random() * expresswayList.length)];
    const types = ['Accident', 'Vehicle breakdown', 'Heavy Traffic', 'Roadwork'] as const;
    const randomType = types[Math.floor(Math.random() * types.length)];

    const newIncident: TrafficIncident = {
      id: `INC-SIM-${Date.now().toString().slice(-4)}`,
      type: randomType,
      expressway: randomExp,
      location: `${randomExp} (towards City) after junction with Exit ${Math.floor(Math.random() * 20) + 1}`,
      message: `${randomType} reported on ${randomExp}. Pass with care. Traffic building up.`,
      timestamp: new Date().toISOString(),
      severity: randomType === 'Accident' ? 'severe' : 'moderate',
      lanesAffected: 'Lane 1 blocked',
      estimatedClearanceMinutes: 20,
      diversionAdvice: 'Consider alternate arterial routes.',
      lat: 1.3 + Math.random() * 0.12,
      lng: 103.75 + Math.random() * 0.18,
    };

    this.incidents = [newIncident, ...this.incidents];
    return newIncident;
  }

  /**
   * Simulator action: Toggle MRT line status (normal <-> minor delay)
   */
  public static toggleMrtLineDelay(lineId: string): RailLine[] {
    this.mrtLines = this.mrtLines.map((line) => {
      if (line.id === lineId) {
        const isNormal = line.status === 'normal';
        return {
          ...line,
          status: isNormal ? 'minor_delay' : 'normal',
          statusText: isNormal ? 'Minor Delay (+8 to +10 mins)' : 'Normal Service',
          delayMinutes: isNormal ? 8 : undefined,
          disruptionMessage: isNormal
            ? `Signal equipment reset underway between selected stations on ${line.name}. Commuters please cater 8-10 mins extra travelling time.`
            : undefined,
          freeBridgingBusAvailable: isNormal,
          bridgingBusDetails: isNormal ? `Bridging bus service activated at affected stations.` : undefined,
        };
      }
      return line;
    });
    return [...this.mrtLines];
  }
}
