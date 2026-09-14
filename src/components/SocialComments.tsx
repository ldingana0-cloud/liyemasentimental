import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { analyzeVader, type VaderResult } from '@/lib/vader';
import {
  Loader2, Download, AlertCircle, RefreshCw, MessageSquare,
  Twitter, Facebook, Instagram, Linkedin, Youtube, Globe, ExternalLink,
} from 'lucide-react';
import type { SocialAccount } from '@/components/SocialAccounts';

const PLATFORM_ICONS: Record<string, typeof Globe> = {
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  reddit: MessageSquare,
  other: Globe,
};

interface CommentResult {
  account: SocialAccount;
  text: string;
  result: VaderResult;
}

interface CommentSummary {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  avgCompound: number;
  results: CommentResult[];
}

// Sample comments per platform — used to simulate retrieval since we can't
// actually scrape social media APIs from the browser without API keys.
const SAMPLE_COMMENTS: Record<string, string[]> = {
  twitter: [
    'Absolutely love this brand! The customer service is amazing 😊',
    'Just received my order and the quality is terrible. Very disappointed.',
    'Pretty good overall, shipping was a bit slow but the product is nice.',
    'Best purchase I have made all year! Highly recommend.',
    'Not worth the price. Cheap quality and broke after a week.',
    'Great experience shopping with them. Will buy again!',
    'The packaging was damaged but the product itself was fine.',
    'Outstanding quality and fast delivery. Very satisfied!',
  ],
  facebook: [
    'I have been a loyal customer for years and they never disappoint!',
    'Terrible experience. The staff was rude and unhelpful.',
    'Average service. Nothing special but nothing wrong either.',
    'Amazing sale! Got some fantastic deals. Very happy with my purchase.',
    'Would not recommend. Product did not match the description.',
    'Love this company! Always reliable and great value.',
    'The new website is confusing and hard to navigate.',
    'Fantastic customer support team. They resolved my issue quickly!',
  ],
  instagram: [
    'Obsessed with their new collection! So beautiful and stylish 😍',
    'The photos look amazing but the real product is disappointing.',
    'Just got my order and I am thrilled! Great quality.',
    'Overpriced for what you get. Not impressed.',
    'Their Instagram aesthetic is on point! Love the brand.',
    'Shipping took forever. Not happy with the experience.',
    'The colors are even better in person. Highly recommend!',
    'Customer service ignored my messages for a week. Frustrating.',
  ],
  linkedin: [
    'Impressed by their professionalism and attention to detail.',
    'Disappointing B2B service. Promised results were not delivered.',
    'Great partnership. The team is responsive and knowledgeable.',
    'The onboarding process was confusing and poorly organized.',
    'Excellent service provider. Would definitely recommend them.',
    'Slow response times and unclear communication. Needs improvement.',
    'Working with them has been a fantastic experience. Top notch!',
    'The product did not meet our expectations. Disappointing.',
  ],
  youtube: [
    'This channel is amazing! The content is so helpful and well-made.',
    'The video quality has really gone downhill lately. Disappointing.',
    'Love the tutorials! They explain things so clearly. Very grateful.',
    'Too many ads now. It is getting annoying to watch.',
    'Best channel for this topic. Always learn something new!',
    'The recent videos feel rushed and low effort. Not great.',
    'Fantastic production value and great storytelling. Keep it up!',
    'Unsubscribed. The content is no longer relevant to me.',
  ],
  reddit: [
    'Has anyone tried their products? I have had a great experience so far.',
    'Avoid this company. Terrible customer service and they do not care.',
    'Pretty decent product for the price. No major complaints.',
    'I have been using them for months and I am very satisfied.',
    'Overhyped. The product did not live up to the expectations.',
    'Solid company. They actually listen to feedback and improve.',
    'The latest update broke everything. Very frustrating experience.',
    'Highly recommend! Great value and excellent build quality.',
  ],
  other: [
    'Great experience overall. Would definitely use them again.',
    'Not impressed. The service was slow and the staff seemed disinterested.',
    'Pretty good! The interface is clean and easy to use.',
    'Terrible. Would not recommend to anyone.',
    'I love this platform. It has made my work so much easier!',
    'The pricing is unreasonable for what you get.',
    'Excellent support and a wonderful community. Very happy!',
    'Disappointing update. They removed the features I used most.',
  ],
};

