# Production Security Studio

A secure, enterprise-grade AI Workbench and Security Auditor built with React, Express, TypeScript, and Google Cloud Run. This application provides real-time Agentic Threat Modeling across the 5 Threat Zones, OWASP Top 10 Web and LLM Code Reviews, an automated Gemini Model Fallback Ladder, Firestore Security Rules Generation, and comprehensive test walkthrough generation.

---

## Architecture & Security Highlights

1. **5-Zone Agentic Threat Modeling**: Evaluates Input Surfaces, Planning & Reasoning, Tool Execution, Memory & State, and Inter-System Communication.
2. **Gemini Fallback Ladder**: Automated resilience chain:
   - Primary: `gemini-3.6-flash`
   - High-Availability Fallback: `gemini-3.1-flash-lite`
   - Dynamic Alias: `gemini-flash-latest`
   - Deep Reasoning Fallback: `gemini-3.7-flash`
3. **Zero-Hardcoding & Secret Manager**: Operational credentials dynamically fetched through environment secrets without hardcoded strings.
4. **Owner-Bound Firestore Rules**: Zero insecure defaults with strict user isolation (`request.auth.uid == userId`).
5. **Defensive Ingestion & Zero-Crash Payload Hygiene**: Strict stripping of `undefined` values and null-safe top-level middleware deserialization.

---

## 1. Prerequisites & GCP Setup

1. Install and initialize the Google Cloud SDK (`gcloud`):
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. Enable required Google Cloud APIs:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     cloudbuild.googleapis.com
   ```

---

## 2. Secret Management Setup

Store your Gemini API key in Google Cloud Secret Manager and grant the Cloud Run default service account accessor rights:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Retrieve your project number
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

# 3. Grant the Cloud Run compute service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration (Cloud Firestore)

Deploy the owner-bound security rules to ensure complete user isolation:

```javascript
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
```

Deploy the rules via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Google Cloud Run Deployment Flow

Build and deploy the application to Cloud Run with mounted secrets and the mandatory verification campaign label:

```bash
# Build and deploy to Cloud Run
gcloud run deploy production-security-studio \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000

# Apply mandatory campaign verification label
gcloud run services update production-security-studio \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 5. Local Development

```bash
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
```

---

## License

Apache-2.0
