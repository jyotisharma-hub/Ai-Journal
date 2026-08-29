import React, { useState } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Play, 
  Activity,
  ArrowDown, 
  ShieldCheck, 
  Cpu
} from 'lucide-react';
import { FallbackAttemptLog } from '../types';

const LADDER_TIERS = [
  {
    tier: 1,
    name: 'gemini-3.6-flash',
    role: 'Primary Production Model',
    description: 'High-throughput, lowest latency model for standard content generation and structured reasoning.',
    color: 'border-emerald-500 bg-emerald-50 text-emerald-950',
    badge: 'bg-emerald-600 text-white'
  },
  {
    tier: 2,
    name: 'gemini-3.1-flash-lite',
    role: 'High-Availability Fallback',
    description: 'Lightweight failover model triggered when primary experiences 503/429 load spikes or transient exhaustion.',
    color: 'border-blue-500 bg-blue-50 text-blue-950',
    badge: 'bg-blue-600 text-white'
  },
  {
    tier: 3,
    name: 'gemini-flash-latest',
    role: 'Dynamic Alias Fallback',
    description: 'Dynamic alias resolving to latest stable build in the event of pinned version deprecation.',
    color: 'border-amber-500 bg-amber-50 text-amber-950',
    badge: 'bg-amber-600 text-white'
  },
  {
    tier: 4,
    name: 'gemini-3.7-flash',
    role: 'Deep Reasoning Fallback',
    description: 'Advanced reasoning tier for complex analysis and final error recovery fallback before bubbling errors.',
    color: 'border-purple-500 bg-purple-50 text-purple-950',
    badge: 'bg-purple-600 text-white'
  }
];

export const ResilienceLadder: React.FC = () => {
  const [simulateFailures, setSimulateFailures] = useState<number>(1);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    resolvedModel: string;
    ladderTierUsed: number;
    totalLatencyMs: number;
    logs: FallbackAttemptLog[];
  } | null>(null);

  const handleRunLadderTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/fallback-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulateFailures })
      });

      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Banner */}
      <div className="bg-slate-900/90 text-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-3 border border-sky-500/30">
            <Layers className="w-3.5 h-3.5" />
            <span>Production Directive #6</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Gemini Model Resilience & Fallback Ladder
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
            Eliminates single-point-of-failure risks by wrapping all backend <code className="text-sky-300">@google/genai</code> calls with an automated 
            4-tier fallback chain that intercepts transient HTTP 503, 429, 404, and 500 status codes.
          </p>
        </div>
      </div>

      {/* Visual Model Ladder */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {LADDER_TIERS.map((tier, idx) => {
          const isActiveInTest = testResult && testResult.ladderTierUsed === tier.tier;
          const wasFailedInTest = testResult && testResult.ladderTierUsed > tier.tier;

          return (
            <div
              key={tier.tier}
              className={`rounded-2xl border-2 p-5 transition-all relative flex flex-col justify-between ${
                isActiveInTest
                  ? 'border-emerald-500 bg-emerald-950/30 shadow-md ring-2 ring-emerald-500/30'
                  : wasFailedInTest
                  ? 'border-rose-900/60 bg-rose-950/20 opacity-75'
                  : 'border-slate-800 bg-slate-900/80 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    Tier {tier.tier}
                  </span>
                  {isActiveInTest && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>RESOLVED</span>
                    </span>
                  )}
                  {wasFailedInTest && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>FAILED & BYPASSED</span>
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{tier.role}</div>
                  <div className="font-mono font-bold text-white text-sm mt-0.5 break-all">{tier.name}</div>
                </div>

                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">{tier.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span className="flex items-center space-x-1">
                  <Cpu className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-slate-300">@google/genai SDK</span>
                </span>
                {idx < LADDER_TIERS.length - 1 && (
                  <span className="hidden lg:flex items-center space-x-1 text-slate-500">
                    <span>Failover</span>
                    <ArrowDown className="w-3 h-3 -rotate-90" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Fallback Simulator */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Interactive Ladder Failover Diagnostics</span>
            </h2>
            <p className="text-xs text-slate-400">
              Simulate upstream network or capacity failures to observe ladder recovery in real-time.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-xs font-semibold text-slate-300">Simulate Transient Failures:</label>
            <div className="flex space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              {[0, 1, 2, 3].map((count) => (
                <button
                  key={count}
                  onClick={() => setSimulateFailures(count)}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    simulateFailures === count
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {count} {count === 1 ? 'Fail' : 'Fails'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            Simulating: <strong className="text-slate-200">{simulateFailures === 0 ? 'Direct primary resolution' : `Fallback tier ${simulateFailures + 1} activation`}</strong>
          </div>

          <button
            id="test-ladder-btn"
            onClick={handleRunLadderTest}
            disabled={testing}
            className="flex items-center space-x-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-xl transition shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {testing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-sky-200" />
                <span>Traversing Ladder Tiers...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-white fill-white" />
                <span>Trigger Ladder Test</span>
              </>
            )}
          </button>
        </div>

        {/* Telemetry Output Log */}
        {testResult && (
          <div className="space-y-4 pt-2 animate-in fade-in duration-200">
            <div className="bg-slate-950 text-slate-100 rounded-xl p-4 font-mono text-xs space-y-2 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                <span className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-white font-bold">Resilience Telemetry Trace</span>
                </span>
                <span>Total Latency: <strong className="text-sky-400">{testResult.totalLatencyMs}ms</strong></span>
              </div>

              <div className="space-y-1.5 pt-1">
                {testResult.logs.map((log, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <span className="text-slate-500">[{i + 1}]</span>
                    <span className={
                      log.status === 'SUCCESS' ? 'text-emerald-400 font-bold' :
                      log.status === 'RECOVERED_FALLBACK' ? 'text-sky-400 font-bold' :
                      'text-rose-400 font-semibold'
                    }>
                      {log.status}:
                    </span>
                    <span className="text-slate-200">{log.message}</span>
                    <span className="text-slate-500 text-[11px]">({log.latencyMs}ms)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Implementation Standard Snippet */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Standard Backend Fallback Implementation (`server.ts`)
        </h3>
        <p className="text-xs text-slate-400">
          This helper is integrated across all server API routes to guarantee zero-unhandled-rejection crashes:
        </p>
        <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
{`const FALLBACK_LADDER = [
  'gemini-3.6-flash',      // Tier 1: Primary
  'gemini-3.1-flash-lite', // Tier 2: High-Availability Failover
  'gemini-flash-latest',   // Tier 3: Dynamic Alias
  'gemini-3.7-flash'       // Tier 4: Deep Reasoning
] as const;

async function generateContentWithFallback(options) {
  for (const model of FALLBACK_LADDER) {
    try {
      return await ai.models.generateContent({ model, ...options });
    } catch (err) {
      if ([503, 429, 404, 500].includes(err.status)) {
        console.warn(\`[Fallback Ladder] Model \${model} failed (\${err.status}). Shifting to next tier...\`);
        continue;
      }
      throw err;
    }
  }
}`}
        </pre>
      </div>
    </div>
  );
};
