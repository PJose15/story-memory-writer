'use client';

import { useState, useRef, useEffect } from 'react';
import { useStory } from '@/lib/store';
import { Send, Bot, User, Loader2, ShieldAlert, X, AlertTriangle, CheckCircle2, LockKeyhole } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isThinking?: boolean;
  isBlockedMode?: boolean;
}

interface AuditRisk {
  level: 'Low' | 'Medium' | 'High';
  description: string;
  affectedElements: string[];
}

interface AuditResult {
  status: 'Clear' | 'Warnings' | 'Contradictions';
  risks: AuditRisk[];
  suggestedCorrections: string[];
  safeVersion: string;
}

export default function AssistantPage() {
  const { state } = useStory();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your narrative copilot. I have access to your Story Bible, characters, and manuscript. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [pendingAudit, setPendingAudit] = useState<{ request: string; result: AuditResult } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildContext = () => {
    // Filter out discarded items
    const activeCharacters = state.characters.filter(c => c.canonStatus !== 'discarded');
    const activeTimeline = state.timeline_events.filter(t => t.canonStatus !== 'discarded');
    const activeConflicts = state.active_conflicts.filter(c => c.canonStatus !== 'discarded');
    const activeChapters = state.chapters.filter(c => c.canonStatus !== 'discarded');
    const activeRules = state.world_rules.filter(r => r.canonStatus !== 'discarded');
    const activeForeshadowing = state.foreshadowing_elements.filter(f => f.canonStatus !== 'discarded');

    // Group by status
    const getByStatus = (items: any[], status: string) => items.filter(i => (i.canonStatus || 'draft') === status);

    const confirmedItems = [
      ...getByStatus(activeCharacters, 'confirmed').map(c => `[Character] ${c.name}: ${c.description}`),
      ...getByStatus(activeTimeline, 'confirmed').map(t => `[Timeline] ${t.date}: ${t.description}`),
      ...getByStatus(activeConflicts, 'confirmed').map(c => `[Conflict] ${c.title}: ${c.description}`),
      ...getByStatus(activeChapters, 'confirmed').map(c => `[Chapter] ${c.title}: ${c.summary}`),
      ...getByStatus(activeRules, 'confirmed').map(r => `[World Rule] ${r.category}: ${r.rule}`),
      ...getByStatus(activeForeshadowing, 'confirmed').map(f => `[Foreshadowing] ${f.clue} -> ${f.payoff}`)
    ];

    const flexibleItems = [
      ...getByStatus(activeCharacters, 'flexible').map(c => `[Character] ${c.name}: ${c.description}`),
      ...getByStatus(activeTimeline, 'flexible').map(t => `[Timeline] ${t.date}: ${t.description}`),
      ...getByStatus(activeConflicts, 'flexible').map(c => `[Conflict] ${c.title}: ${c.description}`),
      ...getByStatus(activeChapters, 'flexible').map(c => `[Chapter] ${c.title}: ${c.summary}`),
      ...getByStatus(activeRules, 'flexible').map(r => `[World Rule] ${r.category}: ${r.rule}`),
      ...getByStatus(activeForeshadowing, 'flexible').map(f => `[Foreshadowing] ${f.clue} -> ${f.payoff}`)
    ];

    const draftItems = [
      ...getByStatus(activeCharacters, 'draft').map(c => `[Character] ${c.name}: ${c.description}`),
      ...getByStatus(activeTimeline, 'draft').map(t => `[Timeline] ${t.date}: ${t.description}`),
      ...getByStatus(activeConflicts, 'draft').map(c => `[Conflict] ${c.title}: ${c.description}`),
      ...getByStatus(activeChapters, 'draft').map(c => `[Chapter] ${c.title}: ${c.summary}`),
      ...getByStatus(activeRules, 'draft').map(r => `[World Rule] ${r.category}: ${r.rule}`),
      ...getByStatus(activeForeshadowing, 'draft').map(f => `[Foreshadowing] ${f.clue} -> ${f.payoff}`)
    ];

    const latestChapter = activeChapters.length > 0 ? activeChapters[activeChapters.length - 1] : null;

    return `
      STORY BIBLE:
      Title: ${state.title}
      Synopsis: ${state.synopsis}
      Style Profile: ${state.style_profile}
      
      LATEST CHAPTER:
      ${latestChapter ? `Title: ${latestChapter.title}\nSummary: ${latestChapter.summary}\nContent: ${latestChapter.content.substring(0, 1500)}...` : 'None'}
      
      CANON LOCK STATUS:
      You must respect the following certainty levels:
      
      1. CONFIRMED CANON (LOCKED - DO NOT CONTRADICT):
      ${confirmedItems.length ? confirmedItems.join('\n') : 'None'}
      
      2. FLEXIBLE CANON (Build around carefully):
      ${flexibleItems.length ? flexibleItems.join('\n') : 'None'}
      
      3. DRAFT IDEAS (Exploratory, not final):
      ${draftItems.length ? draftItems.join('\n') : 'None'}
    `;
  };

  const handleAudit = async () => {
    if (!input.trim() || isLoading || isAuditing) return;

    setIsAuditing(true);

    try {
      const context = buildContext();
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyContext: context,
          userInput: input,
          language: state.language || 'English',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Audit failed');
      }
      const result = await res.json();
      setPendingAudit({ request: input, result });
      
    } catch (error) {
      console.error('Audit error:', error);
      alert('Failed to perform continuity audit.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!overrideInput) setInput('');
    setIsLoading(true);

    const BLOCKED_PHRASES = [
      'blocked',
      "i'm blocked",
      'im blocked',
      "i'm stuck",
      'im stuck',
      'unblock me',
      'help me continue',
      "i don't know what happens next",
      'i dont know what happens next'
    ];
    
    const isBlockedRequest = BLOCKED_PHRASES.some(phrase => textToSend.toLowerCase().includes(phrase));

    try {
      const context = buildContext();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyContext: context,
          userInput: textToSend,
          isBlockedRequest,
          language: state.language || 'English',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Chat failed');
      }
      const data = await res.json();

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.text,
        isBlockedMode: data.isBlockedMode,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: 'Sorry, I encountered an error processing your request.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-serif font-bold text-zinc-100 flex items-center gap-3">
            <Bot className="text-indigo-400" />
            Narrative Assistant
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Chat with your story&apos;s memory.</p>
        </div>
        
      </header>

      <div className="flex-1 overflow-y-auto space-y-6 pr-4 pb-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-indigo-600' : 'bg-zinc-800 border border-zinc-700'
                }`}
              >
                {msg.role === 'user' ? <User size={20} className="text-white" /> : <Bot size={20} className="text-indigo-400" />}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-sm'
                }`}
              >
                {msg.isBlockedMode && (
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-800/50 text-amber-400">
                    <LockKeyhole size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Blocked Mode Active</span>
                  </div>
                )}
                <div className="prose prose-invert prose-zinc max-w-none font-sans leading-relaxed whitespace-pre-wrap">
                  {msg.role === 'user' ? msg.content : <Markdown>{msg.content}</Markdown>}
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                <Bot size={20} className="text-indigo-400" />
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-3">
                <Loader2 size={18} className="animate-spin text-indigo-400" />
                <span className="text-zinc-400 text-sm font-medium">
                  Thinking about your story...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 pt-4 border-t border-zinc-800">
        <AnimatePresence>
          {pendingAudit && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 mb-4 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-serif font-bold text-zinc-100 flex items-center gap-2">
                  <ShieldAlert className="text-amber-400" />
                  Continuity Audit Results
                </h3>
                <button onClick={() => setPendingAudit(null)} className="text-zinc-500 hover:text-zinc-300">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-400 uppercase tracking-wider font-medium">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${
                    pendingAudit.result.status === 'Clear' ? 'bg-emerald-500/10 text-emerald-400' :
                    pendingAudit.result.status === 'Warnings' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {pendingAudit.result.status === 'Clear' && <CheckCircle2 size={16} />}
                    {pendingAudit.result.status === 'Warnings' && <AlertTriangle size={16} />}
                    {pendingAudit.result.status === 'Contradictions' && <ShieldAlert size={16} />}
                    {pendingAudit.result.status}
                  </span>
                </div>

                {pendingAudit.result.risks && pendingAudit.result.risks.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-zinc-300 uppercase tracking-wider">Risks Found</h4>
                    {pendingAudit.result.risks.map((risk, idx) => (
                      <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <span className={`mt-0.5 px-2 py-0.5 rounded text-xs font-bold ${
                            risk.level === 'High' ? 'bg-red-500/20 text-red-400' :
                            risk.level === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {risk.level}
                          </span>
                          <div>
                            <p className="text-zinc-200 text-sm leading-relaxed">{risk.description}</p>
                            {risk.affectedElements && risk.affectedElements.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {risk.affectedElements.map((el, i) => (
                                  <span key={i} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                                    {el}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {pendingAudit.result.suggestedCorrections && pendingAudit.result.suggestedCorrections.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-zinc-300 uppercase tracking-wider">Suggested Corrections</h4>
                    <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
                      {pendingAudit.result.suggestedCorrections.map((corr, idx) => (
                        <li key={idx}>{corr}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {pendingAudit.result.safeVersion && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-zinc-300 uppercase tracking-wider">Safe Version</h4>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 italic">
                      {pendingAudit.result.safeVersion}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-zinc-800">
                <button
                  onClick={() => {
                    setInput(pendingAudit.result.safeVersion || pendingAudit.request);
                    setPendingAudit(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Use Safe Version
                </button>
                <button
                  onClick={() => {
                    const req = pendingAudit.request;
                    setPendingAudit(null);
                    handleSend(req);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  Proceed Anyway
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <div className="flex gap-2 mb-3 px-1">
            <button
              onClick={() => handleSend("I'm blocked")}
              disabled={isLoading || isAuditing || pendingAudit !== null}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-full transition-colors border border-zinc-700 disabled:opacity-50"
            >
              &quot;I&apos;m blocked&quot;
            </button>
            <button
              onClick={() => handleSend("Help me continue")}
              disabled={isLoading || isAuditing || pendingAudit !== null}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-full transition-colors border border-zinc-700 disabled:opacity-50"
            >
              &quot;Help me continue&quot;
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about your story, request ideas, or say 'I'm stuck'..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-5 pr-24 py-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none h-24"
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <button
              onClick={handleAudit}
              disabled={!input.trim() || isLoading || isAuditing || pendingAudit !== null}
              className="p-2 bg-zinc-800 text-amber-400 rounded-xl hover:bg-zinc-700 disabled:opacity-50 disabled:hover:bg-zinc-800 transition-colors"
              title="Continuity Audit"
            >
              {isAuditing ? <Loader2 size={20} className="animate-spin" /> : <ShieldAlert size={20} />}
            </button>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading || isAuditing || pendingAudit !== null}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
