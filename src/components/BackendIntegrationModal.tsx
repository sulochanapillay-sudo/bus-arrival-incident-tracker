import React, { useState } from 'react';
import { BackendSettings, TransitService } from '../services/ltaClient';
import {
  AlertCircle,
  Bus,
  Check,
  CheckCircle2,
  Code,
  Copy,
  Database,
  ExternalLink,
  Globe,
  Radio,
  Server,
  Settings,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: (newSettings: BackendSettings) => void;
}

export const BackendIntegrationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [settings, setSettings] = useState<BackendSettings>(() => TransitService.getSettings());
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [healthData, setHealthData] = useState<any>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    TransitService.saveSettings(settings);
    onConfigSaved(settings);
    onClose();
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    try {
      const start = performance.now();
      const res = await fetch('/health');
      const duration = Math.round(performance.now() - start);

      if (res.ok) {
        const h = await res.json();
        setHealthData(h);
        setTestStatus('success');
        setTestMessage(
          `Serverless route /health OK (${duration}ms). LTA AccountKey: ${
            h.ltaAccountKeyConfigured ? 'Active in environment' : 'Not set (using fallback mock)'
          }`
        );
      } else {
        setTestStatus('error');
        setTestMessage(`Server returned HTTP ${res.status}: ${res.statusText}`);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`Connection test failed: ${err.message || String(err)}`);
    }
  };

  const sampleEndpointsCurl = `# 1. Check health
curl http://localhost:3000/health

# 2. Next buses at a stop (v3 - 20-second cadence)
curl -H "AccountKey: $LTA_ACCOUNT_KEY" "http://localhost:3000/api/BusArrival?BusStopCode=83139"

# 3. Traffic incidents
curl -H "AccountKey: $LTA_ACCOUNT_KEY" "http://localhost:3000/api/TrafficIncidents"

# 4. Train service alerts (MRT/LRT)
curl -H "AccountKey: $LTA_ACCOUNT_KEY" "http://localhost:3000/api/TrainServiceAlerts"

# 5. Carpark availability
curl -H "AccountKey: $LTA_ACCOUNT_KEY" "http://localhost:3000/api/CarParkAvailability"`;

  const copyCurl = () => {
    navigator.clipboard.writeText(sampleEndpointsCurl);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Serverless LTA DataMall Connection & Endpoints
              </h3>
              <p className="text-xs text-slate-400">
                Managed endpoints in /api folder with /health.ts check
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Active Serverless Endpoints Overview */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">
              Configured Serverless Endpoints (/api & root)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <span className="text-emerald-400">GET /health</span>
                <span className="text-[10px] text-slate-500 font-sans">Root health check</span>
              </div>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <span className="text-sky-400">GET /api/BusArrival</span>
                <span className="text-[10px] text-slate-500 font-sans">v3 Bus Stop 83139</span>
              </div>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <span className="text-rose-400">GET /api/TrafficIncidents</span>
                <span className="text-[10px] text-slate-500 font-sans">EMAS Road Alerts</span>
              </div>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                <span className="text-amber-400">GET /api/TrainServiceAlerts</span>
                <span className="text-[10px] text-slate-500 font-sans">MRT/LRT Status</span>
              </div>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between sm:col-span-2">
                <span className="text-emerald-400">GET /api/CarParkAvailability</span>
                <span className="text-[10px] text-slate-500 font-sans">Real-time carpark lots</span>
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Ingestion Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div
                onClick={() => setSettings({ ...settings, mode: 'serverless' })}
                className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                  settings.mode === 'serverless'
                    ? 'border-sky-500 bg-sky-950/20 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Radio className={`w-3.5 h-3.5 ${settings.mode === 'serverless' ? 'text-sky-400' : 'text-slate-600'}`} />
                  <span className="font-semibold text-xs text-white">Serverless /api (Active)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Queries local /api routes with AccountKey proxy to DataMall.
                </p>
              </div>

              <div
                onClick={() => setSettings({ ...settings, mode: 'simulator' })}
                className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                  settings.mode === 'simulator'
                    ? 'border-emerald-500 bg-emerald-950/20 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Radio className={`w-3.5 h-3.5 ${settings.mode === 'simulator' ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span className="font-semibold text-xs text-white">Smart Simulator</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Generates realistic Singapore traffic, train, and carpark ticks.
                </p>
              </div>

              <div
                onClick={() => setSettings({ ...settings, mode: 'custom_api' })}
                className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                  settings.mode === 'custom_api'
                    ? 'border-amber-500 bg-amber-950/20 text-white'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Radio className={`w-3.5 h-3.5 ${settings.mode === 'custom_api' ? 'text-amber-400' : 'text-slate-600'}`} />
                  <span className="font-semibold text-xs text-white">External Gateway</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Custom remote endpoint or proxy domain.
                </p>
              </div>
            </div>
          </div>

          {/* Optional AccountKey override */}
          <div className="space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                LTA DataMall AccountKey
              </label>
              <input
                type="password"
                placeholder="Optional override: paste AccountKey here or configure in .env"
                value={settings.ltaAccountKey}
                onChange={(e) => setSettings({ ...settings, ltaAccountKey: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Can also be set permanently in environment variables as <code className="text-slate-300 font-mono">LTA_DATAMALL_ACCOUNT_KEY</code>.
              </span>
            </div>

            {settings.mode === 'custom_api' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Custom Base URL
                </label>
                <input
                  type="text"
                  placeholder="https://datamall2.mytransport.sg/ltaodataservice"
                  value={settings.customBaseUrl}
                  onChange={(e) => setSettings({ ...settings, customBaseUrl: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500"
                />
              </div>
            )}
          </div>

          {/* Test Health Check Button & Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>{testStatus === 'testing' ? 'Querying /health...' : 'Test /health Serverless Endpoint'}</span>
              </button>
            </div>

            {testStatus === 'success' && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{testMessage}</span>
              </div>
            )}

            {testStatus === 'error' && (
              <div className="p-3 bg-rose-950/30 border border-rose-800/60 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{testMessage}</span>
              </div>
            )}
          </div>

          {/* cURL Commands Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-sky-400" />
                <span>Direct cURL Test Commands</span>
              </span>
              <button
                onClick={copyCurl}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                {copiedSnippet ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSnippet ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>

            <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-36">
              {sampleEndpointsCurl}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
