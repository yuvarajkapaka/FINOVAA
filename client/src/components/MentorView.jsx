import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Wallet,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { apiFetch } from '../api/config';

const DEFAULT_SUGGESTED_QUESTIONS = [
  'What is compound interest?',
  'What is diversification?',
  'Explain my portfolio allocation.',
  'Why did my simulated portfolio value change?',
  'Explain the outcome of my latest financial scenario.',
  'How can I improve my financial knowledge score?'
];

export default function MentorView({ wallet, portfolio, scoreData }) {
  const [lastSentText, setLastSentText] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-msg',
      sender: 'mentor',
      content: `### Welcome to FINOVA AI Financial Mentor! 🎓

I am your personal financial strategy guide. I can help you:
- **Demystify Money Concepts**: Understand compound interest, inflation, diversification, and asset allocation with simple Indian Rupee (₹) examples.
- **Explain Your Simulation**: Break down your verified virtual portfolio, unrealized returns, and emergency reserves.
- **Analyze Scenario Trade-offs**: Review how your latest life simulation choices impacted your finances.
- **Advance Your Resilience**: Provide step-by-step guidance to achieve a 100/100 Financial Literacy Score.

Click any of the suggested questions below, or type your own question to begin!`,
      model: 'FINOVA AI Mentor',
      mode: 'SYSTEM',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mentorStatus, setMentorStatus] = useState(null);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [showContextDrawer, setShowContextDrawer] = useState(false);
  const [verifiedContext, setVerifiedContext] = useState(null);

  // Compute dynamic contextual questions based on real application state
  const contextualQuestions = React.useMemo(() => {
    const list = [];
    const savings = wallet?.balances?.savings_balance_inr || 0;
    const holdingsCount = portfolio?.holdings?.length || 0;

    if (savings < 20000) {
      list.push('How much emergency cushion is recommended for young investors?');
    }
    if (holdingsCount > 0) {
      list.push('How does my current asset allocation protect against market cycles?');
    }
    list.push('What is the difference between saving in a vault and investing?');
    list.push('Why does pure wealth award 0 points on the Literacy rubric?');
    return list;
  }, [wallet, portfolio]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const fetchStatusAndContext = async () => {
    setIsRefreshingStatus(true);
    try {
      const [statusRes, ctxRes] = await Promise.all([
        apiFetch('/api/mentor/status'),
        apiFetch('/api/mentor/context')
      ]);

      if (statusRes.ok) {
        const sData = await statusRes.json();
        setMentorStatus(sData);
      }
      if (ctxRes.ok) {
        const cData = await ctxRes.json();
        setVerifiedContext(cData.context);
      }
    } catch (err) {
      console.warn('Could not fetch mentor status:', err);
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatusAndContext();
  }, []);

  const handleSendMessage = async (textToSend) => {
    const content = (textToSend || inputMessage).trim();
    if (!content || isLoading) return;

    setLastSentText(content);
    setError(null);

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome-msg')
        .slice(-6)
        .map((m) => ({
          sender: m.sender,
          content: m.content
        }));

      const res = await apiFetch('/api/mentor/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          history: historyPayload
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to receive advice from mentor.');
      }

      const mentorMessage = {
        id: `mentor-${Date.now()}`,
        sender: 'mentor',
        content: data.reply,
        model: data.model || 'FINOVA Mentor',
        mode: data.mode || 'AI',
        disclaimer: data.disclaimer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, mentorMessage]);
    } catch (err) {
      setError(err.message || 'Network error reaching mentor service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearConversation = () => {
    setMessages([
      {
        id: 'welcome-msg',
        sender: 'mentor',
        content: `### Welcome back to FINOVA AI Financial Mentor! 🎓\n\nHow can I help you analyze your finances, explain concepts, or review scenario outcomes today?`,
        model: 'FINOVA AI Mentor',
        mode: 'SYSTEM',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setError(null);
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    const paragraphs = text.split('\n\n');

    return paragraphs.map((para, pIdx) => {
      if (para.startsWith('### ')) {
        return (
          <h3 key={pIdx} className="font-serif text-sm sm:text-base font-bold text-ink mt-3 mb-1.5 first:mt-0">
            {para.replace('### ', '')}
          </h3>
        );
      }
      if (para.startsWith('## ')) {
        return (
          <h2 key={pIdx} className="font-serif text-base sm:text-lg font-bold text-ink mt-3 mb-2 first:mt-0">
            {para.replace('## ', '')}
          </h2>
        );
      }

      const lines = para.split('\n');

      if (lines.some(l => l.trim().startsWith('- ') || l.trim().startsWith('* '))) {
        return (
          <ul key={pIdx} className="my-2 space-y-1 pl-2 text-xs sm:text-sm text-ink-muted">
            {lines.map((l, lIdx) => {
              const clean = l.replace(/^[-*]\s+/, '');
              return (
                <li key={lIdx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-forest mt-1.5 shrink-0" />
                  <span dangerouslySetInnerHTML={{
                    __html: clean
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-ink font-semibold">$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em class="text-ink-muted">$1</em>')
                  }} />
                </li>
              );
            })}
          </ul>
        );
      }

      return (
        <p
          key={pIdx}
          className="text-xs sm:text-sm text-ink leading-relaxed mb-2 last:mb-0"
          dangerouslySetInnerHTML={{
            __html: para
              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-ink font-semibold">$1</strong>')
              .replace(/\*(.*?)\*/g, '<em class="text-ink-muted">$1</em>')
          }}
        />
      );
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 px-2 sm:px-4 pb-12 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-canvas-white border border-edge rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-forest text-canvas-white flex items-center justify-center shadow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">AI Financial Mentor</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-forest/10 text-forest border border-forest/20 uppercase tracking-wider">
                Read-Only Advisor
              </span>
            </div>
            <p className="text-xs sm:text-sm text-ink-muted">
              Personalized financial education, concept breakdowns, and verified simulation insights
            </p>
          </div>
        </div>

        {/* Model Status & Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-canvas-subtle border border-edge text-xs">
            <span className={`w-2 h-2 rounded-full ${mentorStatus?.isAvailable ? 'bg-pos' : 'bg-copper'}`} />
            <span className="font-medium text-ink">
              {mentorStatus?.isAvailable && mentorStatus?.activeModel ? (
                <>AI Active: <span className="text-forest font-semibold">{mentorStatus.activeModel}</span></>
              ) : (
                <span className="text-copper font-semibold">Educational Knowledge Base</span>
              )}
            </span>
            <button
              onClick={fetchStatusAndContext}
              disabled={isRefreshingStatus}
              title="Refresh connection status"
              className="text-ink-muted hover:text-ink transition-colors ml-1 p-0.5"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <button
            onClick={() => setShowContextDrawer(!showContextDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-canvas-subtle hover:bg-canvas-subtle/80 text-ink border border-edge text-xs font-medium transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-forest" />
            <span>Verified Context</span>
            {showContextDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleClearConversation}
            title="Clear Chat Conversation"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-canvas-subtle hover:bg-canvas-subtle/80 text-ink-muted hover:text-ink border border-edge text-xs font-medium transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Verified Context Inspection Drawer (Collapsible) */}
      {showContextDrawer && verifiedContext && (
        <div className="bg-canvas-white border border-edge rounded-2xl p-4 text-xs shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-edge">
            <div className="flex items-center gap-2 text-forest font-semibold">
              <ShieldCheck className="w-4 h-4 text-forest" />
              <span>Authoritative Read-Only FINOVA Context Shared with Mentor</span>
            </div>
            <span className="text-[11px] text-ink-muted">
              AI cannot alter these authoritative backend balances
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-2.5 rounded-xl bg-canvas-subtle border border-edge">
              <span className="text-ink-muted block mb-0.5">Liquid Cash</span>
              <span className="font-semibold text-ink text-sm font-mono">{verifiedContext.liquidCashFormatted}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-canvas-subtle border border-edge">
              <span className="text-ink-muted block mb-0.5">Total Wealth</span>
              <span className="font-semibold text-ink text-sm font-mono">{verifiedContext.totalWealthFormatted}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-canvas-subtle border border-edge">
              <span className="text-ink-muted block mb-0.5">Investments</span>
              <span className="font-semibold text-forest text-sm font-mono">{verifiedContext.investmentsMarketValueFormatted}</span>
              <span className="text-[10px] text-ink-muted block font-mono">P&L: {verifiedContext.unrealizedPnlFormatted}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-canvas-subtle border border-edge">
              <span className="text-ink-muted block mb-0.5">Literacy Score</span>
              <span className="font-semibold text-forest text-sm font-mono">{verifiedContext.literacyScore.totalScore} / 100</span>
              <span className="text-[10px] text-ink-muted block">Tier: {verifiedContext.literacyScore.tier}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Messages Container */}
      <div className="bg-canvas-subtle border border-edge rounded-2xl p-4 sm:p-6 min-h-[460px] max-h-[620px] overflow-y-auto flex flex-col space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse self-end max-w-[85%] sm:max-w-[75%]' : 'self-start max-w-[95%] sm:max-w-[85%]'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-canvas-white shadow-sm ${
                  isUser
                    ? 'bg-copper'
                    : 'bg-forest'
                }`}
              >
                {isUser ? <Wallet className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  isUser
                    ? 'bg-copper text-canvas-white rounded-tr-none'
                    : 'bg-canvas-white border border-edge text-ink rounded-tl-none'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-edge text-[11px] text-ink-muted">
                    <span className="font-semibold text-forest flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-forest" />
                      FINOVA Mentor
                    </span>
                    <div className="flex items-center gap-2">
                      {msg.model && (
                        <span className="px-1.5 py-0.5 rounded bg-canvas-subtle text-ink-muted font-mono text-[10px]">
                          {msg.model}
                        </span>
                      )}
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>
                )}

                <div>
                  {isUser ? <p className="whitespace-pre-wrap">{msg.content}</p> : renderMarkdown(msg.content)}
                </div>

                {!isUser && msg.disclaimer && (
                  <div className="mt-3 pt-2 border-t border-edge text-[10px] text-ink-muted flex items-center gap-1.5 italic">
                    <HelpCircle className="w-3 h-3 shrink-0 text-forest" />
                    <span>{msg.disclaimer}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 self-start max-w-[85%] animate-fadeIn">
            <div className="w-8 h-8 rounded-xl bg-forest flex items-center justify-center shrink-0 text-canvas-white shadow-sm">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="rounded-2xl rounded-tl-none p-3.5 bg-canvas-white border border-edge shadow-sm flex items-center gap-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-forest animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-olive animate-pulse [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-copper animate-pulse [animation-delay:0.4s]" />
              </div>
              <span className="text-xs text-ink-muted font-medium">
                FINOVA Mentor is analyzing your verified account context...
              </span>
            </div>
          </div>
        )}

        {/* Error notification banner */}
        {error && (
          <div className="p-3 rounded-xl bg-neg/10 border border-neg/30 text-neg text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-neg" />
              <span>{error}</span>
            </div>
            <div className="flex items-center gap-2">
              {lastSentText && (
                <button
                  onClick={() => handleSendMessage(lastSentText)}
                  className="px-2 py-0.5 rounded bg-neg/20 hover:bg-neg/30 text-neg border border-neg/40 text-[11px] font-semibold transition"
                >
                  Retry Request
                </button>
              )}
              <button
                onClick={() => setError(null)}
                className="text-neg hover:underline text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Quick Chips */}
      <div className="bg-canvas-white border border-edge rounded-2xl p-3.5 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-ink-muted">
          <Sparkles className="w-3.5 h-3.5 text-copper" />
          <span>Contextual Questions for You:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {contextualQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-canvas-subtle hover:bg-forest hover:text-canvas-white border border-edge text-ink text-xs font-medium transition text-left disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95 group"
            >
              <span>{q}</span>
              <ArrowRight className="w-3 h-3 text-ink-muted group-hover:text-canvas-white opacity-70" />
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="bg-canvas-white border border-edge rounded-2xl p-2.5 sm:p-3 shadow-sm flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask anything about saving, investing, your portfolio, or scenario trade-offs..."
            maxLength={1000}
            className="w-full bg-canvas-subtle border border-edge rounded-xl px-4 py-3 text-xs sm:text-sm text-ink placeholder-ink-muted focus:outline-none focus:border-forest disabled:opacity-50"
          />
          {inputMessage.length > 700 && (
            <span className="absolute right-3 top-3.5 text-[10px] text-ink-muted">
              {inputMessage.length}/1000
            </span>
          )}
        </div>

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputMessage.trim() || isLoading}
          className="px-4 sm:px-5 py-3 rounded-xl bg-forest hover:bg-forest-light text-canvas-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>

      {/* Bottom Disclaimer */}
      <div className="text-center text-[11px] text-ink-muted flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-forest shrink-0" />
        <span>
          FINOVA Educational Sandbox — All balances and simulation results are fictional. The AI Mentor does not provide real investment advice.
        </span>
      </div>
    </div>
  );
}