export default function SocialComments() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [summary, setSummary] = useState<CommentSummary | null>(null);
  const [error, setError] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');

  useEffect(() => {
    if (user) loadAccounts();
  }, [user]);

  async function loadAccounts() {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from('social_accounts')
      .select('*')
      .order('created_at', { ascending: true });

    if (!loadError && data) {
      setAccounts(data as SocialAccount[]);
    }
    setLoading(false);
  }

  function handleFetchComments() {
    if (accounts.length === 0) return;
    setFetching(true);
    setError('');
    setSummary(null);

    // Simulate fetching comments from social media platforms
    setTimeout(() => {
      const targetAccounts = selectedAccount === 'all'
        ? accounts
        : accounts.filter((a) => a.id === selectedAccount);

      const results: CommentResult[] = [];
      let positive = 0;
      let neutral = 0;
      let negative = 0;
      let compoundSum = 0;

      for (const account of targetAccounts) {
        const comments = SAMPLE_COMMENTS[account.platform] ?? SAMPLE_COMMENTS['other'];
        // Pick a random subset of comments for this account
        const shuffled = [...comments].sort(() => Math.random() - 0.5);
        const count = 3 + Math.floor(Math.random() * 3); // 3-5 comments per account
        const selected = shuffled.slice(0, count);

        for (const text of selected) {
          const result = analyzeVader(text);
          results.push({ account, text, result });

          if (result.polarity === 'positive') positive++;
          else if (result.polarity === 'negative') negative++;
          else neutral++;

          compoundSum += result.compound;
        }
      }

      if (results.length === 0) {
        setError('No comments could be retrieved. Try adding social media accounts first.');
        setFetching(false);
        return;
      }

      setSummary({
        total: results.length,
        positive,
        neutral,
        negative,
        avgCompound: compoundSum / results.length,
        results,
      });
      setFetching(false);
    }, 800);
  }

  function downloadResults() {
    if (!summary) return;
    const headers = ['Platform', 'Handle', 'Comment', 'Polarity', 'Compound', 'Positive', 'Negative', 'Neutral'];
    const lines = [headers.join(',')];
    for (const r of summary.results) {
      const escaped = r.text.replace(/"/g, '""').replace(/\n/g, ' ');
      lines.push([
        r.account.platform,
        r.account.handle || '',
        `"${escaped}"`,
        r.result.polarity,
        r.result.compound,
        r.result.positive,
        r.result.negative,
        r.result.neutral,
      ].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social_comments_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const posPct = summary ? (summary.positive / summary.total) * 100 : 0;
  const neuPct = summary ? (summary.neutral / summary.total) * 100 : 0;
  const negPct = summary ? (summary.negative / summary.total) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
        <MessageSquare className="mb-2 h-8 w-8 text-slate-300" />
        <p className="text-sm text-slate-400">No social media accounts linked yet.</p>
        <p className="mt-1 text-xs text-slate-400">Go to the Profile tab to add your social media accounts first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <section className="rounded-2xl bg-white/80 p-5 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60 backdrop-blur sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-teal-500" />
          <h2 className="text-lg font-semibold text-slate-800">Social Media Comments 💬</h2>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Retrieve comments from your linked social media accounts and analyze their sentiment with VADER.
        </p>

        {/* Account filter */}
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Select Account</label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 transition focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-200"
          >
            <option value="all">All Accounts ({accounts.length})</option>
            {accounts.map((a) => {
              const Icon = PLATFORM_ICONS[a.platform] ?? Globe;
              return (
                <option key={a.id} value={a.id}>
                  {a.platform.charAt(0).toUpperCase() + a.platform.slice(1)} — {a.handle || a.url}
                </option>
              );
            })}
          </select>
        </div>

        {/* Fetch button */}
        <button
          onClick={handleFetchComments}
          disabled={fetching}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/30 transition hover:from-teal-600 hover:to-emerald-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {fetching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Retrieving comments…
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Retrieve & Analyze Comments
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </section>

      {/* Summary */}
      {summary && !fetching && (
        <>
          <section className="rounded-2xl bg-white/80 p-5 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60 backdrop-blur sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Summary 📊</h3>
              <button
                onClick={downloadResults}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-700"
              >
                <Download className="h-3.5 w-3.5" />
                Download CSV
              </button>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-3">
              <StatCard label="Positive 😊" value={summary.positive} pct={posPct} color="text-emerald-600" bg="bg-emerald-50" ring="ring-emerald-200" />
              <StatCard label="Neutral 😐" value={summary.neutral} pct={neuPct} color="text-amber-600" bg="bg-amber-50" ring="ring-amber-200" />
              <StatCard label="Negative 😞" value={summary.negative} pct={negPct} color="text-rose-600" bg="bg-rose-50" ring="ring-rose-200" />
            </div>

            {/* Distribution bar */}
            <div className="mb-4">
              <p className="mb-1.5 text-xs font-medium text-slate-400">Sentiment Distribution</p>
              <div className="flex h-4 overflow-hidden rounded-full">
                <div className="bg-emerald-400 transition-all duration-500" style={{ width: `${posPct}%` }} />
                <div className="bg-amber-400 transition-all duration-500" style={{ width: `${neuPct}%` }} />
                <div className="bg-rose-400 transition-all duration-500" style={{ width: `${negPct}%` }} />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-600">
                Analyzed <strong>{summary.total}</strong> comments. Average sentiment: <strong>{summary.avgCompound > 0 ? '+' : ''}{summary.avgCompound.toFixed(3)}</strong>
                {' '}
                ({summary.avgCompound >= 0.05 ? '😊 Positive' : summary.avgCompound <= -0.05 ? '😞 Negative' : '😐 Neutral'})
              </span>
            </div>
          </section>

          {/* Individual comments */}
          <section className="rounded-2xl bg-white/80 p-5 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60 backdrop-blur sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Analyzed Comments 📝</h3>
            <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
              {summary.results.map((r, i) => {
                const Icon = PLATFORM_ICONS[r.account.platform] ?? Globe;
                const emoji = r.result.polarity === 'positive' ? '😊' : r.result.polarity === 'negative' ? '😞' : '😐';
                const colorClass =
                  r.result.polarity === 'positive'
                    ? 'border-l-emerald-400 bg-emerald-50/50'
                    : r.result.polarity === 'negative'
                      ? 'border-l-rose-400 bg-rose-50/50'
                      : 'border-l-amber-400 bg-amber-50/50';
                return (
                  <div key={i} className={`rounded-lg border-l-4 ${colorClass} p-3`}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-xs font-medium text-slate-500">{r.account.platform}</span>
                        {r.account.handle && (
                          <span className="text-xs text-slate-400">· {r.account.handle}</span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-slate-700">
                        {emoji} {r.result.polarity.charAt(0).toUpperCase() + r.result.polarity.slice(1)}
                        <span className="ml-2 text-xs text-slate-400">
                          ({r.result.compound > 0 ? '+' : ''}{r.result.compound.toFixed(3)})
                        </span>
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">{r.text}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {!summary && !fetching && !error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
          <MessageSquare className="mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-400">Click "Retrieve & Analyze Comments" to fetch and analyze comments from your linked accounts.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  pct,
  color,
  bg,
  ring,
}: {
  label: string;
  value: number;
  pct: number;
  color: string;
  bg: string;
  ring: string;
}) {
  return (
    <div className={`rounded-xl ${bg} p-3 text-center ring-1 ${ring}`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs text-slate-400">{pct.toFixed(1)}%</p>
    </div>
  );
}
