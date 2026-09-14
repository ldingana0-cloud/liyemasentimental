import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { analyzeVader } from '@/lib/vader';
import { Send, MessageCircle, Trash2, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Simple rule-based assistant that answers questions about the sentiment analyzer
function generateAssistantReply(userText: string): string {
  const lower = userText.toLowerCase().trim();

  // Greetings
  if (/\b(hi|hello|hey|greetings|howdy)\b/.test(lower)) {
    return "Hello! 👋 Welcome to the Sentiment Analyzer support chat. I can help you with:\n\n• How to analyze a single review\n• How to upload and analyze CSV files\n• Understanding VADER sentiment scores\n• Interpreting your results\n\nWhat can I help you with today?";
  }

  // How to use / single review
  if (lower.includes('single') || lower.includes('how do i') || lower.includes('how to') || lower.includes('use') || lower.includes('start')) {
    if (lower.includes('csv') || lower.includes('upload') || lower.includes('file') || lower.includes('batch')) {
      return "To analyze a CSV file 📄:\n\n1. Go to the 'CSV Analysis' tab\n2. Click the upload area and select your .csv file\n3. Make sure your file has a column with review text (like 'review', 'text', or 'comment')\n4. We'll auto-detect the right column, but you can change it from the dropdown\n5. Click 'Download Results' to export the analyzed data as a new CSV\n\nThe VADER algorithm will score every row and give you a summary breakdown! 📊";
    }
    return "To analyze a single review 🔍:\n\n1. Go to the 'Single Review' tab\n2. Type or paste a customer review in the text box\n3. Click 'Analyse Sentiment'\n4. You'll see the sentiment (positive 😊, neutral 😐, or negative 😞), a VADER compound score, and an explanation of why\n\nYou can also try the sample reviews to see how it works!";
  }

  // VADER explanation
  if (lower.includes('vader') || lower.includes('algorithm') || lower.includes('how does it work') || lower.includes('scor')) {
    return "VADER (Valence Aware Dictionary and sEntiment Reasoner) 🤖 is a sentiment analysis tool that:\n\n• Uses a lexicon of words rated for sentiment (e.g. 'good' = +1.9, 'terrible' = -3.0)\n• Handles negations ('not good' flips to negative)\n• Recognizes intensifiers ('very good' is stronger than 'good')\n• Accounts for capitalization ('GREAT' is stronger than 'great')\n• Considers punctuation ('!!!' adds emphasis)\n\nThe **compound score** ranges from -1 (most negative) to +1 (most positive). Scores ≥ 0.05 are positive, ≤ -0.05 are negative, and in between is neutral.";
  }

  // Interpret results
  if (lower.includes('interpret') || lower.includes('understand') || lower.includes('result') || lower.includes('meaning') || lower.includes('compound')) {
    return "Here's how to read your results 📖:\n\n• **Compound score** (-1 to +1): Overall sentiment. >0.05 = positive 😊, < -0.05 = negative 😞, in between = neutral 😐\n• **Positive/Negative/Neutral %**: The proportion of sentiment in the text\n• **Detected words**: Individual words that contributed to the score, with their individual weights\n• **Meter**: Visual indicator of where the text falls on the negative-to-positive spectrum\n\nA high positive % with a high compound score means strongly positive sentiment!";
  }

  // Positive sentiment
  if (lower.includes('positive') && !lower.includes('negative')) {
    return "Positive sentiment 😊 means the review expresses satisfaction, happiness, or approval. VADER assigns a compound score ≥ 0.05 for positive text. Words like 'great', 'amazing', 'love', and 'excellent' contribute strongly to positive scores. The higher the compound score (closer to +1), the more positive the sentiment!";
  }

  // Negative sentiment
  if (lower.includes('negative') && !lower.includes('positive')) {
    return "Negative sentiment 😞 means the review expresses dissatisfaction, frustration, or disapproval. VADER assigns a compound score ≤ -0.05 for negative text. Words like 'terrible', 'worst', 'broken', and 'waste' contribute strongly to negative scores. The lower the compound score (closer to -1), the more negative the sentiment.";
  }

  // Neutral sentiment
  if (lower.includes('neutral')) {
    return "Neutral sentiment 😐 means the review doesn't express strong positive or negative emotion. VADER assigns a compound score between -0.05 and +0.05 for neutral text. This often happens with factual or descriptive reviews that don't use emotional language.";
  }

  // CSV / upload
  if (lower.includes('csv') || lower.includes('upload') || lower.includes('file') || lower.includes('batch')) {
    return "To analyze a CSV file 📄:\n\n1. Go to the 'CSV Analysis' tab\n2. Click the upload area and select your .csv file\n3. Make sure your file has a column with review text (like 'review', 'text', or 'comment')\n4. We'll auto-detect the right column, but you can change it from the dropdown\n5. Click 'Download Results' to export the analyzed data as a new CSV\n\nThe VADER algorithm will score every row and give you a summary breakdown! 📊";
  }

  // Thanks
  if (lower.includes('thank') || lower.includes('thanks') || lower.includes('appreciate')) {
    return "You're welcome! 😊 If you have any more questions about sentiment analysis or using the tool, feel free to ask. I'm here to help!";
  }

  // Analyze the user's message sentiment as a bonus
  const vaderResult = analyzeVader(userText);
  const emoji = vaderResult.polarity === 'positive' ? '😊' : vaderResult.polarity === 'negative' ? '😞' : '😐';

  return `I'm a support assistant for the Sentiment Analyzer tool. I can help you with using the tool, understanding VADER scores, interpreting results, and uploading CSV files.\n\nBy the way, I analyzed your message and it reads as ${vaderResult.polarity} ${emoji} (compound score: ${vaderResult.compound.toFixed(3)}).\n\nTry asking me things like:\n• "How do I analyze a review?"\n• "What is VADER?"\n• "How do I upload a CSV?"\n• "How do I interpret the results?"`;
}

export default function ChatAssistant() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    setLoading(true);
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as Message[]);
    }

    // If no messages, seed a welcome message
    if (!error && (!data || data.length === 0)) {
      const userName = profile?.full_name || user?.email?.split('@')[0] || 'there';
      const welcome = {
        role: 'assistant' as const,
        content: `Hello ${userName}! 👋 Welcome to the Sentiment Analyzer support chat. I can help you with:\n\n• How to analyze a single review\n• How to upload and analyze CSV files\n• Understanding VADER sentiment scores\n• Interpreting your results\n\nWhat can I help you with today?`,
      };
      const { data: inserted } = await supabase
        .from('chat_messages')
        .insert(welcome)
        .select('*')
        .single();
      if (inserted) {
        setMessages([inserted as Message]);
      }
    }
    setLoading(false);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput('');

    // Insert user message
    const { data: userMsg } = await supabase
      .from('chat_messages')
      .insert({ role: 'user', content: text })
      .select('*')
      .single();

    if (userMsg) {
      setMessages((prev) => [...prev, userMsg as Message]);
    }

    // Generate and insert assistant reply
    const reply = generateAssistantReply(text);
    // Small delay for natural feel
    setTimeout(async () => {
      const { data: assistantMsg } = await supabase
        .from('chat_messages')
        .insert({ role: 'assistant', content: reply })
        .select('*')
        .single();

      if (assistantMsg) {
        setMessages((prev) => [...prev, assistantMsg as Message]);
      }
      setSending(false);
    }, 500);
  }

  async function handleClearChat() {
    await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const userName = profile?.full_name || user?.email?.split('@')[0] || 'there';
    const welcome = {
      role: 'assistant' as const,
      content: `Hello ${userName}! 👋 Welcome back to the Sentiment Analyzer support chat. How can I help you today?`,
    };
    const { data: inserted } = await supabase
      .from('chat_messages')
      .insert(welcome)
      .select('*')
      .single();
    setMessages(inserted ? [inserted as Message] : []);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-[600px] flex-col rounded-2xl bg-white/80 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60 backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Support Assistant 🤖</h2>
            <p className="text-xs text-slate-400">Ask about sentiment analysis</p>
          </div>
        </div>
        <button
          onClick={handleClearChat}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-400 transition hover:text-rose-500"
          title="Clear chat"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {msg.content.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-1' : ''}>
                    {line || '\u00A0'}
                  </p>
                ))}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-slate-100 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-slate-200/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message…"
            disabled={sending}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-200 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20 transition hover:from-teal-600 hover:to-emerald-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
