'use client';

import { useState, useRef, useEffect } from 'react';
import { useStory, ChatMessage } from '@/lib/store';
import { useSession } from '@/lib/session';
import { Send, Bot, User, Loader2, ShieldAlert, X, AlertTriangle, CheckCircle2, LockKeyhole, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { useToast } from '@/components/toast';
import { useConfirm } from '@/components/confirm-dialog';
import { buildContext } from '@/lib/ai/context-builder';
import { isBlockedResponse, isNormalResponse, type ChatResponseNormal, type ChatResponseBlocked } from '@/lib/types/chat-response';
import { StructuredNormalResponse, StructuredBlockedResponse } from '@/components/assistant/structured-response';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isThinking?: boolean;
  isBlockedMode?: boolean;
  structured?: Record<string, unknown>;
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

const welcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I'm your narrative copilot. I have access to your Story Bible, characters, and manuscript. How can I help you today?",
};

export default function AssistantPage() {
  const { state, updateField } = useStory();
  const { session } = useSession();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const hasLoadedRef = useRef(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [pendingAudit, setPendingAudit] = useState<{ request: string; result: AuditResult } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load saved messages from store on mount
  useEffect(() => {
    if (!hasLoadedRef.current) {
      if (state.chat_messages.length > 0) {
        setMessages(state.chat_messages.map(m => ({ ...m })));
      }
      hasLoadedRef.current = true;
    }
  }, [state.chat_messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Abort any in-flight request on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  // Persist chat messages to store (strip isThinking) — only after initial load
  // Cap at 100 messages to prevent localStorage from growing indefinitely
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const persistable: ChatMessage[] = messages
      .filter(m => !m.isThinking)
      .slice(-100)
      .map(({ id, role, content, isBlockedMode, structured }) => ({ id, role, content, isBlockedMode, structured }));
    updateField('chat_messages', persistable);
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClearChat = async () => {
    if (messages.length <= 1) return;
    const confirmed = await confirm({
      title: 'Clear chat history?',
      message: 'This will remove all messages. This cannot be undone.',
      confirmLabel: 'Clear',
      variant: 'danger',
    });
    if (!confirmed) return;
    setMessages([welcomeMessage]);
    setPendingAudit(null);
  };

  const handleAudit = async () => {
    if (!input.trim() || isLoading || isAuditing) return;

    setIsAuditing(true);

    try {
      const { context } = buildContext(state, {
        userInput: input,
        isBlockedMode: false,
        writerBlockType: session.blockType,
      });
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyContext: context,
          userInput: input,
          language: state.language || 'English',
        }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Audit failed');
      }
      const result = await res.json();
      setPendingAudit({ request: input, result });

    } catch (error) {
      console.error('Audit error:', error);
      toast('Failed to perform continuity audit.', 'error');
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
      "i'm blocked", 'im blocked', "i'm stuck", 'im stuck',
      'i feel blocked', 'i feel stuck',
      'unblock me', 'help me continue',
      "i don't know what happens next", 'i dont know what happens next',
      "i don't know what to write", 'i dont know what to write',
      "writer's block", 'writers block',
      'help me get unstuck', 'what should i write',
      'where do i go from here', "i have no idea",
      "i'm lost", 'im lost', 'feeling stuck', 'feeling blocked',
      "can't write", 'cant write', "can't continue", 'cant continue',
    ];

    const inputLower = textToSend.toLowerCase();
    const BLOCKED_KEYWORDS = ['blocked', 'stuck', 'lost', 'help'];
    const isBlockedRequest = BLOCKED_PHRASES.some(phrase => inputLower.includes(phrase))
      || (session?.blockType && BLOCKED_KEYWORDS.some(kw => inputLower.includes(kw)));

    try {
      const { context, knownEntities } = buildContext(state, {
        userInput: textToSend,
        isBlockedMode: isBlockedRequest,
        writerBlockType: session.blockType,
      });

      // Build multi-turn history from recent messages (last 10 turns = 20 messages)
      const recentMessages = messages.filter(m => m.id !== 'welcome').slice(-20);
      const chatHistory = recentMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyContext: context,
          userInput: textToSend,
          isBlockedRequest,
          language: state.language || 'English',
          chatHistory,
          knownEntities,
          blockType: session.blockType,
        }),
        signal: abortRef.current.signal,
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
        structured: data.structured,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: unknown) {
      console.error('Chat error:', error);
      const isAbort = error instanceof DOMException && error.name === 'AbortError';
      if (!isAbort) {
        const errorMsg = error instanceof Error ? error.message : 'Something went wrong';
        toast(errorMsg, 'error');
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: errorMsg },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderAssistantMessage = (msg: Message) => {
    // If structured data is available, render it with the structured UI
    if (msg.structured) {
      const data = msg.structured as unknown;
      if (isBlockedResponse(data as ChatResponseNormal | ChatResponseBlocked)) {
        return <StructuredBlockedResponse data={data as ChatResponseBlocked & { validationWarnings?: string[] }} />;
      }
      if (isNormalResponse(data as ChatResponseNormal | ChatResponseBlocked)) {
        return <StructuredNormalResponse data={data as ChatResponseNormal} />;
      }
    }
    // Fallback: render as markdown (legacy messages)
    return <Markdown>{msg.content}</Markdown>;
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 md:p-8">
      <header className="flex items-center justify-between border-b border-sepia-300/50 pb-4 mb-4 shrink-0">
        <div>
          <h1 className="letterpress text-2xl font-serif font-bold text-sepia-900 flex items-center gap-3">
            <Bot className="text-brass-500" />
            Narrative Assistant
          </h1>
          <div className="mt-2 h-0.5 w-16 bg-gradient-to-r from-brass-500 to-brass-300/0 rounded-full" />
          <p className="text-sepia-600 text-sm mt-1">Chat with your story&apos;s memory.</p>
        </div>
        <button
          onClick={handleClearChat}
          disabled={messages.length <= 1 || isLoading || isAuditing}
          className="flex items-center gap-2 text-sm text-sepia-500 hover:text-wax-500 hover:bg-sepia-300/20 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:hover:text-sepia-500 disabled:hover:bg-transparent"
          aria-label="Clear chat history"
        >
          <Trash2 size={16} />
          Clear
        </button>
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
                  msg.role === 'user' ? 'bg-forest-700' : 'bg-parchment-200 border border-sepia-300/50'
                }`}
              >
                {msg.role === 'user' ? <User size={20} className="text-cream-50" /> : <Bot size={20} className="text-brass-500" />}
              </div>
              <div
                className={`max-w-[80%] rounded-xl px-5 py-4 ${
                  msg.role === 'user'
                    ? 'bg-forest-700 text-cream-50 rounded-tr-sm'
                    : 'bg-parchment-100 border border-sepia-300/50 text-sepia-700 rounded-tl-sm texture-parchment'
                }`}
              >
                {msg.isBlockedMode && (
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-sepia-300/30 text-brass-600">
                    <LockKeyhole size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">Blocked Mode Active</span>
                  </div>
                )}
                <div className="prose prose-sepia max-w-none font-sans leading-relaxed whitespace-pre-wrap">
                  {msg.role === 'user' ? msg.content : renderAssistantMessage(msg)}
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
              <div className="w-10 h-10 rounded-full bg-parchment-200 border border-sepia-300/50 flex items-center justify-center shrink-0">
                <Bot size={20} className="text-brass-500" />
              </div>
              <div className="bg-parchment-100 border border-sepia-300/50 rounded-xl rounded-tl-sm px-5 py-4 flex items-center gap-3">
                <Loader2 size={18} className="animate-spin text-brass-500" />
                <span className="text-sepia-600 text-sm font-medium">
                  Thinking about your story...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 pt-4 border-t border-sepia-300/50">
        <AnimatePresence>
          {pendingAudit && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-parchment-100 border border-sepia-300/40 rounded-xl p-6 mb-4 texture-parchment shadow-parchment"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-serif font-bold text-sepia-900 flex items-center gap-2">
                  <ShieldAlert className="text-brass-600" />
                  Continuity Audit Results
                </h3>
                <button onClick={() => setPendingAudit(null)} className="text-sepia-500 hover:text-sepia-700" aria-label="Dismiss audit results">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-sepia-600 uppercase tracking-wider font-medium">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${
                    pendingAudit.result.status === 'Clear' ? 'bg-forest-500/10 text-forest-400' :
                    pendingAudit.result.status === 'Warnings' ? 'bg-brass-500/10 text-brass-600' :
                    'bg-wax-500/10 text-wax-500'
                  }`}>
                    {pendingAudit.result.status === 'Clear' && <CheckCircle2 size={16} />}
                    {pendingAudit.result.status === 'Warnings' && <AlertTriangle size={16} />}
                    {pendingAudit.result.status === 'Contradictions' && <ShieldAlert size={16} />}
                    {pendingAudit.result.status}
                  </span>
                </div>

                {pendingAudit.result.risks && pendingAudit.result.risks.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-sepia-700 uppercase tracking-wider">Risks Found</h4>
                    {pendingAudit.result.risks.map((risk, idx) => (
                      <div key={idx} className="bg-parchment-200 border border-sepia-300/50 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <span className={`mt-0.5 px-2 py-0.5 rounded text-xs font-bold ${
                            risk.level === 'High' ? 'bg-wax-500/20 text-wax-500' :
                            risk.level === 'Medium' ? 'bg-brass-500/20 text-brass-600' :
                            'bg-brass-400/20 text-brass-400'
                          }`}>
                            {risk.level}
                          </span>
                          <div>
                            <p className="text-sepia-800 text-sm leading-relaxed">{risk.description}</p>
                            {risk.affectedElements && risk.affectedElements.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {risk.affectedElements.map((el, i) => (
                                  <span key={i} className="text-xs bg-parchment-200 text-sepia-600 px-2 py-1 rounded">
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
                    <h4 className="text-sm font-medium text-sepia-700 uppercase tracking-wider">Suggested Corrections</h4>
                    <ul className="list-disc list-inside text-sm text-sepia-600 space-y-1">
                      {pendingAudit.result.suggestedCorrections.map((corr, idx) => (
                        <li key={idx}>{corr}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {pendingAudit.result.safeVersion && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-sepia-700 uppercase tracking-wider">Safe Version</h4>
                    <div className="bg-parchment-200 border border-sepia-300/50 rounded-xl p-4 text-sm text-sepia-700 italic">
                      {pendingAudit.result.safeVersion}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-sepia-300/50">
                <button
                  onClick={() => {
                    setInput(pendingAudit.result.safeVersion || pendingAudit.request);
                    setPendingAudit(null);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-sepia-700 hover:bg-sepia-300/20 transition-colors"
                >
                  Use Safe Version
                </button>
                <button
                  onClick={() => {
                    const req = pendingAudit.request;
                    setPendingAudit(null);
                    handleSend(req);
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-wax-500/10 text-wax-500 hover:bg-wax-500/20 transition-colors"
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
              className="text-xs bg-parchment-200 hover:bg-parchment-300 text-sepia-700 px-3 py-1.5 rounded-full transition-colors border border-sepia-300/50 disabled:opacity-50"
            >
              &quot;I&apos;m blocked&quot;
            </button>
            <button
              onClick={() => handleSend("Help me continue")}
              disabled={isLoading || isAuditing || pendingAudit !== null}
              className="text-xs bg-parchment-200 hover:bg-parchment-300 text-sepia-700 px-3 py-1.5 rounded-full transition-colors border border-sepia-300/50 disabled:opacity-50"
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
            maxLength={5000}
            className="w-full bg-parchment-100 border border-sepia-300/50 rounded-xl pl-5 pr-24 py-4 text-sepia-900 placeholder-sepia-500 focus:outline-none focus:ring-2 focus:ring-brass-400/40 resize-none h-24"
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <button
              onClick={handleAudit}
              disabled={!input.trim() || isLoading || isAuditing || pendingAudit !== null}
              className="p-2 bg-parchment-200 text-brass-600 rounded-xl hover:bg-sepia-300/30 disabled:opacity-50 disabled:hover:bg-parchment-200 transition-colors"
              aria-label="Continuity Audit"
            >
              {isAuditing ? <Loader2 size={20} className="animate-spin" /> : <ShieldAlert size={20} />}
            </button>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading || isAuditing || pendingAudit !== null}
              className="p-2 bg-forest-700 text-cream-50 rounded-xl hover:bg-forest-600 disabled:opacity-50 disabled:hover:bg-forest-700 transition-colors"
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
