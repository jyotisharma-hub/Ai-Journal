import React, { useState } from 'react';
import { 
  Key, 
  ShieldAlert, 
  Terminal, 
  Copy, 
  Check, 
  Code2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export const SecretManagerStudio: React.FC = () => {
  const [projectId, setProjectId] = useState('my-gcp-project');
  const [secretName, setSecretName] = useState('GEMINI_API_KEY');
  const [projectNumber, setProjectNumber] = useState('123456789012');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const gcpCliCommands = `# 1. Create and populate the secret in Secret Manager
gcloud secrets create ${secretName} --replication-policy="automatic" --project=${projectId}
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add ${secretName} --data-file=- --project=${projectId}

# 2. Grant the Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding ${secretName} \\
  --member="serviceAccount:${projectNumber}-compute@developer.gserviceaccount.com" \\
  --role="roles/secretmanager.secretAccessor" \\
  --project=${projectId}`;

  const pythonAccessorCode = `from google.cloud import secretmanager

def access_secret(secret_id: str, version_id: str = "latest") -> str:
    """Dynamically retrieves operational credentials from GCP Secret Manager."""
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/${projectId}/secrets/{secret_id}/versions/{version_id}"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")

# Operational credential resolution
gemini_api_key = access_secret("${secretName}")`;

  const nodeAccessorCode = `import { GoogleGenAI } from '@google/genai';

// Zero-Hardcoding: Dynamically read from injected environment secret
let client: GoogleGenAI | null = null;

export function getGenAIClient(): GoogleGenAI {
  if (!client) {
    const key = process.env.${secretName};
    if (!key) {
      throw new Error('${secretName} environment variable is required.');
    }
    client = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }
  return client;
}`;

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Banner */}
      <div className="bg-slate-900/90 text-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-3 border border-sky-500/30">
            <Key className="w-3.5 h-3.5" />
            <span>Production Directive #4</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Secret Management & Zero-Hardcoding Hygiene
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
            Eliminates hardcoded credentials and service account files by enforcing dynamic Secret Manager injection 
            and runtime Secret Accessor IAM roles for Cloud Run containers.
          </p>
        </div>
      </div>

      {/* Configurator Box */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-sky-400" />
            <span>Google Cloud Secret Manager Configuration Generator</span>
          </h2>
          <p className="text-xs text-slate-400">Provide GCP Project parameters to generate copy-pasteable CLI deployment commands.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              GCP Project ID
            </label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Secret Name
            </label>
            <input
              type="text"
              value={secretName}
              onChange={(e) => setSecretName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              GCP Project Number
            </label>
            <input
              type="text"
              value={projectNumber}
              onChange={(e) => setProjectNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* CLI Command Box */}
        <div className="rounded-xl border border-slate-700 overflow-hidden">
          <div className="bg-slate-950 text-slate-300 px-4 py-2 text-xs font-mono flex items-center justify-between border-b border-slate-800">
            <span className="text-slate-400">gcloud CLI Command Sequence (IAM & Secrets)</span>
            <button
              onClick={() => handleCopy('cli', gcpCliCommands)}
              className="flex items-center space-x-1 text-xs text-sky-400 hover:text-sky-300 transition font-semibold cursor-pointer"
            >
              {copiedId === 'cli' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'cli' ? 'Copied' : 'Copy Commands'}</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap">
            {gcpCliCommands}
          </pre>
        </div>
      </div>

      {/* Code Patterns Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Python Secret Manager Accessor */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-purple-400" />
              <span>Python Secret Manager Accessor</span>
            </h3>
            <button
              onClick={() => handleCopy('py', pythonAccessorCode)}
              className="text-xs text-slate-400 hover:text-slate-200 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              {copiedId === 'py' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedId === 'py' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3.5 bg-slate-950 text-slate-200 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed border border-slate-800 whitespace-pre-wrap">
            {pythonAccessorCode}
          </pre>
        </div>

        {/* Node.js / TypeScript Accessor */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-sky-400" />
              <span>Node.js / TS Lazy GenAI Accessor</span>
            </h3>
            <button
              onClick={() => handleCopy('ts', nodeAccessorCode)}
              className="text-xs text-slate-400 hover:text-slate-200 font-semibold flex items-center space-x-1 cursor-pointer"
            >
              {copiedId === 'ts' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedId === 'ts' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3.5 bg-slate-950 text-slate-200 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed border border-slate-800 whitespace-pre-wrap">
            {nodeAccessorCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
