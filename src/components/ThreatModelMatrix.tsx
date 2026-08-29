import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Cpu, 
  Key, 
  Layers, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Copy, 
  Check,
  Fingerprint,
  RefreshCw
} from 'lucide-react';
import { ThreatItem, ThreatZone } from '../types';

export function ThreatModelMatrix() {
  const [copied, setCopied] = useState(false);
  const [activeZone, setActiveZone] = useState<ThreatZone | 'all'>('all');

  const THREAT_ITEMS: ThreatItem[] = [
    {
      id: 'TM-01',
      zone: 'input_surfaces',
      zoneLabel: 'Input Surfaces',
      threat: 'Indirect & Direct Prompt Injection in Multi-Turn Journal Text',
      scenario: 'User submits text instructing Gemini to ignore safety boundaries or output sensitive configuration details.',
      owaspCategory: 'OWASP LLM01: Prompt Injection',
      severity: 'HIGH',
      mitigation: 'System instructions strictly bound LLM role as reflective journaling partner; user text delimited as untrusted data input.',
      codeRemediationHint: 'Delimit user input with explicit boundary markers and enforce systemInstruction roles.'
    },
    {
      id: 'TM-02',
      zone: 'planning_reasoning',
      zoneLabel: 'Planning & Reasoning',
      threat: 'Model Outage / Status 503/429 Exhaustion Interrupting User Session',
      scenario: 'High traffic causes primary gemini-3.6-flash tier to return 429 or 503, leaving user with lost thoughts.',
      owaspCategory: 'OWASP LLM04: Model Denial of Service',
      severity: 'HIGH',
      mitigation: '4-Tier Automatic Fallback Ladder sequentially shifts to gemini-3.1-flash-lite and dynamic aliases before failing.',
      codeRemediationHint: 'Backend generateContentWithFallback catches status codes and advances down ladder seamlessly.'
    },
    {
      id: 'TM-03',
      zone: 'tool_execution',
      zoneLabel: 'Tool Execution',
      threat: 'Undefined Properties Crashing Firestore SDK Database Writes',
      scenario: 'Optional reflection insights or metadata contains undefined keys, causing Firestore setDoc to throw exceptions.',
      owaspCategory: 'OWASP A03: Injection & Data Integrity',
      severity: 'MEDIUM',
      mitigation: 'Recursive stripUndefined utility cleans every object tree before invoking Firestore SDK.',
      codeRemediationHint: 'Apply stripUndefined(payload) prior to setDoc or updateDoc.'
    },
    {
      id: 'TM-04',
      zone: 'memory_state',
      zoneLabel: 'Memory & State',
      threat: 'Cross-User Unauthorized Reading / Broken Access Control in Firestore',
      scenario: 'Attacker crafts client request targeting /users/{victimId}/entries to snoop on private personal journals.',
      owaspCategory: 'OWASP A01: Broken Access Control',
      severity: 'CRITICAL',
      mitigation: 'Hardened firestore.rules enforce request.auth.uid == userId on all user-scoped paths with default deny catch-all.',
      codeRemediationHint: 'match /users/{userId}/entries/{entryId} { allow read, write: if request.auth.uid == userId; }'
    },
    {
      id: 'TM-05',
      zone: 'inter_system_comm',
      zoneLabel: 'Inter-System Comm',
      threat: 'Gemini API Key Leaking into Client-Side JavaScript Bundles',
      scenario: 'Front-end code initializes GenAI SDK directly using client environment variables, exposing secrets to DevTools.',
      owaspCategory: 'OWASP A02: Cryptographic Failures',
      severity: 'CRITICAL',
      mitigation: 'Gemini calls proxied entirely through backend Express routes (/api/journal/reflect); key stored in Secret Manager.',
      codeRemediationHint: 'Store GEMINI_API_KEY on server only; never prefix with VITE_ or bundle on client.'
    }
  ];

  const FIRESTORE_RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 1. Default Deny Catch-All (Zero Insecure Defaults)
    match /{document=**} {
      allow read, write: if false;
    }

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    function isValidId(id) {
      return id is string && id.size() > 0 && id.size() <= 128;
    }

    // User Profile Document
    match /users/{userId} {
      allow read, write: if isOwner(userId) && isValidId(userId);

      // User Isolated Multi-turn Journal & Reflection Entries
      match /entries/{entryId} {
        allow read, write: if isOwner(userId) && isValidId(entryId);
      }
    }
  }
}`;

  const handleCopyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_RULES_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredThreats = activeZone === 'all' 
    ? THREAT_ITEMS 
    : THREAT_ITEMS.filter(t => t.zone === activeZone);

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-2">
      {/* Banner */}
      <div className="bg-slate-900/90 text-slate-100 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold uppercase tracking-wider border border-sky-500/30">
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Production Directive #1 & #3 • Security Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            5-Zone Agentic Threat Model & Rules Audit
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Exhaustive threat matrix mapping risks to verified countermeasures for Firebase Authentication, 
            Cloud Firestore owner-bound isolation, and server-side Gemini 3.6 Flash pipeline.
          </p>
        </div>
      </div>

      {/* 5-Zone Threat Summary Table */}
      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>5 Threat Zones Assessment Table</span>
            </h2>
            <p className="text-xs text-slate-400">Filter by threat zone to review concrete mitigations and code remediation patterns.</p>
          </div>

          {/* Zone filter pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'all', label: 'All Zones' },
              { id: 'input_surfaces', label: '1. Input Surfaces' },
              { id: 'planning_reasoning', label: '2. Planning & Reasoning' },
              { id: 'tool_execution', label: '3. Tool Execution' },
              { id: 'memory_state', label: '4. Memory & State' },
              { id: 'inter_system_comm', label: '5. Inter-System Comm' }
            ].map((z) => (
              <button
                key={z.id}
                onClick={() => setActiveZone(z.id as any)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                  activeZone === z.id
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {z.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">ID & Zone</th>
                <th className="py-3 px-3">Identified Threat Scenario</th>
                <th className="py-3 px-3">Severity & OWASP</th>
                <th className="py-3 px-3">Enforced Countermeasure</th>
                <th className="py-3 px-3">Code Remediation Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredThreats.map((threat) => (
                <tr key={threat.id} className="hover:bg-slate-950/40 transition">
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className="font-mono text-[11px] font-bold text-sky-400 block">{threat.id}</span>
                    <span className="text-[11px] text-slate-400">{threat.zoneLabel}</span>
                  </td>

                  <td className="py-3.5 px-3 max-w-xs space-y-1">
                    <span className="font-bold text-white block">{threat.threat}</span>
                    <span className="text-slate-400 text-[11px] leading-relaxed block">{threat.scenario}</span>
                  </td>

                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase ${
                      threat.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      threat.severity === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-sky-950 text-sky-300 border border-sky-800'
                    }`}>
                      {threat.severity}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 block mt-1">{threat.owaspCategory}</span>
                  </td>

                  <td className="py-3.5 px-3 text-slate-200 text-xs leading-relaxed max-w-sm">
                    {threat.mitigation}
                  </td>

                  <td className="py-3.5 px-3 font-mono text-[11px] text-slate-300 bg-slate-950/60 rounded-lg p-2 max-w-xs border border-slate-800/60">
                    {threat.codeRemediationHint}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hardened Firestore Security Rules Viewer */}
      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Active Deployed Firestore Rules (Zero-Trust Isolation)</span>
            </h2>
            <p className="text-xs text-slate-400">Live security rules guarding the <code className="text-sky-300">users/{'{userId}'}/entries</code> collection.</p>
          </div>

          <button
            onClick={handleCopyRules}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Rules' : 'Copy firestore.rules'}</span>
          </button>
        </div>

        <div className="rounded-2xl border border-slate-800 overflow-hidden">
          <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed whitespace-pre">
            {FIRESTORE_RULES_SNIPPET}
          </pre>
        </div>
      </div>
    </div>
  );
}
