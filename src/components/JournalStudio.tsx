import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  RefreshCw, 
  Bookmark, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  Database, 
  ShieldCheck, 
  Cpu, 
  FileText, 
  Download, 
  Lightbulb, 
  Compass, 
  Flame, 
  Sliders, 
  Layers,
  ArrowRight,
  CheckCircle2,
  Smile,
  AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, EntryMood, JournalEntry, ReflectionMode, UserProfile } from '../types';
import { saveJournalEntry } from '../lib/firebase';
import { stripUndefined } from '../utils/sanitize';

interface JournalStudioProps {
  user: UserProfile;
  currentEntry: JournalEntry | null;
  onEntrySaved: (entry: JournalEntry) => void;
  onNewEntryRequest: () => void;
}

const DEFAULT_PROMPTS = [
  "What was the most challenging decision I faced today, and how did I reason through it?",
  "I am brainstorming a new project. Help me explore 5 unconventional angles and core user pain points.",
  "Here is my week in review. Please provide an executive summary and 3 high-leverage action items.",
  "I have an intuition about an upcoming transition. Help me audit my blind spots and assumptions."
];

export function JournalStudio({
  user,
  currentEntry,
  onEntrySaved,
  onNewEntryRequest
}: JournalStudioProps) {
  // Active session states
  const [entryId, setEntryId] = useState<string>(currentEntry?.id || `entry_${Date.now()}`);
  const [title, setTitle] = useState<string>(currentEntry?.title || '');
  const [category, setCategory] = useState<JournalEntry['category']>(currentEntry?.category || 'reflection');
  const [mode, setMode] = useState<ReflectionMode>('reflect');
  const [inputText, setInputText] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>(currentEntry?.messages || []);
  const [summary, setSummary] = useState<string>(currentEntry?.summary || '');
  const [insights, setInsights] = useState<string[]>(currentEntry?.reflectionInsights || []);
  const [actionItems, setActionItems] = useState<string[]>(currentEntry?.actionItems || []);
  const [mood, setMood] = useState<EntryMood>(currentEntry?.mood || 'reflective');
  
  // UI & Network states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [ladderTelemetry, setLadderTelemetry] = useState<{ model: string; attempts: number; latencyMs: number } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync when currentEntry changes externally (e.g. clicked from Archive)
  useEffect(() => {
    if (currentEntry) {
      setEntryId(currentEntry.id);
      setTitle(currentEntry.title);
      setCategory(currentEntry.category);
      setMessages(currentEntry.messages || []);
      setSummary(currentEntry.summary || '');
      setInsights(currentEntry.reflectionInsights || []);
      setActionItems(currentEntry.actionItems || []);
      setMood(currentEntry.mood || 'reflective');
    }
  }, [currentEntry?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to persist current state to Firestore
  const persistToFirestore = async (overrideData?: Partial<JournalEntry>): Promise<JournalEntry> => {
    setSaveStatus('saving');
    const fullContent = messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n\n');
    const wordCount = fullContent.split(/\s+/).filter(Boolean).length;
    
    const entryToSave: JournalEntry = {
      id: entryId,
      userId: user.userId,
      title: title.trim() || `Reflection: ${new Date().toLocaleDateString()}`,
      category,
      content: fullContent,
      summary: overrideData?.summary !== undefined ? overrideData.summary : summary,
      reflectionInsights: overrideData?.reflectionInsights || insights,
      actionItems: overrideData?.actionItems || actionItems,
      messages: overrideData?.messages || messages,
      tags: [category, mode, mood],
      mood: overrideData?.mood || mood,
      wordCount,
      createdAt: currentEntry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveJournalEntry(user.userId, stripUndefined(entryToSave));
      setSaveStatus('saved');
      onEntrySaved(entryToSave);
      return entryToSave;
    } catch (err: any) {
      console.error('Firestore save failure:', err);
      setSaveStatus('error');
      throw err;
    }
  };

  const handleSendThought = async () => {
    const textToSend = inputText.trim();
    if (!textToSend || loading) return;

    setError(null);
    setInputText('');

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    // Ensure title is generated if blank
    const activeTitle = title.trim() || textToSend.slice(0, 40) + '...';
    if (!title.trim()) {
      setTitle(activeTitle);
    }

    try {
      const response = await fetch('/api/journal/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: textToSend,
          title: activeTitle,
          mode,
          conversationHistory: updatedMessages.map(m => ({ sender: m.sender, text: m.text })),
          userId: user.userId
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();

      const geminiMessage: ChatMessage = {
        id: `msg_gemini_${Date.now()}`,
        sender: 'gemini',
        text: data.responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelTier: data.ladderUsed?.model || 'gemini-3.6-flash',
        mode
      };

      const finalMessages = [...updatedMessages, geminiMessage];
      setMessages(finalMessages);

      if (data.summary) setSummary(data.summary);
      if (data.reflectionInsights?.length) setInsights(data.reflectionInsights);
      if (data.actionItems?.length) setActionItems(data.actionItems);
      if (data.sentimentMood) setMood(data.sentimentMood);
      if (data.ladderUsed) setLadderTelemetry(data.ladderUsed);

      // Auto-persist combined state to Firestore
      await persistToFirestore({
        messages: finalMessages,
        summary: data.summary || summary,
        reflectionInsights: data.reflectionInsights || insights,
        actionItems: data.actionItems || actionItems,
        mood: data.sentimentMood || mood
      });

    } catch (err: any) {
      console.error('Gemini Reflection API error:', err);
      setError(err.message || 'Failed to generate reflection response.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendThought();
    }
  };

  const handleExportMarkdown = () => {
    let md = `# ${title || 'Reflection Session'}\n\n`;
    md += `**Date:** ${new Date().toLocaleString()}\n`;
    md += `**Category:** ${category} | **Mood:** ${mood} | **User:** ${user.displayName}\n\n`;
    
    if (summary) {
      md += `## 📋 Executive Summary\n${summary}\n\n`;
    }

    if (insights.length > 0) {
      md += `## 💡 Key Philosophical & Strategic Takeaways\n`;
      insights.forEach(item => {
        md += `- ${item}\n`;
      });
      md += `\n`;
    }

    if (actionItems.length > 0) {
      md += `## 🎯 Action Items & Exercises\n`;
      actionItems.forEach(item => {
        md += `- [ ] ${item}\n`;
      });
      md += `\n`;
    }

    md += `## 💬 Reflection Transcript\n\n`;
    messages.forEach(m => {
      md += `### ${m.sender === 'user' ? '👤 ' + user.displayName : '✨ Gemini (' + (m.modelTier || 'gemini-3.6-flash') + ')'} *[${m.timestamp}]*\n\n${m.text}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'reflection').toLowerCase().replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Session Configuration & Metadata Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Title and Category */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
              <span className="flex items-center space-x-1 text-sky-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Isolated Firestore Subcollection:</span>
              </span>
              <code className="text-slate-300 font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                /users/{user.userId.slice(0, 8)}.../entries/{entryId.slice(0, 10)}
              </code>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => persistToFirestore()}
              placeholder="Give your reflection a topic or focus (e.g. Q3 Architecture Strategy, Mindset Shift)..."
              className="w-full bg-transparent text-xl sm:text-2xl font-bold text-white placeholder-slate-500 focus:outline-none border-b border-transparent focus:border-sky-500 transition py-1"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Save Status Badge */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-300">
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'saved' && 'Firestore Synced'}
                {saveStatus === 'error' && 'Sync Error'}
                {saveStatus === 'idle' && 'Unsaved'}
              </span>
              {saveStatus === 'saved' && <Check className="w-3 h-3 text-emerald-400" />}
            </div>

            <button
              onClick={handleExportMarkdown}
              title="Export as Markdown document"
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export</span>
            </button>

            <button
              onClick={onNewEntryRequest}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Entry</span>
            </button>
          </div>
        </div>

        {/* Mode Selector & Category Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          {/* Reflection Mode Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>Gemini Mode:</span>
            </span>

            {[
              { id: 'reflect', label: 'Reflect & Mirror', icon: Compass, color: 'sky' },
              { id: 'brainstorm', label: 'Brainstorm & Ideate', icon: Lightbulb, color: 'amber' },
              { id: 'summarize', label: 'Executive Summary', icon: FileText, color: 'emerald' },
              { id: 'critique', label: 'Critical Audit', icon: Layers, color: 'purple' }
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as ReflectionMode)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center space-x-2 text-xs">
            <label className="text-slate-400 font-semibold">Category:</label>
            <select
              value={category}
              onChange={(e) => {
                const newCat = e.target.value as JournalEntry['category'];
                setCategory(newCat);
                persistToFirestore({ category: newCat });
              }}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="reflection">Personal Reflection</option>
              <option value="brainstorming">Brainstorming</option>
              <option value="gratitude">Gratitude</option>
              <option value="work">Work & Strategy</option>
              <option value="personal">Personal Growth</option>
              <option value="general">General Notes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Studio Grid: Left (Multi-Turn Chat) vs Right (Live Reflection Insights) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Multi-Turn Reflection Conversation (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Chat Stream Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 min-h-[440px] max-h-[600px] overflow-y-auto space-y-4 shadow-md flex flex-col justify-between">
            {messages.length === 0 ? (
              <div className="my-auto text-center space-y-4 py-8 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Start Your Reflection</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Write down any thoughts, decisions, or dilemmas. Gemini will converse with you in multi-turn depth while extracting structured takeaways.
                  </p>
                </div>

                {/* Prompt Starters */}
                <div className="space-y-2 text-left pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Quick Reflection Starters:
                  </span>
                  {DEFAULT_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputText(prompt)}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition leading-relaxed cursor-pointer"
                    >
                      &ldquo;{prompt}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col space-y-1 ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center space-x-2 px-1 text-[11px] text-slate-400 font-medium">
                        <span>{isUser ? user.displayName : 'Gemini 3.6 Flash'}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                        {msg.modelTier && (
                          <span className="font-mono text-[10px] text-sky-400 bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-800/40">
                            {msg.modelTier}
                          </span>
                        )}
                      </div>

                      <div
                        className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed max-w-[90%] sm:max-w-[85%] ${
                          isUser
                            ? 'bg-sky-600 text-white rounded-tr-xs'
                            : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-xs'
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        ) : (
                          <div className="markdown-body text-slate-100 space-y-2">
                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>
                        )}
                      </div>

                      {!isUser && (
                        <div className="flex items-center space-x-2 pt-0.5 px-1">
                          <button
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="flex items-center space-x-1 text-[11px] text-slate-500 hover:text-slate-300 transition cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-start space-x-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl max-w-[80%] animate-pulse">
                    <RefreshCw className="w-4 h-4 text-sky-400 animate-spin mt-0.5 shrink-0" />
                    <div className="space-y-1 text-xs text-slate-400">
                      <p className="font-semibold text-slate-200">Gemini is synthesizing reflections...</p>
                      <p className="text-[11px]">Traversing resilient model ladder & extracting key takeaways</p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* User Input Composer */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-lg space-y-3">
            {error && (
              <div className="flex items-center space-x-2 p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Write your thought in ${mode.toUpperCase()} mode... (Cmd/Ctrl + Enter to send)`}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition resize-none"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                <span>{inputText.length} chars</span>
                <span>•</span>
                <span className="hidden sm:inline">Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300 font-mono">⌘+Enter</kbd> to submit</span>
              </div>

              <button
                onClick={handleSendThought}
                disabled={!inputText.trim() || loading}
                className="flex items-center space-x-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition shadow-md shadow-sky-600/20 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Reflecting...</span>
                  </>
                ) : (
                  <>
                    <span>Reflect with Gemini</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Structured Insights & Executive Synthesis (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Executive Summary Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                <FileText className="w-4 h-4" />
                <span>Executive Synthesis</span>
              </div>
              <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-semibold text-slate-300 capitalize">
                <Smile className="w-3 h-3 text-sky-400" />
                <span>Mood: {mood}</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
              {summary || "Your continuous session summary will automatically appear here as you interact with Gemini."}
            </p>
          </div>

          {/* Key Philosophical & Strategic Insights */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Lightbulb className="w-4 h-4" />
                <span>Extracted Takeaways</span>
              </div>
              <span className="text-[11px] text-slate-500">{insights.length} Insights</span>
            </div>

            {insights.length === 0 ? (
              <p className="text-xs text-slate-400">
                Core philosophical insights will be organized into structured cards as the reflection progresses.
              </p>
            ) : (
              <div className="space-y-2">
                {insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-start space-x-2.5 text-xs text-slate-200 leading-relaxed"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{insight}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Items & Exercises */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Next Actions & Exercises</span>
              </div>
              <span className="text-[11px] text-slate-500">{actionItems.length} Actions</span>
            </div>

            {actionItems.length === 0 ? (
              <p className="text-xs text-slate-400">
                Concrete next steps, journaling prompts, and decision points will appear here.
              </p>
            ) : (
              <div className="space-y-2">
                {actionItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-start space-x-2 text-xs text-slate-200 leading-relaxed"
                  >
                    <input
                      type="checkbox"
                      id={`action_${idx}`}
                      className="mt-1 rounded text-sky-600 focus:ring-sky-500 bg-slate-900 border-slate-700"
                    />
                    <label htmlFor={`action_${idx}`} className="flex-1 cursor-pointer">
                      {item}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resilience Ladder Active Telemetry Pill */}
          {ladderTelemetry && (
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2 text-slate-400">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                <span>Engine: <strong className="text-slate-200">{ladderTelemetry.model}</strong></span>
              </div>
              <div className="text-emerald-400 font-semibold">
                {ladderTelemetry.latencyMs}ms • Tier {ladderTelemetry.attempts}/4
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
