import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiRobot2Line, RiCloseLine, RiSendPlaneFill,
  RiUser3Line, RiSparklingLine, RiDeleteBin6Line,
} from 'react-icons/ri';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are ARS SmartTrack AI, a friendly and intelligent productivity assistant built into the ARS SmartTrack task management app. You help users:
- Manage their tasks and to-do lists more efficiently
- Plan their day and set priorities
- Give productivity tips and time management advice
- Answer questions about using the ARS SmartTrack app
- Provide motivational support and encouragement
- Help break down complex projects into actionable steps

Keep responses concise, helpful, and encouraging. Use emojis sparingly for a friendly tone.`;

function TypingIndicator() {
  return (
    <div className="chatbot-typing">
      <span /><span /><span />
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`chatbot-message ${isUser ? 'chatbot-message-user' : 'chatbot-message-ai'}`}
    >
      {!isUser && (
        <div className="chatbot-avatar-ai">
          <RiRobot2Line />
        </div>
      )}
      <div className={`chatbot-bubble ${isUser ? 'chatbot-bubble-user' : 'chatbot-bubble-ai'}`}>
        <p style={{ margin: 0, lineHeight: '1.55', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {msg.content}
        </p>
        <span className="chatbot-time">
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      {isUser && (
        <div className="chatbot-avatar-user">
          <RiUser3Line />
        </div>
      )}
    </motion.div>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey there! 👋 I'm ARS SmartTrack AI, your personal productivity assistant. How can I help you stay on top of your tasks today?",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const history = messages
        .filter(m => m.role !== 'system')
        .map(({ role, content }) => ({ role, content }));

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history,
            { role: 'user', content: text },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content ?? 'Sorry, I had trouble responding. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: Date.now() }]);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared! 🧹 Ready to help you with your tasks. What's on your mind?",
      ts: Date.now(),
    }]);
    setError(null);
  };

  return (
    <>
      {/* Floating trigger button — positioned at bottom-right, above mobile FAB zone */}
      <motion.button
        id="chatbot-trigger"
        className="chatbot-trigger"
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        title="Open ARS SmartTrack AI Assistant"
        aria-label="Toggle AI chatbot"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
              <RiCloseLine style={{ fontSize: '1.5rem' }} />
            </motion.span>
          ) : (
            <motion.span key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
              <RiRobot2Line style={{ fontSize: '1.5rem' }} />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && <span className="chatbot-ping" />}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="chatbot-window"
            className="chatbot-window"
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          >
            {/* Header */}
            <div className="chatbot-header">
              <div className="chatbot-header-info">
                <div className="chatbot-header-icon">
                  <RiSparklingLine />
                </div>
                <div>
                  <p className="chatbot-header-title">ARS SmartTrack AI</p>
                  <p className="chatbot-header-sub">Powered by Groq · Llama 3.3 70B</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button onClick={clearChat} className="chatbot-icon-btn" title="Clear chat" aria-label="Clear chat history">
                  <RiDeleteBin6Line />
                </button>
                <button onClick={() => setOpen(false)} className="chatbot-icon-btn" title="Close" aria-label="Close chatbot">
                  <RiCloseLine />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="chatbot-messages" role="log" aria-label="Chat messages">
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="chatbot-message chatbot-message-ai"
                >
                  <div className="chatbot-avatar-ai"><RiRobot2Line /></div>
                  <div className="chatbot-bubble chatbot-bubble-ai"><TypingIndicator /></div>
                </motion.div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="chatbot-error">
                  ⚠️ {error}
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="chatbot-input-area">
              <textarea
                ref={inputRef}
                id="chatbot-input"
                className="chatbot-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your tasks…"
                rows={1}
                disabled={loading}
                aria-label="Type your message"
              />
              <motion.button
                id="chatbot-send"
                className="chatbot-send"
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.93 }}
                aria-label="Send message"
              >
                <RiSendPlaneFill style={{ fontSize: '1.1rem' }} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
