import { useMemo, useState } from 'react';
import { analyzeVader, type VaderResult } from '@/lib/vader';
import { Sparkles, RotateCcw, ChartBar, FileText } from 'lucide-react';

type Polarity = VaderResult['polarity'];

const POLARITY_CONFIG: Record<
  Polarity,
  { label: string; emoji: string; accent: string; ring: string; text: string; bg: string; glow: string; barColor: string }
> = {
  positive: {
    label: 'Positive',
    emoji: '😊',
    accent: 'from-emerald-400 to-teal-500',
    ring: 'ring-emerald-300/60',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    glow: 'shadow-emerald-500/20',
    barColor: 'bg-emerald-500',
  },
  neutral: {
    label: 'Neutral',
    emoji: '😐',
    accent: 'from-amber-300 to-orange-400',
    ring: 'ring-amber-300/60',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
    glow: 'shadow-amber-500/20',
    barColor: 'bg-amber-500',
  },
  negative: {
    label: 'Negative',
    emoji: '😞',
    accent: 'from-rose-400 to-red-500',
    ring: 'ring-rose-300/60',
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    glow: 'shadow-rose-500/20',
    barColor: 'bg-rose-500',
  },
};

const SAMPLE_REVIEWS = [
  'The product quality is absolutely amazing and the delivery was incredibly fast. I love it!',
  'It arrived on time. The packaging was standard and the item works as described.',
  'Terrible experience. The item broke after two days and customer service was rude. Total waste of money.',
];

export default function SingleReview() {
  const [review, setReview] = useState('');
  const [result, setResult] = useState<VaderResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const wordCount = useMemo(
    () => review.trim().split(/\s+/).filter(Boolean).length,
    [review],
  );

  function handleAnalyze() {
    if (!review.trim()) return;
    setAnalyzing(true);
    setTimeout(() => {
      setResult(analyzeVader(review));
      setAnalyzing(false);
    }, 350);
  }

  function handleClear() {
    setReview('');
    setResult(null);
  }

  function loadSample(text: string) {
    setReview(text);
    setResult(null);
  }

  const config = result ? POLARITY_CONFIG[result.polarity] : null;

  return (
    <div className="space-y-6">
      {/* Input card */}
      <section className="rounded-2xl bg-white/80 p-5 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60 backdrop-blur sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-teal-500" />
          <h2 className="text-lg font-semibold text-slate-800">Single Review Analysis</h2>
        </div>
        <label htmlFor="review" className="mb-2 block text-sm font-semibold text-slate-700">
          Customer Review
        </label>
        <textarea
          id="review"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Type or paste a review here…"
          rows={5}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-base leading-relaxed text-slate-800 placeholder:text-slate-400 transition focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-200"
        />

        <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          {review && (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-slate-400 transition hover:text-slate-600"
            >
              <RotateCcw className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>

        {/* Sample chips */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-slate-400">Try a sample:</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_REVIEWS.map((sample, i) => (
              <button
                key={i}
                onClick={() => loadSample(sample)}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200 hover:text-slate-800"
              >
                {['😊 Positive', '😐 Neutral', '😞 Negative'][i]}
              </button>
            ))}
          </div>
        </div>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={!review.trim() || analyzing}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-500/30 transition hover:from-teal-600 hover:to-emerald-600 hover:shadow-teal-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {analyzing ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Analysing…
            </>
          ) : (
            <>
              <ChartBar className="h-5 w-5" />
              Analyse Sentiment
            </>
          )}
        </button>
      </section>

      {/* Result */}
      {result && config && (
        <section
          className={`animate-[fadeIn_0.4s_ease] rounded-2xl ${config.bg} p-5 shadow-xl ${config.glow} ring-1 ${config.ring} sm:p-6`}
        >
          <div className="flex items-center gap-4">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${config.accent} shadow-lg`}>
              <span className="text-3xl">{config.emoji}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Sentiment
              </p>
              <p className={`text-2xl font-bold ${config.text}`}>
                {config.emoji} {config.label}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-slate-400">Compound</p>
              <p className={`text-xl font-bold ${config.text}`}>
                {result.compound > 0 ? '+' : ''}{result.compound.toFixed(3)}
              </p>
            </div>
          </div>

          {/* VADER score bars */}
          <div className="mt-5 space-y-3">
            <ScoreBar label="Positive 😊" value={result.positive} color="bg-emerald-500" />
            <ScoreBar label="Neutral 😐" value={result.neutral} color="bg-amber-500" />
            <ScoreBar label="Negative 😞" value={result.negative} color="bg-rose-500" />
          </div>

          {/* Explanation */}
          <div className="mt-4 rounded-xl bg-white/70 p-4 ring-1 ring-slate-200/50">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Why this classification? 🔍
            </p>
            <p className="text-sm leading-relaxed text-slate-600">{result.explanation}</p>
          </div>

          {/* Matched words */}
          {result.matched.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Detected sentiment words 🏷️
              </p>
              <div className="flex flex-wrap gap-2">
                {result.matched.map((m, i) => {
                  const positive = m.score > 0;
                  return (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                        positive
                          ? 'bg-emerald-100 text-emerald-700'
                          : m.score < 0
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {positive ? '😊' : m.score < 0 ? '😞' : '😐'} {m.word}
                      <span className="text-[10px] opacity-60">
                        {m.score > 0 ? '+' : ''}{m.score}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Compound meter */}
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
              <span>😞 Negative</span>
              <span>😐 Neutral</span>
              <span>Positive 😊</span>
            </div>
            <div className="relative h-2.5 overflow-hidden rounded-full bg-gradient-to-r from-rose-300 via-amber-200 to-emerald-300">
              <div
                className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-800 shadow-md transition-all duration-500"
                style={{
                  left: `${Math.max(2, Math.min(98, 50 + result.compound * 50))}%`,
                }}
              />
            </div>
          </div>
        </section>
      )}

      {!result && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
          <Sparkles className="mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-400">Enter a review and click "Analyse Sentiment" to see results</p>
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="text-slate-400">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.max(2, value * 100)}%` }}
        />
      </div>
    </div>
  );
}
