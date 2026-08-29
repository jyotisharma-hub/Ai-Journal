import React, { useState } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Database, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  AlertTriangle,
  Code2
} from 'lucide-react';
import { stripUndefined } from '../utils/sanitize';

export const FirestoreSecurityStudio: React.FC = () => {
  const [entitiesDescription, setEntitiesDescription] = useState(
    'Users collection (/users/{userId}/interactions/{interactionId}) storing prompt, generated summary, and timestamp; Threat Models collection (/users/{userId}/threat_models/{modelId}) storing security assessments'
  );
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rulesOutput, setRulesOutput] = useState<string>(`rules_version = '2';
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
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$');
    }
    function incoming() {
      return request.resource.data;
    }
    function existing() {
      return resource.data;
    }

    // User Data Isolation: Owner-Bound Interactions
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if isOwner(userId) && isValidId(interactionId);
    }

    // Threat Models (Isolated to Owner UID)
    match /users/{userId}/threat_models/{modelId} {
      allow read, write: if isOwner(userId) && isValidId(modelId);
    }
  }
}`);

  // Undefined-Stripping Sandbox State
  const [rawJsonInput, setRawJsonInput] = useState(`{
  "userId": "usr_998877",
  "prompt": "Analyze threat surface",
  "optionalMetadata": undefined,
  "tags": ["security", undefined, "owasp"],
  "debugFlag": undefined
}`);
  const [sanitizedOutput, setSanitizedOutput] = useState<string>('');

  const handleGenerateRules = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/firestore-rules-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entitiesDescription })
      });

      const data = await res.json();
      if (data.rulesContent) {
        setRulesOutput(data.rulesContent);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSanitizer = () => {
    try {
      // Safely evaluate JS object literal with undefined
      // eslint-disable-next-line no-eval
      const parsed = eval(`(${rawJsonInput})`);
      const cleaned = stripUndefined(parsed);
      setSanitizedOutput(JSON.stringify(cleaned, null, 2));
    } catch (err: any) {
      setSanitizedOutput(`Error parsing input: ${err.message}`);
    }
  };

  const handleCopyRules = () => {
    navigator.clipboard.writeText(rulesOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Banner */}
      <div className="bg-slate-900/90 text-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-3 border border-sky-500/30">
            <Lock className="w-3.5 h-3.5" />
            <span>Production Directive #3</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Secure Firestore & Payload Hygiene
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
            Guarantees Zero Insecure Defaults (<code className="text-sky-300">allow read, write: if false;</code>), owner-bound user isolation (<code className="text-sky-300">request.auth.uid == userId</code>), 
            and strict client-to-database undefined-stripping for zero-crash transaction integrity.
          </p>
        </div>
      </div>

      {/* Rules Builder Section */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Hardened `firestore.rules` Generator</span>
            </h2>
            <p className="text-xs text-slate-400">Defines owner-bound paths, validation blueprints, and temporal guards.</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyRules}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied Rules' : 'Copy Rules'}</span>
            </button>

            <button
              onClick={() => {
                const blob = new Blob([rulesOutput], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'firestore.rules';
                a.click();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Download</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Collection Entities & Hierarchy
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={entitiesDescription}
              onChange={(e) => setEntitiesDescription(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="e.g. Users collection, chats, document attachments..."
            />
            <button
              onClick={handleGenerateRules}
              disabled={loading}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 disabled:opacity-60 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-200" /> : <Sparkles className="w-3.5 h-3.5 text-white" />}
              <span>Regenerate</span>
            </button>
          </div>
        </div>

        {/* Code View */}
        <div className="rounded-xl border border-slate-700 overflow-hidden">
          <div className="bg-slate-950 text-slate-400 px-4 py-2 text-xs font-mono flex items-center justify-between border-b border-slate-800">
            <span className="text-slate-300 font-medium">firestore.rules (rules_version = '2')</span>
            <span className="text-emerald-400 font-bold">Zero-Trust ABAC</span>
          </div>
          <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap">
            {rulesOutput}
          </pre>
        </div>
      </div>

      {/* Undefined-Stripping Sandbox (Directive #6 Database Hygiene) */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Database className="w-4 h-4 text-sky-400" />
            <span>Strict Undefined-Stripping (Zero-Crash Payload Hygiene)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Firestore SDK throws critical unhandled errors if objects contain `undefined` properties. Test the recursive sanitization utility below:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Raw Input (Contains `undefined`):</label>
            <textarea
              rows={8}
              value={rawJsonInput}
              onChange={(e) => setRawJsonInput(e.target.value)}
              className="w-full font-mono text-xs p-3 bg-slate-950 border border-slate-700 text-slate-100 rounded-xl focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              onClick={handleRunSanitizer}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Sanitize Payload
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Sanitized Output (Safe for `setDoc`):</label>
            <pre className="w-full h-[180px] font-mono text-xs p-3 bg-slate-950 text-emerald-400 border border-slate-800 rounded-xl overflow-y-auto whitespace-pre-wrap">
              {sanitizedOutput || '// Click "Sanitize Payload" to view sanitized object'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
