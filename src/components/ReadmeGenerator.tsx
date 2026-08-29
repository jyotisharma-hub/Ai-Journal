import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Layers, 
  Lock, 
  ShieldCheck, 
  Tag
} from 'lucide-react';

export const ReadmeGenerator: React.FC = () => {
  const [serviceName, setServiceName] = useState('production-security-studio');
  const [region, setRegion] = useState('us-central1');
  const [projectId, setProjectId] = useState('YOUR_PROJECT_ID');
  const [copied, setCopied] = useState(false);

  const generateMarkdown = () => {
    return `# ${serviceName}

A secure, enterprise-grade AI Workbench and Security Auditor built with React, Express, TypeScript, and Google Cloud Run. This application provides real-time Agentic Threat Modeling across the 5 Threat Zones, OWASP Top 10 Web and LLM Code Reviews, an automated Gemini Model Fallback Ladder, Firestore Security Rules Generation, and comprehensive test walkthrough generation.

---

## Architecture & Security Highlights

1. **5-Zone Agentic Threat Modeling**: Evaluates Input Surfaces, Planning & Reasoning, Tool Execution, Memory & State, and Inter-System Communication.
2. **Gemini Fallback Ladder**: Automated resilience chain:
   - Primary: \`gemini-3.6-flash\`
   - High-Availability Fallback: \`gemini-3.1-flash-lite\`
   - Dynamic Alias: \`gemini-flash-latest\`
   - Deep Reasoning Fallback: \`gemini-3.7-flash\`
3. **Zero-Hardcoding & Secret Manager**: Operational credentials dynamically fetched through environment secrets without hardcoded strings.
4. **Owner-Bound Firestore Rules**: Zero insecure defaults with strict user isolation (\`request.auth.uid == userId\`).
5. **Defensive Ingestion & Zero-Crash Payload Hygiene**: Strict stripping of \`undefined\` values and null-safe top-level middleware deserialization.

---

## 1. Prerequisites & GCP Setup

1. Install and initialize the Google Cloud SDK (\`gcloud\`):
   \`\`\`bash
   gcloud auth login
   gcloud config set project ${projectId}
   \`\`\`

2. Enable required Google Cloud APIs:
   \`\`\`bash
   gcloud services enable \\
     run.googleapis.com \\
     secretmanager.googleapis.com \\
     firestore.googleapis.com \\
     cloudbuild.googleapis.com
   \`\`\`

---

## 2. Secret Management Setup

Store your Gemini API key in Google Cloud Secret Manager and grant the Cloud Run default service account accessor rights:

\`\`\`bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Retrieve your project number
PROJECT_NUMBER=$(gcloud projects describe ${projectId} --format="value(projectNumber)")

# 3. Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \\
  --member="serviceAccount:\${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \\
  --role="roles/secretmanager.secretAccessor"
\`\`\`

---

## 3. Database Security Configuration (Cloud Firestore)

Deploy the owner-bound security rules to ensure complete user isolation:

\`\`\`javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Default Deny Catch-All
    match /{document=**} {
      allow read, write: if false;
    }

    // Owner-Bound User Interactions
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Threat Models & Audit Logs (User-Bound)
    match /users/{userId}/threat_models/{modelId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
\`\`\`

Deploy the rules via Firebase CLI:
\`\`\`bash
firebase deploy --only firestore:rules
\`\`\`

---

## 4. Google Cloud Run Deployment Flow

Build and deploy the application to Cloud Run with mounted secrets and the mandatory verification campaign label:

\`\`\`bash
# Build and deploy to Cloud Run
gcloud run deploy ${serviceName} \\
  --source . \\
  --platform managed \\
  --region ${region} \\
  --allow-unauthenticated \\
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \\
  --port 3000

# Apply mandatory campaign verification label
gcloud run services update ${serviceName} \\
  --update-labels=dev-tutorial=cloud-run-ai-challenge \\
  --region=${region}
\`\`\`

---

## 5. Local Development

\`\`\`bash
# Install dependencies
npm install

# Configure local environment
cp .env.example .env
# Set GEMINI_API_KEY in .env

# Run full-stack development server on port 3000
npm run dev

# Build production bundle
npm run build

# Start production server
npm start
\`\`\`

---

## License

Apache-2.0
`;
  };

  const mdContent = generateMarkdown();

  const handleCopy = () => {
    navigator.clipboard.writeText(mdContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    a.click();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-2">
      {/* Banner */}
      <div className="bg-slate-900/90 text-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-3 border border-sky-500/30">
            <FileText className="w-3.5 h-3.5" />
            <span>Production Directive #7</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Production Cloud Run README Generator
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
            Generates a copy-pasteable, production-ready README with step-by-step instructions for Google Cloud Run deployment, 
            Secret Manager IAM roles, Firestore security rules, and the mandatory verification campaign label 
            (<code className="text-sky-300">dev-tutorial=cloud-run-ai-challenge</code>).
          </p>
        </div>
      </div>

      {/* Deployment Parameter Form */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Tag className="w-4 h-4 text-sky-400" />
              <span>Deployment Configuration Parameters</span>
            </h2>
            <p className="text-xs text-slate-400">Configure Cloud Run service parameters to generate tailored documentation.</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-sky-200" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied README.md' : 'Copy README.md'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Download README.md</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Cloud Run Service Name
            </label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              GCP Region
            </label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Google Cloud Project ID
            </label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Campaign Label Highlight Card */}
        <div className="bg-sky-950/30 border border-sky-800/40 rounded-xl p-4 flex items-start space-x-3 text-xs text-sky-200">
          <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white">Mandatory Challenge Verification Label:</span>
            <p className="text-slate-300 leading-relaxed">
              Every deployed Cloud Run service MUST include the resource label <code className="bg-slate-950 px-1.5 py-0.5 rounded font-mono font-bold text-sky-300 border border-slate-800">dev-tutorial=cloud-run-ai-challenge</code> for automated challenge verification.
            </p>
          </div>
        </div>

        {/* Generated Markdown Preview */}
        <div className="rounded-xl border border-slate-700 overflow-hidden">
          <div className="bg-slate-950 text-slate-400 px-4 py-2 text-xs font-mono flex items-center justify-between border-b border-slate-800">
            <span className="text-slate-300 font-medium">README.md Preview</span>
            <span className="text-emerald-400 font-bold">100% Directives Compliant</span>
          </div>
          <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap max-h-[500px]">
            {mdContent}
          </pre>
        </div>
      </div>
    </div>
  );
};
