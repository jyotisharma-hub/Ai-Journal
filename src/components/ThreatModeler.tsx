import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Layers, 
  Terminal, 
  Database, 
  Network, 
  Play, 
  RefreshCw, 
  Download, 
  Copy, 
  Check, 
  AlertTriangle,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import { ThreatModelResult, ThreatZone } from '../types';

const PRESET_SCENARIOS = [
  {
    title: 'Agent with Google Sheets & Maps Tool Calling',
    architectureType: 'Autonomous Tool-Calling Agent',
    description: 'An AI assistant that takes user natural language prompts, creates dynamic financial spreadsheets via Google Sheets API, looks up geographical routing via Google Maps API, and stores execution records in Firestore.'
  },
  {
    title: 'Customer Support Bot with Firestore Chat History',
    architectureType: 'Stateful Chatbot with Firestore Memory',
    description: 'A multi-turn customer service agent that persists user conversation turns in Cloud Firestore, evaluates ticket refund eligibility, and triggers automated webhook callbacks to a legacy billing system.'
  },
  {
    title: 'Agentic Code Interpreter with Sandbox Execution',
    architectureType: 'Code Generation & Execution Agent',
    description: 'An agent that ingests raw user files (CSV, Python scripts), generates arbitrary data transformation scripts, and executes them in an ephemeral container environment with external network access.'
  },
  {
    title: 'Multi-Tenant Clinical Notes Assistant',
    architectureType: 'Healthcare Data & LLM Summarizer',
    description: 'A medical notes analyzer that ingests uploaded patient charts, generates ICD-10 medical summaries with Gemini, and writes diagnostic records into a shared multi-tenant database.'
  }
];

const ZONE_METADATA: Record<ThreatZone, { label: string; icon: React.FC<any>; description: string; color: string }> = {
  input_surfaces: {
    label: '1. Input Surfaces',
    icon: Terminal,
    description: 'Prompts, untrusted user uploads, external API payloads, indirect prompt injections',
    color: 'border-sky-500/30 bg-sky-950/20 text-sky-400'
  },
  planning_reasoning: {
    label: '2. Planning & Reasoning',
    icon: Layers,
    description: 'Prompt injection, system instruction bypass, tool routing hijacking, goal hijacking',
    color: 'border-purple-500/30 bg-purple-950/20 text-purple-400'
  },
  tool_execution: {
    label: '3. Tool Execution',
    icon: Play,
    description: 'Privilege escalation via API functions, SSRF, dynamic code execution risks, uncontrolled writes',
    color: 'border-rose-500/30 bg-rose-950/20 text-rose-400'
  },
  memory_state: {
    label: '4. Memory & State',
    icon: Database,
    description: 'Firestore state persistence, session hijacking, cross-user data leaks, unencrypted PII',
    color: 'border-amber-500/30 bg-amber-950/20 text-amber-400'
  },
  inter_system_comm: {
    label: '5. Inter-System Communication',
    icon: Network,
    description: 'External API calls (Google Maps, Google Sheets), token leakage, unauthenticated webhooks',
    color: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400'
  }
};

