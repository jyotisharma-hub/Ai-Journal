import React from 'react';
import { 
  ShieldAlert, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Lock, 
  Key, 
  CheckCircle2, 
  FileText, 
  Activity, 
  LogOut, 
  User as UserIcon, 
  Search,
  Fingerprint
} from 'lucide-react';
import { UserProfile } from '../types';

export type TabType = 
  | 'journal-studio'
  | 'journal-archive'
  | 'threat-model' 
  | 'code-review' 
  | 'fallback-ladder' 
  | 'firestore-rules' 
  | 'secret-manager' 
  | 'test-walkthrough' 
  | 'readme-generator';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isBackendHealthy: boolean;
  user: UserProfile | null;
  entryCount: number;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isBackendHealthy,
  user,
  entryCount,
  onLogout
}) => {
  const primaryTabs = [
    { id: 'journal-studio' as TabType, label: 'Reflection Studio', icon: Sparkles, badge: null },
    { id: 'journal-archive' as TabType, label: 'Reflection History', icon: BookOpen, badge: entryCount > 0 ? entryCount : null },
    { id: 'threat-model' as TabType, label: '5-Zone Threat Matrix', icon: Fingerprint, badge: null },
  ];

  const devSuiteTabs = [
    { id: 'fallback-ladder' as TabType, label: 'Gemini Ladder', icon: Layers },
    { id: 'code-review' as TabType, label: 'OWASP Review', icon: Search },
    { id: 'firestore-rules' as TabType, label: 'Firestore Rules', icon: Lock },
    { id: 'secret-manager' as TabType, label: 'Secret Manager', icon: Key },
    { id: 'test-walkthrough' as TabType, label: 'Test Suite', icon: CheckCircle2 },
    { id: 'readme-generator' as TabType, label: 'Cloud Run README', icon: FileText },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#020617]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500/20 to-slate-900 border border-sky-500/30 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-base sm:text-lg tracking-tight">Production Security Studio</span>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  Gemini & Firestore
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                User-Isolated Reflection Journal • Gemini 3.6 Flash • Cloud Run Directives
              </p>
            </div>
          </div>

          {/* Right Header Status & User Account */}
          <div className="flex items-center space-x-3">
            {/* Backend health status */}
            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Activity className={`w-3.5 h-3.5 ${isBackendHealthy ? 'text-emerald-400' : 'text-amber-400'} animate-pulse`} />
              <span className="font-medium text-[11px]">
                {isBackendHealthy ? 'Gemini Engine Active' : 'Connecting...'}
              </span>
            </div>

            {/* User Profile Pill & Sign Out */}
            {user ? (
              <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 p-1 pl-3 rounded-2xl">
                <div className="flex items-center space-x-2">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName} 
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full border border-slate-700 object-cover" 
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-sky-600/30 text-sky-300 font-bold text-[11px] flex items-center justify-center">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-white leading-tight max-w-[120px] truncate">
                      {user.displayName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono leading-tight max-w-[120px] truncate">
                      {user.email || user.userId.slice(0, 10)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="Sign out of Firebase"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Tab Navigation */}
        {user && (
          <div className="flex items-center justify-between overflow-x-auto pb-2 pt-1 border-t border-slate-800/60 no-scrollbar gap-2">
            {/* Primary Journal Tabs */}
            <div className="flex items-center space-x-1">
              {primaryTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                    {tab.badge !== null && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isActive ? 'bg-sky-700 text-white' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Developer Suite Divider & Tabs */}
            <div className="hidden lg:flex items-center space-x-1 pl-4 border-l border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Directives Suite:</span>
              {devSuiteTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition cursor-pointer ${
                      isActive
                        ? 'bg-slate-800 text-sky-400 font-semibold border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
