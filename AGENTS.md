# Production Directives & Agentic Security Architecture

## 1. Agentic Threat Modeling
* **Objective**: Force the model to perform a structured, scenario-driven threat analysis prior to outputting code or system architecture.
* **Scope Lens (The 5 Threat Zones)**:
  * **Input Surfaces**: Prompts, untrusted user uploads, external API payloads.
  * **Planning & Reasoning**: Prompt injection, system instruction bypass, tool routing hijacking.
  * **Tool Execution**: Privilege escalation via API functions, SSRF, dynamic code execution risks.
  * **Memory & State**: Firestore state persistence, session hijacking, cross-user data leaks.
  * **Inter-System Communication**: External API calls (e.g., Google Maps, Google Sheets), token leakage.
* **Mandatory Execution Criteria**: Whenever the user asks to design or implement a feature, the model must first generate a Threat Summary Table mapping risks to countermeasures.

## 2. Secure Coding Standard
* **Objective**: Support mitigations corresponding with the OWASP Top 10 (Web) and OWASP Top 10 for LLM Applications.
* **Core Principles Implemented**:
  * **Input Validation & Sanitization (OWASP A03 / LLM02)**: Strict schema validation for all incoming inputs; explicit parameterization to prevent SQLi, NoSQLi, and Command Injection.
  * **Indirect Prompt Injection Defense (OWASP LLM01)**: Treat data retrieved from untrusted sources (e.g., external APIs, web pages, user files) as plain data, never as executable instructions.
  * **Broken Access Control Mitigation (OWASP A01)**: Validate authorization headers and context-bound permissions at every API boundary.
  * **Output Handling (OWASP A03 / LLM05)**: Encode all dynamic LLM outputs prior to rendering in HTML/JS interfaces or executing downstream system commands.

## 3. Secure Firestore & Firebase Auth Configuration
* **Objective**: Limit data exposure and unauthorized database reads/writes in Firebase/Firestore architectures.
* **Core Security Rules**:
  * **Zero Insecure Defaults**: Never output `allow read, write: if true;`.
  * **User Data Isolation**: Support owner-bound path checking (`request.auth.uid == userId`) for personal documents.
  * **Role-Based Access Control (RBAC)**: Use custom claims or dynamic document lookups (`get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role`) for elevated administrative operations.
  * **Auth State Integrity**: Verify JWT tokens on backend server environments (e.g., Cloud Functions or Cloud Run) using the Firebase Admin SDK.
  * **Passwordless/Federated Auth**: Prefer Federated Identity (e.g., Google Sign-In via Firebase Auth) to outsource credential management securely.

## 4. Secret Management & Zero-Hardcoding Hygiene
* **Objective**: Eliminate hardcoded credentials, API keys, service account JSON files, and tokens.
* **Mandatory Code Patterns**:
  * **Prohibit Hardcoded Strings**: Flag any pattern resembling `const API_KEY = "AIzaSy..."` as a critical flaw.
  * **Google Cloud Secret Manager Integration**: Force code to retrieve operational credentials dynamically using Secret Manager or environment variable injection.

## 5. Security Reviewer Persona
* **Objective**: Review any code for common security issues, based on the threat model and best practices.
* **Review Methodology**:
  * Inspect for hardcoded credentials and unsafe default settings.
  * Map data flow from untrusted entry point to storage/execution sink.
  * Validate access control checks at every function boundary.
  * Provide a severity-ranked vulnerability list with concrete code diffs for remediation.

## 6. Functional Stability & Walkthroughs
* **Interactive Functionality**: Any buttons that submit an input, either to Gemini API, Firestore, or any added functionality, must actually work.
* **Gemini Model Resilience & Fallback Protocol**:
  1. **Resilient Model Fallback Ladder**:
     - Primary: `"gemini-3.6-flash"`
     - High-Availability Fallback: `"gemini-3.1-flash-lite"`
     - Dynamic Alias: `"gemini-flash-latest"`
     - Deep Reasoning Fallback: `"gemini-3.7-flash"`
  2. **Error Recovery Matrix**: Catch recoverable HTTP/API status codes (`503 UNAVAILABLE`, `429 RESOURCE_EXHAUSTED`, `404 NOT_FOUND`, `500 INTERNAL`) and sequentially attempt the next model in the fallback chain before bubbling an error up to the UI.
  3. **Standard Helper Implementation**: Reusable helper utility (`generateContentWithFallback`) in backend routes for uniform resilience.
* **Server-Side Robustness & Payload Ingestion Standards**:
  1. **Top-Level Request Deserialization**: Always mount body parsers before defining any endpoint routes.
  2. **Defensive Payload Ingestion**: Null-safe destructuring with defaults. Return clean 400 Bad Request on invalid payloads.
  3. **Unified Full-Stack Dev Script Alignment**: Startup scripts (`dev`, `build`, `start`) boot the unified server entrypoint (`tsx server.ts` / `node dist/server.cjs`).
* **Database Persistence, Clean Payloads, & Transaction Integrity**:
  1. **Strict Undefined-Stripping**: Strip all `undefined` values before passing to database SDKs.
  2. **Guaranteed Transaction Verification**: Ensure persistence and never clear user input buffer until persistence is confirmed.
  3. **Explicit Error Escalation & User Feedback**: User-facing error notifications with retry capability.

## 7. Production README & Deployment
* Provision Firestore with owner-bound rules.
* Bind Secret Manager IAM permissions for Cloud Run service account.
* Deploy with mandatory campaign label `dev-tutorial=cloud-run-ai-challenge`.