export const ThreatModeler: React.FC = () => {
  const [description, setDescription] = useState(PRESET_SCENARIOS[0].description);
  const [architectureType, setArchitectureType] = useState(PRESET_SCENARIOS[0].architectureType);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ThreatModelResult | null>(null);
  const [filterZone, setFilterZone] = useState<string>('ALL');
  const [copied, setCopied] = useState(false);

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    setDescription(PRESET_SCENARIOS[index].description);
    setArchitectureType(PRESET_SCENARIOS[index].architectureType);
  };

  const handleRunThreatModel = async () => {
    if (!description.trim()) {
      setError('Please provide a system or feature description.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/threat-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          architectureType: architectureType.trim()
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Failed to generate threat model`);
      }

      const data: ThreatModelResult = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with Threat Modeling engine.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!result) return;
    const md = `# Threat Summary: ${result.title}
**Overall Risk Score**: ${result.overallRiskScore}/100
**Model Resolved**: ${result.ladderUsed?.model || 'Fallback Engine'}

## Threat Summary Table (5 Threat Zones)
| ID | Threat Zone | Threat & Scenario | OWASP Category | Severity | Countermeasure & Remediation |
|---|---|---|---|---|---|
${result.threats.map(t => `| ${t.id} | ${t.zoneLabel} | **${t.threat}**: ${t.scenario} | ${t.owaspCategory} | ${t.severity} | ${t.mitigation} *(Fix: ${t.codeRemediationHint})* |`).join('\n')}

## Architectural Countermeasures
${result.architecturalCountermeasures.map(c => `- ${c}`).join('\n')}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredThreats = result?.threats.filter(t => {
    if (filterZone === 'ALL') return true;
    return t.zone === filterZone;
  }) || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Overview Banner */}
      <div className="bg-slate-900/90 text-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-3 border border-sky-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Production Directive #1</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Agentic Threat Modeling Engine
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
            Performs structured, scenario-driven threat analysis mapping risks to countermeasures across the 
            <strong className="text-white"> 5 Threat Zones</strong> prior to code output or architectural sign-off.
          </p>
        </div>
      </div>

      {/* 5 Threat Zones Architecture Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {(Object.keys(ZONE_METADATA) as ThreatZone[]).map((zoneKey) => {
          const zone = ZONE_METADATA[zoneKey];
          const Icon = zone.icon;
          const isSelected = filterZone === zoneKey;
          return (
            <div
              key={zoneKey}
              onClick={() => setFilterZone(isSelected ? 'ALL' : zoneKey)}
              className={`cursor-pointer border rounded-xl p-4 transition-all duration-150 flex flex-col justify-between ${
                isSelected 
                  ? 'ring-2 ring-sky-500 shadow-md bg-slate-800/90 border-sky-500' 
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200">
                    <Icon className="w-4 h-4 text-sky-400" />
                  </div>
                  {result && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {result.threats.filter(t => t.zone === zoneKey).length} risks
                    </span>
                  )}
                </div>
                <h2 className="font-semibold text-white text-sm mt-2">{zone.label}</h2>
                <p className="text-xs text-slate-400 mt-1 line-clamp-3">{zone.description}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>{isSelected ? 'Filtered' : 'Click to filter'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Configuration Box */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">Define Feature or System Architecture</h2>
            <p className="text-xs text-slate-400">Choose a scenario or input your application requirements.</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-400">Presets:</span>
            <div className="relative">
              <select
                id="preset-selector"
                value={selectedPresetIndex}
                onChange={(e) => handleSelectPreset(Number(e.target.value))}
                className="appearance-none bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {PRESET_SCENARIOS.map((p, idx) => (
                  <option key={idx} value={idx} className="bg-slate-900 text-slate-200">
                    {p.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="arch-type" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Architecture Archetype
            </label>
            <input
              id="arch-type"
              type="text"
              value={architectureType}
              onChange={(e) => setArchitectureType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="e.g. Multi-Tenant Agent with Database Tooling"
            />
          </div>

          <div>
            <label htmlFor="feature-desc" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Feature Description & Threat Surface
            </label>
            <textarea
              id="feature-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Describe the agent inputs, prompt injection defenses, tools used, state persistence, and inter-system calls..."
            />
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-900/50 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400">
            Powered by <strong className="text-slate-200">Resilient Gemini Fallback Ladder</strong> (`gemini-3.6-flash` → `gemini-3.1-flash-lite`)
          </div>
          <button
            id="run-threat-model-btn"
            onClick={handleRunThreatModel}
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-sky-200" />
                <span>Analyzing 5 Threat Zones...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-white fill-white" />
                <span>Generate Threat Summary Table</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Threat Summary Table Result Section */}
      {result && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xs space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-white">{result.title}</h2>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  result.overallRiskScore >= 70 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' 
                    : result.overallRiskScore >= 40 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}>
                  Risk Score: {result.overallRiskScore}/100
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{result.systemOverview}</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="copy-threat-table-btn"
                onClick={handleCopyMarkdown}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'Copied Markdown' : 'Copy Table'}</span>
              </button>

              <button
                id="export-threat-json-btn"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `threat-model-${Date.now()}.json`;
                  a.click();
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>JSON</span>
              </button>
            </div>
          </div>

          {/* Fallback Telemetry Info */}
          {result.ladderUsed && (
            <div className="flex items-center justify-between bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-200">Resolved Model:</span>
                <span className="font-mono text-sky-400 bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-800/50">
                  {result.ladderUsed.model}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-slate-400">
                <span>Latency: <strong className="text-slate-200">{result.ladderUsed.latencyMs}ms</strong></span>
                <span>Attempts: <strong className="text-slate-200">{result.ladderUsed.attempts}</strong></span>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-400">Filter Zone:</span>
              <button
                onClick={() => setFilterZone('ALL')}
                className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${filterZone === 'ALL' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                All ({result.threats.length})
              </button>
              {(Object.keys(ZONE_METADATA) as ThreatZone[]).map((zk) => (
                <button
                  key={zk}
                  onClick={() => setFilterZone(zk)}
                  className={`px-2 py-1 rounded-md transition font-medium cursor-pointer ${filterZone === zk ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
                >
                  {ZONE_METADATA[zk].label.split('.')[1]} ({result.threats.filter(t => t.zone === zk).length})
                </button>
              ))}
            </div>
          </div>

          {/* Threat Summary Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3.5 w-16">ID</th>
                  <th className="py-3 px-3.5 w-44">Threat Zone</th>
                  <th className="py-3 px-4">Threat & Exploitation Scenario</th>
                  <th className="py-3 px-3.5 w-44">OWASP Classification</th>
                  <th className="py-3 px-3 w-24">Severity</th>
                  <th className="py-3 px-4">Countermeasure & Fix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredThreats.map((threat) => {
                  const severityClasses = {
                    CRITICAL: 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold',
                    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30 font-semibold',
                    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-medium',
                    LOW: 'bg-sky-500/10 text-sky-400 border-sky-500/30 font-medium'
                  }[threat.severity];

                  return (
                    <tr key={threat.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-3.5 font-mono font-bold text-slate-400 align-top">{threat.id}</td>
                      <td className="py-3.5 px-3.5 align-top">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-200 border border-slate-700">
                          {threat.zoneLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-top space-y-1">
                        <div className="font-bold text-white text-sm">{threat.threat}</div>
                        <div className="text-slate-400 text-xs leading-relaxed">{threat.scenario}</div>
                      </td>
                      <td className="py-3.5 px-3.5 align-top">
                        <span className="font-mono text-[11px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 block">
                          {threat.owaspCategory}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 align-top">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] border ${severityClasses}`}>
                          {threat.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-top space-y-1.5">
                        <div className="text-slate-200 font-medium leading-relaxed">{threat.mitigation}</div>
                        <div className="bg-slate-950 text-slate-200 font-mono text-[11px] p-2 rounded-md border border-slate-800 flex items-start space-x-1.5">
                          <span className="text-sky-400 font-bold shrink-0">FIX:</span>
                          <span className="break-all text-slate-300">{threat.codeRemediationHint}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Architectural Countermeasures Checklist */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Mandatory Architectural Countermeasures</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              {result.architecturalCountermeasures.map((counter, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div className="w-4 h-4 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                    ✓
                  </div>
                  <span>{counter}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
