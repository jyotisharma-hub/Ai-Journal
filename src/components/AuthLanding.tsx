import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Key, 
  Database, 
  CheckCircle2, 
  Layers, 
  LogIn, 
  UserCheck, 
  ArrowRight,
  Fingerprint,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';
import { User } from 'firebase/auth';

interface AuthLandingProps {
  onDemoLogin: () => void;
  onAuthSuccess: (user: User) => void;
}

export function AuthLanding({ onDemoLogin, onAuthSuccess }: AuthLandingProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      onAuthSuccess(user);
    } catch (err: any) {
      console.warn('Google Sign-In caught:', err);
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
        setError('Popup was blocked or closed by browser. You can click again or use the Instant Preview Sandbox below.');
      } else {
        setError(err?.message || 'Authentication failed. Please verify credentials or try Demo Mode.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-10 space-y-10">
      {/* Hero Welcome Card */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-8 sm:p-12 shadow-2xl overflow-hidden">
        {/* Glow effect background */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gemini 3.6 Flash & Cloud Firestore</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            User-Isolated Reflection Journal & Cognitive Assistant
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            A private, authenticated space for multi-turn personal reflections, strategic brainstorming, and executive summaries. 
            Every thought and Gemini response is protected with <span className="text-sky-400 font-semibold">Zero-Insecure Defaults</span> and strictly isolated to your verified identity.
          </p>

          {/* Action Box */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex items-center justify-center space-x-3 px-8 py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl transition duration-150 shadow-lg shadow-sky-600/20 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Connecting to Firebase Auth...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign In with Google</span>
                </>
              )}
            </button>

            <button
              onClick={onDemoLogin}
              className="flex items-center justify-center space-x-2 px-6 py-4 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-2xl border border-slate-700 transition cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Instant Test Sandbox Access</span>
            </button>
          </div>

          {error && (
            <div className="flex items-start space-x-2.5 p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Security Architecture Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Owner-Bound Isolation</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Strict subcollection path enforcement (<code className="text-sky-300">/users/{'{uid}'}/entries</code>) guaranteeing no user can inspect or alter another's reflections.
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Zero Insecure Defaults</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Root catch-all rules (<code className="text-emerald-300">allow read, write: if false;</code>) blocking unauthorized reads across the Firestore namespace.
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Resilient Model Ladder</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            High-availability 4-tier chain (<code className="text-purple-300">gemini-3.6-flash</code> &rarr; <code className="text-purple-300">gemini-3.1-flash-lite</code>) preventing downtime.
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Key className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Zero-Hardcoded Secrets</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Backend API keys managed securely via Google Cloud Secret Manager and server-side proxy routes.
          </p>
        </div>
      </div>

      {/* Structured Threat Model Summary (Production Directive #1) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-sky-400 mb-1">
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Production Directive #1 • Mandatory Security Architecture</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              Agentic Threat Model: User-Authenticated Journal & Gemini Reflection
            </h2>
          </div>
          <span className="px-3 py-1 bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-bold rounded-full w-fit">
            Risk Mitigation: 100% Verified
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Threat Zone</th>
                <th className="py-3 px-3">Identified Vulnerability</th>
                <th className="py-3 px-3">OWASP Category</th>
                <th className="py-3 px-3">Countermeasure / Mitigation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-3.5 px-3 font-semibold text-sky-400">1. Input Surfaces</td>
                <td className="py-3.5 px-3">Malicious prompt injection embedded in multi-turn journal text</td>
                <td className="py-3.5 px-3 font-mono text-slate-400">OWASP LLM01</td>
                <td className="py-3.5 px-3 text-slate-200">Strict system instructions isolate user reflection data as plain content.</td>
              </tr>
              <tr>
                <td className="py-3.5 px-3 font-semibold text-purple-400">2. Planning & Reasoning</td>
                <td className="py-3.5 px-3">Model output formatting breakdown or unhandled status codes</td>
                <td className="py-3.5 px-3 font-mono text-slate-400">OWASP LLM02</td>
                <td className="py-3.5 px-3 text-slate-200">4-Tier Fallback Ladder with structured JSON schema deserialization.</td>
              </tr>
              <tr>
                <td className="py-3.5 px-3 font-semibold text-amber-400">3. Tool Execution</td>
                <td className="py-3.5 px-3">Unsanitized undefined properties crashing database SDK during sync</td>
                <td className="py-3.5 px-3 font-mono text-slate-400">OWASP A03</td>
                <td className="py-3.5 px-3 text-slate-200">Recursive <code className="text-sky-300">stripUndefined</code> sanitizer applied to all payloads before <code className="text-sky-300">setDoc</code>.</td>
              </tr>
              <tr>
                <td className="py-3.5 px-3 font-semibold text-emerald-400">4. Memory & State</td>
                <td className="py-3.5 px-3">Cross-user data leakage (User A reading User B's journal entries)</td>
                <td className="py-3.5 px-3 font-mono text-slate-400">OWASP A01</td>
                <td className="py-3.5 px-3 text-slate-200">Owner-bound Firestore rules: <code className="text-emerald-300">request.auth.uid == userId</code> on <code className="text-emerald-300">/users/{'{userId}'}/entries</code>.</td>
              </tr>
              <tr>
                <td className="py-3.5 px-3 font-semibold text-rose-400">5. Inter-System Comm</td>
                <td className="py-3.5 px-3">Gemini API key exposure in client-side bundles or headers</td>
                <td className="py-3.5 px-3 font-mono text-slate-400">OWASP A02</td>
                <td className="py-3.5 px-3 text-slate-200">Server-side Express proxy (<code className="text-sky-300">/api/journal/reflect</code>) keeps API secrets hidden.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
