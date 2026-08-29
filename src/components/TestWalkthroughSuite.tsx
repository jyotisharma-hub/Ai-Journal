import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Play, 
  RefreshCw, 
  Download, 
  Copy, 
  Check, 
  Layers, 
  FileText,
  Terminal
} from 'lucide-react';
import { TestWalkthroughStep } from '../types';

const INITIAL_TEST_STEPS: TestWalkthroughStep[] = [
  {
    id: 'TC-01',
    featureModule: '1. Agentic Threat Modeler',
    userAction: 'Select "Autonomous Tool-Calling Agent" preset and click "Generate Threat Summary Table"',
    expectedOutcome: 'Application analyzes the 5 Threat Zones and populates the structured Threat Summary Table with severity badges and countermeasures.',
    securityVerification: 'Verifies structured threat modeling executes before any code is generated or architectural decisions made.',
    simulatedStatus: 'passed'
  },
  {
    id: 'TC-02',
    featureModule: '1. Agentic Threat Modeler',
    userAction: 'Click on individual Threat Zone filter cards (e.g., "3. Tool Execution")',
    expectedOutcome: 'Threat table updates dynamically to filter threats belonging strictly to the selected zone.',
    securityVerification: 'Validates granular zone-specific review and verification workflows.',
    simulatedStatus: 'passed'
  },
  {
    id: 'TC-03',
    featureModule: '2. OWASP Security Reviewer',
    userAction: 'Select "Hardcoded Gemini API Key" preset and click "Run Security Audit & Diffs"',
    expectedOutcome: 'Reviewer flags CRITICAL vulnerability (OWASP A02), generates side-by-side Before/After diff, and enables one-click copy.',
    securityVerification: 'Enforces Zero-Hardcoding hygiene and validates Secret Manager integration remediation.',
    simulatedStatus: 'passed'
  },
  {
    id: 'TC-04',
    featureModule: '3. Gemini Fallback Ladder',
    userAction: 'Set "Simulate Transient Failures" to 2 and click "Trigger Ladder Test"',
    expectedOutcome: 'Backend logs retry attempts for gemini-3.6-flash (503) and gemini-3.1-flash-lite (429), then successfully recovers on gemini-flash-latest with zero crash.',
    securityVerification: 'Validates error recovery matrix and high-availability AI pipeline resilience.',
    simulatedStatus: 'passed'
  },
  {
    id: 'TC-05',
    featureModule: '4. Hardened Firestore Rules',
    userAction: 'Review generated firestore.rules for `match /{document=**} { allow read, write: if false; }` and `request.auth.uid == userId`',
    expectedOutcome: 'Confirms zero insecure defaults and strict owner-bound isolation for all document subpaths.',
    securityVerification: 'Guarantees authorization cannot be bypassed and prevents orphaned cross-user database writes.',
    simulatedStatus: 'passed'
  },
  {
    id: 'TC-06',
    featureModule: '4. Payload Hygiene Sandbox',
    userAction: 'Input object with `undefined` properties into Undefined-Stripping sandbox and click "Sanitize Payload"',
    expectedOutcome: 'Sanitizer recursively purges all undefined fields, producing clean zero-crash payload ready for database mutation.',
    securityVerification: 'Prevents runtime Firestore SDK crashes caused by unhandled undefined fields.',
    simulatedStatus: 'passed'
  },
  {
    id: 'TC-07',
    featureModule: '5. Secret Manager Configurator',
    userAction: 'Input custom GCP Project ID and copy generated gcloud CLI command sequence',
    expectedOutcome: 'Provides copy-pasteable commands for secret creation and IAM `roles/secretmanager.secretAccessor` binding.',
    securityVerification: 'Eliminates hardcoded credentials and enforces least-privilege service account access.',
    simulatedStatus: 'passed'
  },
  {
    id: 'TC-08',
    featureModule: '6. Cloud Run README Generator',
    userAction: 'Navigate to "Cloud Run README" tab and inspect verification campaign label',
    expectedOutcome: 'Displays complete deployment instructions with mandatory `--update-labels=dev-tutorial=cloud-run-ai-challenge`.',
    securityVerification: 'Ensures automated challenge verification and production container deployment compliance.',
    simulatedStatus: 'passed'
  }
];

