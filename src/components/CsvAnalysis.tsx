import { useRef, useState } from 'react';
import { analyzeVader, type VaderResult } from '@/lib/vader';
import { parseCsv, findReviewColumn } from '@/lib/csv';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface CsvRowResult {
  index: number;
  text: string;
  result: VaderResult;
}

interface CsvSummary {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  avgCompound: number;
  rows: CsvRowResult[];
}

export default function CsvAnalysis() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [summary, setSummary] = useState<CsvSummary | null>(null);
  const [error, setError] = useState('');
  const [columnIndex, setColumnIndex] = useState(0);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSummary(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) || '';
      const parsed = parseCsv(text);
      if (parsed.headers.length === 0) {
        setError('The CSV file appears to be empty or invalid.');
        return;
      }
      setAvailableColumns(parsed.headers);
      const detected = findReviewColumn(parsed.headers);
      setColumnIndex(detected);
      analyzeRows(parsed.rows, detected);
    };
    reader.onerror = () => setError('Failed to read the file. Please try again.');
    reader.readAsText(file);
  }

  function analyzeRows(rows: string[][], colIdx: number) {
    setAnalyzing(true);
    setError('');

    setTimeout(() => {
      const results: CsvRowResult[] = [];
      let positive = 0;
      let neutral = 0;
      let negative = 0;
      let compoundSum = 0;

      for (let i = 0; i < rows.length; i++) {
        const text = rows[i]?.[colIdx]?.trim() || '';
        if (!text) continue;
        const result = analyzeVader(text);
        results.push({ index: i + 1, text, result });

        if (result.polarity === 'positive') positive++;
        else if (result.polarity === 'negative') negative++;
        else neutral++;

        compoundSum += result.compound;
      }

      if (results.length === 0) {
        setError('No text content found in the selected column. Try choosing a different column.');
        setAnalyzing(false);
        return;
      }

      setSummary({
        total: results.length,
        positive,
        neutral,
        negative,
        avgCompound: compoundSum / results.length,
        rows: results,
      });
      setAnalyzing(false);
    }, 400);
  }

  function handleColumnChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const idx = parseInt(e.target.value, 10);
    setColumnIndex(idx);
    // Re-parse from file
    if (fileInputRef.current?.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = (ev.target?.result as string) || '';
        const parsed = parseCsv(text);
        analyzeRows(parsed.rows, idx);
      };
      reader.readAsText(fileInputRef.current.files[0]);
    }
  }

  function downloadCsv() {
    if (!summary) return;
    const headers = ['Row', 'Text', 'Polarity', 'Compound', 'Positive', 'Negative', 'Neutral'];
    const lines = [headers.join(',')];
    for (const row of summary.rows) {
      const escaped = row.text.replace(/"/g, '""').replace(/\n/g, ' ');
      lines.push([
        row.index,
        `"${escaped}"`,
        row.result.polarity,
        row.result.compound,
        row.result.positive,
        row.result.negative,
        row.result.neutral,
      ].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentiment_results_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const posPct = summary ? (summary.positive / summary.total) * 100 : 0;
  const neuPct = summary ? (summary.neutral / summary.total) * 100 : 0;
  const negPct = summary ? (summary.negative / summary.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Upload card */}
      <section className="rounded-2xl bg-white/80 p-5 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60 backdrop-blur sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-teal-500" />
          <h2 className="text-lg font-semibold text-slate-800">CSV Batch Analysis (VADER)</h2>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Upload a CSV file containing customer reviews. We'll analyze every row using the VADER algorithm and give you a summary breakdown.
        </p>

        {/* Drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 px-4 py-8 text-center transition hover:border-teal-400 hover:bg-teal-50/30"
        >
          <Upload className="mx-auto mb-2 h-8 w-8 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">
            {fileName || 'Click to select a CSV file'}
          </p>
          <p className="mt-1 text-xs text-slate-400">Supports .csv files with text columns</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Column selector */}
        {availableColumns.length > 0 && (
          <div className="mt-4">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Review text column
            </label>
            <select
              value={columnIndex}
              onChange={handleColumnChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-700 transition focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-200"
            >
              {availableColumns.map((col, i) => (
                <option key={i} value={i}>
                  {col || `Column ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Loading */}
        {analyzing && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-700 ring-1 ring-teal-200">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing {fileName}…
          </div>
        )}
      </section>

      {/* Summary */}
      {summary && !analyzing && (
        <>
          <section className="rounded-2xl bg-white/80 p-5 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60 backdrop-blur sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Summary 📊</h3>
              <button
                onClick={downloadCsv}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-700"
              >
                <Download className="h-3.5 w-3.5" />
                Download Results
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
              <CheckCircle2 className="h-4 w-4 text-teal-500" />
              <span className="text-slate-600">
                Analyzed <strong>{summary.total}</strong> reviews. Average compound score: <strong>{summary.avgCompound > 0 ? '+' : ''}{summary.avgCompound.toFixed(3)}</strong>
              </span>
            </div>
          </section>

          {/* Individual results */}
          <section className="rounded-2xl bg-white/80 p-5 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60 backdrop-blur sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Individual Results 📝</h3>
            <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
              {summary.rows.map((row) => {
                const emoji = row.result.polarity === 'positive' ? '😊' : row.result.polarity === 'negative' ? '😞' : '😐';
                const colorClass =
                  row.result.polarity === 'positive'
                    ? 'border-l-emerald-400 bg-emerald-50/50'
                    : row.result.polarity === 'negative'
                      ? 'border-l-rose-400 bg-rose-50/50'
                      : 'border-l-amber-400 bg-amber-50/50';
                return (
                  <div key={row.index} className={`rounded-lg border-l-4 ${colorClass} p-3`}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">#{row.index}</span>
                      <span className="text-sm font-semibold text-slate-700">
                        {emoji} {row.result.polarity.charAt(0).toUpperCase() + row.result.polarity.slice(1)}
                        <span className="ml-2 text-xs text-slate-400">
                          ({row.result.compound > 0 ? '+' : ''}{row.result.compound.toFixed(3)})
                        </span>
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600 line-clamp-2">{row.text}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {!summary && !analyzing && !error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
          <FileSpreadsheet className="mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-400">Upload a CSV file to analyze multiple reviews at once</p>
          <p className="mt-1 text-xs text-slate-400">Expected format: a column containing review text (e.g. "review", "text", "comment")</p>
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
