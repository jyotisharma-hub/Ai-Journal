export type ThreatZone = 
  | 'input_surfaces'
  | 'planning_reasoning'
  | 'tool_execution'
  | 'memory_state'
  | 'inter_system_comm';

export interface ThreatItem {
  id: string;
  zone: ThreatZone;
  zoneLabel: string;
  threat: string;
  scenario: string;
  owaspCategory: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  mitigation: string;
  codeRemediationHint: string;
}

export interface ThreatModelResult {
  title: string;
  systemOverview: string;
  overallRiskScore: number; // 0 - 100
  threats: ThreatItem[];
  architecturalCountermeasures: string[];
  ladderUsed: {
    model: string;
    attempts: number;
    latencyMs: number;
  };
}

export interface Vulnerability {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  owaspId: string;
  description: string;
  vulnerableCodeSnippet: string;
  remediatedCodeSnippet: string;
  explanation: string;
}

export interface SecurityReviewResult {
  summary: string;
  riskScore: number;
  vulnerabilities: Vulnerability[];
  safePatternsIdentified: string[];
  recommendations: string[];
  modelUsed: string;
}

export interface FallbackAttemptLog {
  timestamp: string;
  model: string;
  status: 'SUCCESS' | 'ATTEMPTING' | 'RECOVERED_FALLBACK' | 'FAILED_RETRYING';
  latencyMs: number;
  statusCode?: number;
  message: string;
}

export interface TestWalkthroughStep {
  id: string;
  featureModule: string;
  userAction: string;
  expectedOutcome: string;
  securityVerification: string;
  simulatedStatus: 'pending' | 'passed' | 'failed';
  notes?: string;
}

export interface FirestoreRulesOutput {
  rulesVersion: string;
  rulesContent: string;
  pillarsEnforced: string[];
  auditPassed: boolean;
  sampleTestCases: string[];
}

// -----------------------------------------------------------
// Journal, Reflection, & User Authentication Types
// -----------------------------------------------------------

export type ReflectionMode = 
  | 'reflect'      // Deep inquiry and empathetic mirroring
  | 'summarize'    // Executive summary, key points, and action items
  | 'brainstorm'   // Creative expansion, branching ideas, next steps
  | 'critique';    // Cognitive bias checking, blindspots, counter-arguments

export type EntryMood = 
  | 'inspired'
  | 'focused'
  | 'reflective'
  | 'contemplative'
  | 'curious'
  | 'energized'
  | 'grounded'
  | 'neutral';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
  modelTier?: string;
  mode?: ReflectionMode;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  category: 'reflection' | 'brainstorming' | 'gratitude' | 'work' | 'personal' | 'general';
  content: string;
  summary: string;
  reflectionInsights: string[];
  actionItems?: string[];
  messages: ChatMessage[];
  tags: string[];
  mood: EntryMood;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface ReflectionResponsePayload {
  responseText: string;
  summary: string;
  reflectionInsights: string[];
  actionItems: string[];
  sentimentMood: EntryMood;
  ladderUsed: {
    model: string;
    attempts: number;
    latencyMs: number;
    logs: {
      model: string;
      status: string;
      message: string;
      latencyMs: number;
    }[];
  };
}
