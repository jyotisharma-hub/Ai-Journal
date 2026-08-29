import React, { useState } from 'react';
import { 
  Search, 
  ShieldAlert, 
  Code2, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  Copy, 
  Check, 
  ChevronDown,
  ArrowRight
} from 'lucide-react';
import { SecurityReviewResult, Vulnerability } from '../types';

const SAMPLE_CODE_SNIPPETS = [
  {
    name: 'Critical: Hardcoded Gemini API Key in Frontend',
    language: 'typescript',
    code: `// Client-side React component
import { GoogleGenAI } from '@google/genai';

// ❌ CRITICAL: Hardcoded API Key exposed in client bundle
const API_KEY = "AIzaSyD-sample-insecure-key-99882233";

export function ChatWidget() {
  async function sendMessage(userPrompt: string) {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: userPrompt
    });
    return response.text;
  }
}`
  },
  {
    name: 'Critical: Insecure Firestore Rules (allow read, write: if true;)',
    language: 'javascript',
    code: `// ❌ CRITICAL: Zero Insecure Defaults Violation
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Open catch-all allows unauthorized reads and writes
    match /{document=**} {
      allow read, write: if true;
    }

    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if true;
    }
  }
}`
  },
  {
    name: 'High: Unsanitized Dynamic LLM HTML Output (OWASP LLM05)',
    language: 'typescript',
    code: `// Express API and React Consumer
app.post('/api/summarize', async (req, res) => {
  // Missing defensive destructuring and input validation
  const { notes } = req.body;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: \`Summarize: \${notes}\`
  });

  // ❌ Insecure raw HTML injection without encoding
  res.send(\`<div class="summary">\${response.text}</div>\`);
});`
  },
  {
    name: 'Medium: Missing Undefined-Stripping Before Firestore Mutation',
    language: 'typescript',
    code: `import { doc, setDoc } from 'firebase/firestore';

export async function saveUserInteraction(userId: string, data: any) {
  // ❌ Passing raw object containing undefined properties crashes database SDK
  const payload = {
    userId,
    prompt: data.prompt,
    tags: data.optionalTags, // Can be undefined
    timestamp: new Date()
  };

  await setDoc(doc(db, 'interactions', 'doc-1'), payload);
}`
  }
];

