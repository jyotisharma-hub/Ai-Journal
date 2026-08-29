import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Trash2, 
  ArrowUpRight, 
  Download, 
  Sparkles, 
  BookOpen, 
  Plus, 
  MessageSquare, 
  FileText, 
  Lightbulb, 
  CheckCircle2, 
  Smile, 
  ShieldCheck,
  Tag
} from 'lucide-react';
import { JournalEntry, UserProfile } from '../types';
import { deleteJournalEntry } from '../lib/firebase';

interface JournalArchiveProps {
  user: UserProfile;
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
}

export function JournalArchive({
  user,
  entries,
  onSelectEntry,
  onNewEntry
}: JournalArchiveProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = 
      (entry.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.summary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.tags || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = selectedCategory === 'all' || entry.category === selectedCategory;
    const matchesMood = selectedMood === 'all' || entry.mood === selectedMood;

    return matchesSearch && matchesCat && matchesMood;
  });

  const totalWords = entries.reduce((acc, curr) => acc + (curr.wordCount || 0), 0);
  const totalTurns = entries.reduce((acc, curr) => acc + (curr.messages?.length || 0), 0);

  const handleDelete = async (e: React.MouseEvent, entryId: string) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to permanently delete this reflection from your isolated Firestore storage?')) {
      return;
    }
    setDeletingId(entryId);
    try {
      await deleteJournalEntry(user.userId, entryId);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportSingle = (e: React.MouseEvent, entry: JournalEntry) => {
    e.stopPropagation();
    let md = `# ${entry.title || 'Reflection Session'}\n\n`;
    md += `**Date:** ${new Date(entry.createdAt).toLocaleString()}\n`;
    md += `**Category:** ${entry.category} | **Mood:** ${entry.mood} | **Owner UID:** ${entry.userId}\n\n`;
    
    if (entry.summary) {
      md += `## 📋 Summary\n${entry.summary}\n\n`;
    }

    if (entry.reflectionInsights?.length) {
      md += `## 💡 Key Takeaways\n`;
      entry.reflectionInsights.forEach(item => {
        md += `- ${item}\n`;
      });
      md += `\n`;
    }

    if (entry.messages?.length) {
      md += `## 💬 Transcript\n\n`;
      entry.messages.forEach(m => {
        md += `**${m.sender === 'user' ? user.displayName : 'Gemini 3.6 Flash'}** *[${m.timestamp}]*:\n\n${m.text}\n\n---\n\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(entry.title || 'reflection').toLowerCase().replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner & Stats */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>User-Isolated Firestore Archive</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Your Reflection History & Knowledge Vault
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every reflection session is stored securely under your private path <code className="text-sky-300 font-mono">/users/{'{uid}'}/entries</code>. 
              Only your authenticated Google account has read and write authorization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNewEntry}
              className="flex items-center space-x-2 px-5 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-sky-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Start New Reflection</span>
            </button>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Entries</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white">{entries.length}</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Gemini Turns</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-sky-400">{totalTurns}</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Words Written</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">{totalWords}</div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Owner Isolation</div>
            <div className="text-xs font-mono font-bold text-emerald-400 flex items-center space-x-1 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Verified Rule</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search across topics, summaries, reflections, or keywords..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="reflection">Personal Reflection</option>
              <option value="brainstorming">Brainstorming</option>
              <option value="gratitude">Gratitude</option>
              <option value="work">Work & Strategy</option>
              <option value="personal">Personal Growth</option>
              <option value="general">General Notes</option>
            </select>
          </div>

          {/* Mood Filter */}
          <div className="flex items-center space-x-2">
            <Smile className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">All Mindsets / Moods</option>
              <option value="inspired">Inspired</option>
              <option value="focused">Focused</option>
              <option value="reflective">Reflective</option>
              <option value="contemplative">Contemplative</option>
              <option value="curious">Curious</option>
              <option value="energized">Energized</option>
              <option value="grounded">Grounded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No reflections match your filter</h3>
            <p className="text-xs text-slate-400">
              {entries.length === 0 
                ? "You haven't recorded any reflections yet. Click below to start your first session with Gemini." 
                : "Try adjusting your search query or category filters."}
            </p>
          </div>
          {entries.length === 0 && (
            <button
              onClick={onNewEntry}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-2xl transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Entry</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => onSelectEntry(entry)}
              className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition duration-200 cursor-pointer space-y-4 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Header Pills */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-950/80 border border-sky-800/40 text-[11px] font-semibold text-sky-400 capitalize">
                      {entry.category || 'Reflection'}
                    </span>
                    {entry.mood && (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-medium text-slate-300 capitalize">
                        {entry.mood}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1 text-[11px] text-slate-500 font-mono">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{new Date(entry.createdAt || entry.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition line-clamp-1">
                  {entry.title || 'Untitled Reflection Session'}
                </h3>

                {/* Executive Summary snippet */}
                {entry.summary ? (
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 italic">
                    &ldquo;{entry.summary}&rdquo;
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {entry.content?.slice(0, 120) || 'Multi-turn reflection conversation.'}...
                  </p>
                )}

                {/* Insights tags */}
                {entry.reflectionInsights && entry.reflectionInsights.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Key Takeaway
                    </span>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-200 line-clamp-1 flex items-center space-x-1.5">
                      <Lightbulb className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{entry.reflectionInsights[0]}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-3 text-[11px]">
                  <span className="flex items-center space-x-1">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                    <span>{entry.messages?.length || 0} Turns</span>
                  </span>
                  <span>•</span>
                  <span>{entry.wordCount || 0} words</span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => handleExportSingle(e, entry)}
                    title="Export Markdown"
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(e, entry.id)}
                    disabled={deletingId === entry.id}
                    title="Delete Entry"
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <span className="flex items-center space-x-1 font-semibold text-sky-400 pl-2 group-hover:translate-x-0.5 transition">
                    <span>Open</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
