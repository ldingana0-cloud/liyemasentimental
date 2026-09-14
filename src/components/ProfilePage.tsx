import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { User as UserIcon, Mail, Building2, Calendar, Save, LogOut, Loader2, CheckCircle2, Edit3 } from 'lucide-react';
import SocialAccounts from '@/components/SocialAccounts';

export default function ProfilePage() {
  const { user, profile, signOut, refreshProfile, loading } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setBio(profile.bio);
      setCompany(profile.company);
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        bio: bio.trim(),
        company: company.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user!.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    await refreshProfile();
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleCancelEdit() {
    if (profile) {
      setFullName(profile.full_name);
      setBio(profile.bio);
      setCompany(profile.company);
    }
    setEditing(false);
    setError('');
  }

  const initials = (profile?.full_name || user.email || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const joinDate = profile ? new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : '';

  return (
    <div className="space-y-6">
      {/* Profile header card */}
      <section className="overflow-hidden rounded-2xl bg-white/80 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/60 backdrop-blur">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500" />

        {/* Avatar + name */}
        <div className="px-5 pb-5 sm:px-6">
          <div className="-mt-10 flex flex-col items-center sm:flex-row sm:items-end sm:gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-xl font-bold text-white shadow-lg ring-4 ring-white">
              {initials}
            </div>
            <div className="mt-3 text-center sm:mb-1 sm:text-left">
              <h2 className="text-xl font-bold text-slate-900">{profile?.full_name || 'New User'}</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
            <div className="mt-4 flex gap-2 sm:ml-auto sm:mt-0">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-teal-500/20 transition hover:from-teal-600 hover:to-emerald-600 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Saved toast */}
          {saved && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              Profile updated successfully!
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700 ring-1 ring-rose-200">
              {error}
            </div>
          )}

          {/* Info grid */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {/* Full name */}
            <InfoField
              icon={UserIcon}
              label="Full Name"
              value={fullName}
              editing={editing}
              onChange={setFullName}
              placeholder="Your name"
            />

            {/* Email (read-only) */}
            <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/60">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <Mail className="h-3.5 w-3.5" />
                Email
              </div>
              <p className="text-sm font-medium text-slate-700">{user.email}</p>
            </div>

            {/* Company */}
            <InfoField
              icon={Building2}
              label="Company"
              value={company}
              editing={editing}
              onChange={setCompany}
              placeholder="Your company"
            />

            {/* Join date (read-only) */}
            <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/60">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                Member Since
              </div>
              <p className="text-sm font-medium text-slate-700">{joinDate}</p>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Bio</label>
            {editing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself…"
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-200"
              />
            ) : (
              <p className="rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600 ring-1 ring-slate-200/60">
                {profile?.bio || 'No bio yet. Click "Edit Profile" to add one.'}
              </p>
            )}
          </div>

          {/* Sign out */}
          <div className="mt-6 border-t border-slate-200/60 pt-4">
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </section>

      {/* Social Media Accounts */}
      <SocialAccounts userId={user.id} />
    </div>
  );
}

function InfoField({
  icon: Icon,
  label,
  value,
  editing,
  onChange,
  placeholder,
}: {
  icon: typeof UserIcon;
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/60">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      {editing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200"
        />
      ) : (
        <p className="text-sm font-medium text-slate-700">{value || '—'}</p>
      )}
    </div>
  );
}