export const SecurityReviewer: React.FC = () => {
  const [selectedSnippetIdx, setSelectedSnippetIdx] = useState(0);
  const [code, setCode] = useState(SAMPLE_CODE_SNIPPETS[0].code);
  const [language, setLanguage] = useState(SAMPLE_CODE_SNIPPETS[0].language);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SecurityReviewResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSelectPreset = (idx: number) => {
    setSelectedSnippetIdx(idx);
    setCode(SAMPLE_CODE_SNIPPETS[idx].code);
    setLanguage(SAMPLE_CODE_SNIPPETS[idx].language);
  };

  const handleRunSecurityReview = async () => {
    if (!code.trim()) {
      setError('Please provide code to review.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/security-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          language
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}: Failed to perform review`);
      }

      const data: SecurityReviewResult = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Security reviewer failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Banner */}
      <div className="bg-slate-900/90 text-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-3 border border-sky-500/30">
            <Search className="w-3.5 h-3.5" />
            <span>Production Directive #2 & #5</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            OWASP Security Reviewer & Diff Generator
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
            Audits code against OWASP Top 10 Web and OWASP Top 10 for LLM Applications (OWASP LLM01-LLM10, A01-A10),
            generating severity-ranked vulnerability reports with exact Before/After remediation diffs.
          </p>
        </div>
      </div>

      {/* Code Input & Presets */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-sky-400" />
              <span>Source Code & Security Configuration</span>
            </h2>
            <p className="text-xs text-slate-400">Paste code snippet or pick an archetype vulnerability.</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-400">Preset Scenarios:</span>
            <div className="relative">
              <select
                id="snippet-preset-selector"
                value={selectedSnippetIdx}
                onChange={(e) => handleSelectPreset(Number(e.target.value))}
                className="appearance-none bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {SAMPLE_CODE_SNIPPETS.map((s, i) => (
                  <option key={i} value={i} className="bg-slate-900 text-slate-200">
                    {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="relative rounded-xl border border-slate-700 overflow-hidden focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-sky-500">
          <div className="bg-slate-950 text-slate-400 px-4 py-2 text-xs flex items-center justify-between font-mono border-b border-slate-800">
            <span className="text-slate-300 font-medium">Editor ({language})</span>
            <span className="text-slate-500">Zero-Hardcoding & OWASP Validator</span>
          </div>
          <textarea
            id="code-input-area"
            rows={10}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full p-4 font-mono text-xs text-slate-100 bg-slate-950 focus:outline-none leading-relaxed placeholder-slate-600"
            placeholder="// Paste application source code, API routes, or Firestore rules here..."
          />
        </div>

        {error && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-900/50 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400">
            Evaluates against <strong className="text-slate-200">OWASP LLM01, LLM02, LLM05, A01, A02, A03</strong>
          </div>
          <button
            id="run-code-review-btn"
            onClick={handleRunSecurityReview}
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-sky-200" />
                <span>Auditing Code & Generating Diffs...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-white fill-white" />
                <span>Run Security Audit & Diffs</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Review Results */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Summary Card */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-bold text-white">Audit Findings Summary</h2>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  result.riskScore >= 70 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' 
                    : result.riskScore >= 40 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}>
                  Calculated Risk Score: {result.riskScore}/100
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{result.summary}</p>
            </div>
            <div className="text-xs text-slate-400 font-mono bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl shrink-0">
              Auditor Model: <strong className="text-sky-400">{result.modelUsed}</strong>
            </div>
          </div>

          {/* Vulnerability & Diff Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Severity-Ranked Vulnerabilities & Code Diffs ({result.vulnerabilities.length})</span>
            </h3>

            {result.vulnerabilities.map((vuln: Vulnerability) => {
              const severityBadge = {
                CRITICAL: 'bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold',
                HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30 font-semibold',
                MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-medium',
                LOW: 'bg-sky-500/10 text-sky-400 border-sky-500/30 font-medium'
              }[vuln.severity];

              return (
                <div key={vuln.id} className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2.5">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border ${severityBadge}`}>
                        {vuln.severity}
                      </span>
                      <span className="font-bold text-white text-base">{vuln.title}</span>
                      <span className="font-mono text-xs text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {vuln.owaspId}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-500">{vuln.id}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{vuln.description}</p>
                  <p className="text-xs text-slate-400 italic">{vuln.explanation}</p>

                  {/* Side-by-Side Diff Box */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                    {/* Vulnerable Snippet */}
                    <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 overflow-hidden">
                      <div className="bg-rose-950/60 text-rose-300 px-3 py-1.5 text-xs font-semibold flex items-center justify-between border-b border-rose-900/40">
                        <span className="flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span>Vulnerable Code (Before)</span>
                        </span>
                        <span className="text-[10px] uppercase font-mono text-rose-400">Insecure Sink</span>
                      </div>
                      <pre className="p-3 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {vuln.vulnerableCodeSnippet}
                      </pre>
                    </div>

                    {/* Remediated Snippet */}
                    <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 overflow-hidden">
                      <div className="bg-emerald-950/60 text-emerald-300 px-3 py-1.5 text-xs font-semibold flex items-center justify-between border-b border-emerald-900/40">
                        <span className="flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>Secure Remediation Diff (After)</span>
                        </span>
                        <button
                          onClick={() => handleCopyCode(vuln.id, vuln.remediatedCodeSnippet)}
                          className="flex items-center space-x-1 text-[11px] bg-slate-900 hover:bg-slate-800 text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-800/60 transition cursor-pointer"
                        >
                          {copiedId === vuln.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === vuln.id ? 'Copied Fix' : 'Copy Fix'}</span>
                        </button>
                      </div>
                      <pre className="p-3 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {vuln.remediatedCodeSnippet}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommendations & Safe Patterns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xs space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Safe Patterns Identified</span>
              </h4>
              <div className="space-y-1.5 pt-1">
                {result.safePatternsIdentified.map((pat, i) => (
                  <div key={i} className="text-xs text-slate-300 flex items-center space-x-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{pat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xs space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <ArrowRight className="w-4 h-4 text-sky-400" />
                <span>Security Recommendations</span>
              </h4>
              <div className="space-y-1.5 pt-1">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="text-xs text-slate-300 flex items-center space-x-2 bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-sky-400 font-bold">→</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
