import React, { useState, useEffect } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { AuthLanding } from './components/AuthLanding';
import { JournalStudio } from './components/JournalStudio';
import { JournalArchive } from './components/JournalArchive';
import { ThreatModelMatrix } from './components/ThreatModelMatrix';
import { SecurityReviewer } from './components/SecurityReviewer';
import { ResilienceLadder } from './components/ResilienceLadder';
import { FirestoreSecurityStudio } from './components/FirestoreSecurityStudio';
import { SecretManagerStudio } from './components/SecretManagerStudio';
import { TestWalkthroughSuite } from './components/TestWalkthroughSuite';
import { ReadmeGenerator } from './components/ReadmeGenerator';
import { JournalEntry, UserProfile } from './types';
import { subscribeToAuth, subscribeToUserEntries, logout } from './lib/firebase';
import { User } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>('journal-studio');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean>(true);

  // 1. Health check ping to Express backend
  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (res.ok) setIsBackendHealthy(true);
        else setIsBackendHealthy(false);
      })
      .catch(() => setIsBackendHealthy(false));
  }, []);

  // 2. Firebase Authentication State Listener
  useEffect(() => {
    const unsubscribe = subscribeToAuth((firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          userId: firebaseUser.uid,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Reflective Mind',
          email: firebaseUser.email || '',
          photoURL: firebaseUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        });
      } else {
        // If not logged in via Google Auth, preserve null
        setUser(prev => (prev?.userId.startsWith('demo_user_') ? prev : null));
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 3. User-Isolated Firestore Entries Real-Time Subscription
  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    const unsubscribe = subscribeToUserEntries(
      user.userId,
      (updatedEntries) => {
        setEntries(updatedEntries);
      },
      (error) => {
        console.warn('Firestore subscription notice (rules active or demo mode):', error.message);
      }
    );

    return () => unsubscribe();
  }, [user?.userId]);

  // Handle Demo Mode / Test Sandbox Account
  const handleDemoLogin = () => {
    const demoProfile: UserProfile = {
      userId: `demo_user_${Date.now().toString(36)}`,
      displayName: 'Sandbox Explorer',
      email: 'demo.developer@cloudrun.local',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
    setUser(demoProfile);
    setActiveTab('journal-studio');
  };

  const handleAuthSuccess = (firebaseUser: User) => {
    setUser({
      userId: firebaseUser.uid,
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Reflective User',
      email: firebaseUser.email || '',
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    });
    setActiveTab('journal-studio');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn('Logout:', e);
    }
    setUser(null);
    setCurrentEntry(null);
    setEntries([]);
    setActiveTab('journal-studio');
  };

  const handleSelectEntry = (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setActiveTab('journal-studio');
  };

  const handleNewEntryRequest = () => {
    setCurrentEntry(null);
    setActiveTab('journal-studio');
  };

  const handleEntrySaved = (savedEntry: JournalEntry) => {
    setCurrentEntry(savedEntry);
    setEntries(prev => {
      const idx = prev.findIndex(e => e.id === savedEntry.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedEntry;
        return copy;
      }
      return [savedEntry, ...prev];
    });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col font-sans selection:bg-sky-900 selection:text-sky-100">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendHealthy={isBackendHealthy}
        user={user}
        entryCount={entries.length}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!user ? (
          <AuthLanding
            onDemoLogin={handleDemoLogin}
            onAuthSuccess={handleAuthSuccess}
          />
        ) : (
          <>
            {activeTab === 'journal-studio' && (
              <JournalStudio
                user={user}
                currentEntry={currentEntry}
                onEntrySaved={handleEntrySaved}
                onNewEntryRequest={handleNewEntryRequest}
              />
            )}

            {activeTab === 'journal-archive' && (
              <JournalArchive
                user={user}
                entries={entries}
                onSelectEntry={handleSelectEntry}
                onNewEntry={handleNewEntryRequest}
              />
            )}

            {activeTab === 'threat-model' && <ThreatModelMatrix />}
            {activeTab === 'code-review' && <SecurityReviewer />}
            {activeTab === 'fallback-ladder' && <ResilienceLadder />}
            {activeTab === 'firestore-rules' && <FirestoreSecurityStudio />}
            {activeTab === 'secret-manager' && <SecretManagerStudio />}
            {activeTab === 'test-walkthrough' && <TestWalkthroughSuite />}
            {activeTab === 'readme-generator' && <ReadmeGenerator />}
          </>
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-[#0f172a]/60 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Production Security Studio • User-Authenticated Reflection Journal with Cloud Firestore</span>
          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <span>Isolation: <strong className="text-emerald-400">/users/{'{uid}'}/entries</strong></span>
            <span>•</span>
            <span>Label: <strong className="text-slate-300">dev-tutorial=cloud-run-ai-challenge</strong></span>
            <span>•</span>
            <span>Engine: <strong className="text-sky-400">gemini-3.6-flash</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