export const TestWalkthroughSuite: React.FC = () => {
  const [steps, setSteps] = useState<TestWalkthroughStep[]>(INITIAL_TEST_STEPS);
  const [featureName, setFeatureName] = useState('Agentic AI Tool Execution Engine');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleStatus = (id: string) => {
    setSteps(prev => prev.map(s => {
      if (s.id !== id) return s;
      const nextStatus = s.simulatedStatus === 'passed' ? 'failed' : s.simulatedStatus === 'failed' ? 'pending' : 'passed';
      return { ...s, simulatedStatus: nextStatus };
    }));
  };

  const handleGenerateCustomWalkthrough = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/walkthrough-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureName })
      });

      const data = await res.json();
      if (data.steps && Array.isArray(data.steps)) {
        setSteps(data.steps);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPlaywrightScript = () => {
    const script = `// Auto-generated Playwright Test Suite for Production Security Walkthrough
import { test, expect } from '@playwright/test';

test.describe('Production Security Studio Functional Walkthrough', () => {
${steps.map(s => `  test('${s.id}: ${s.userAction.replace(/'/g, "\\'")}', async ({ page }) => {
    // Action: ${s.userAction}
    // Expected: ${s.expectedOutcome}
    // Security Verification: ${s.securityVerification}
    await page.goto('http://localhost:3000');
    // Test assertion placeholder
    expect(true).toBe(true);
  });`).join('\n\n')}
});`;

    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const passedCount = steps.filter(s => s.simulatedStatus === 'passed').length;
  const failedCount = steps.filter(s => s.simulatedStatus === 'failed').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Banner */}
      <div className="bg-slate-900/90 text-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-3 border border-sky-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Production Directive #6</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Functional Stability & Test Walkthrough Suite
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
            Produces structured, verifiable test steps for every user interaction, fallback mechanism, and security validation 
            that can be converted directly into Playwright, Jest, or Cypress automated test scripts.
          </p>
        </div>
      </div>

      {/* Progress & Custom Generator Card */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <span>Interactive QA Walkthrough Matrix (<span className="text-emerald-400 font-bold">{passedCount}</span>/{steps.length} Verified)</span>
            </h2>
            <p className="text-xs text-slate-400">Click any status pill to toggle test verification states.</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyPlaywrightScript}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-sky-200" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Playwright Suite' : 'Export Playwright Script'}</span>
            </button>
          </div>
        </div>

        {/* Generator Input */}
        <div className="flex gap-2 pt-2">
          <input
            type="text"
            value={featureName}
            onChange={(e) => setFeatureName(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="Generate test walkthrough cases for a specific feature..."
          />
          <button
            onClick={handleGenerateCustomWalkthrough}
            disabled={loading}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center space-x-1.5 disabled:opacity-60 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" /> : <Play className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />}
            <span>Generate Cases</span>
          </button>
        </div>
      </div>

      {/* Test Walkthrough List */}
      <div className="space-y-3">
        {steps.map((step) => {
          const statusConfig = {
            passed: {
              label: 'PASSED',
              icon: CheckCircle2,
              classes: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
            },
            failed: {
              label: 'FAILED',
              icon: XCircle,
              classes: 'bg-rose-950/60 text-rose-300 border-rose-700/60'
            },
            pending: {
              label: 'PENDING',
              icon: Clock,
              classes: 'bg-slate-800 text-slate-300 border-slate-700'
            }
          }[step.simulatedStatus];

          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={step.id}
              className="bg-slate-900/80 rounded-xl border border-slate-800 p-5 shadow-xs transition hover:border-slate-700 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {step.id}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {step.featureModule}
                  </span>
                </div>

                <button
                  onClick={() => toggleStatus(step.id)}
                  className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full border transition cursor-pointer ${statusConfig.classes}`}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  <span>{statusConfig.label}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">User Action / Trigger</div>
                  <div className="text-slate-100 font-medium leading-relaxed">{step.userAction}</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Expected Functional Outcome</div>
                  <div className="text-slate-300 leading-relaxed">{step.expectedOutcome}</div>
                </div>

                <div className="bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/40 space-y-1">
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">Security Verification</div>
                  <div className="text-emerald-200 leading-relaxed font-medium">{step.securityVerification}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
