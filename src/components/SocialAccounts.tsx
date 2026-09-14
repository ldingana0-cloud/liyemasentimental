import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Trash2, Loader2, ExternalLink, Globe,
  Twitter, Facebook, Instagram, Linkedin, Youtube, MessageCircle,
} from 'lucide-react';

export interface SocialAccount {
  id: string;
  platform: string;
  handle: string;
  url: string;
  created_at: string;
}

const PLATFORMS = [
  { id: 'twitter', label: 'Twitter / X', icon: Twitter, color: 'text-sky-500', bg: 'bg-sky-50', ring: 'ring-sky-200' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500', bg: 'bg-pink-50', ring: 'ring-pink-200' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50', ring: 'ring-blue-200' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'text-red-500', bg: 'bg-red-50', ring: 'ring-red-200' },
  { id: 'reddit', label: 'Reddit', icon: MessageCircle, color: 'text-orange-500', bg: 'bg-orange-50', ring: 'ring-orange-200' },
  { id: 'other', label: 'Other', icon: Globe, color: 'text-slate-500', bg: 'bg-slate-50', ring: 'ring-slate-200' },
];

function getPlatformMeta(platform: string) {
  return PLATFORMS.find((p) => p.id === platform) ?? PLATFORMS[PLATFORMS.length - 1];
}

interface SocialAccountsProps {
  userId: string;
}

export default function SocialAccounts({ userId }: SocialAccountsProps) {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [platform, setPlatform] = useState('twitter');
  const [handle, setHandle] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!loadError && data) {
      setAccounts(data as SocialAccount[]);
    }
    setLoading(false);
  }

  async function handleAdd() {
    if (!url.trim()) {
      setError('Please enter a URL.');
      return;
    }
    setError('');
    setSaving(true);

    const { data, error: insertError } = await supabase
      .from('social_accounts')
      .insert({
        platform,
        handle: handle.trim(),
        url: url.trim(),
      })
      .select('*')
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    if (data) {
      setAccounts((prev) => [...prev, data as SocialAccount]);
    }
    setPlatform('twitter');
    setHandle('');
    setUrl('');
    setShowForm(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const { error: deleteError } = await supabase
      .from('social_accounts')
      .delete()
      .eq('id', id);

    if (!deleteError) {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    }
  }

  function handleCancel() {
    setShowForm(false);
    setPlatform('twitter');
    setHandle('');
    setUrl('');
    setError('');
  }

  return (
    <section className="rounded-2xl bg-white/80 p-5 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60 backdrop-blur sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Social Media Accounts 🔗</h3>
          <p className="mt-0.5 text-sm text-slate-500">Add your social media links to retrieve and analyze comments.</p>
        </div>
        {!showForm && !loading && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/60">
          <div className="space-y-3">
            {/* Platform selector */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Platform</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const selected = platform === p.id;
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        selected
                          ? `${p.bg} ${p.color} ring-2 ${p.ring}`
                          : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Handle */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Handle (optional)</label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@yourbrand"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
            </div>

            {/* URL */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Profile URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://twitter.com/yourbrand"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-teal-500/20 transition hover:from-teal-600 hover:to-emerald-600 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Account
              </button>
              <button
                onClick={handleCancel}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accounts list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
        </div>
      ) : accounts.length === 0 && !showForm ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
          <Globe className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-400">No social media accounts added yet.</p>
          <p className="text-xs text-slate-400">Click "Add" to link your first account.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => {
            const meta = getPlatformMeta(account.platform);
            const Icon = meta.icon;
            return (
              <div
                key={account.id}
                className={`flex items-center gap-3 rounded-xl ${meta.bg} p-3 ring-1 ${meta.ring}`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm`}>
                  <Icon className={`h-5 w-5 ${meta.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{meta.label}</p>
                  {account.handle && (
                    <p className="text-xs text-slate-500">{account.handle}</p>
                  )}
                </div>
                <a
                  href={account.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-white/70 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-white hover:text-teal-600"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Visit
                </a>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-100 hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
