import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { MessageSquare, FileSpreadsheet, FileText, Sparkles, UserCircle, LogIn, Share2 } from 'lucide-react';
import SingleReview from '@/components/SingleReview';
import CsvAnalysis from '@/components/CsvAnalysis';
import ChatAssistant from '@/components/ChatAssistant';
import ProfilePage from '@/components/ProfilePage';
import SocialComments from '@/components/SocialComments';
import AuthModal from '@/components/AuthModal';

type Tab = 'single' | 'csv' | 'chat' | 'social' | 'profile';

export default function App() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('single');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  function openAuth(mode: 'signin' | 'signup') {
    setAuthMode(mode);
    setAuthModalOpen(true);
  }

  function handleTabClick(tab: Tab) {
    if ((tab === 'profile' || tab === 'social') && !user) {
      openAuth('signup');
      return;
    }
    setActiveTab(tab);
  }

  const tabs: { id: Tab; label: string; icon: typeof FileText; needsAuth?: boolean }[] = [
    { id: 'single', label: 'Single Review', icon: FileText },
    { id: 'csv', label: 'CSV Analysis', icon: FileSpreadsheet },
    { id: 'chat', label: 'Assistant', icon: MessageSquare },
    { id: 'social', label: 'Social', icon: Share2, needsAuth: true },
    { id: 'profile', label: 'Profile', icon: UserCircle, needsAuth: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-800">
      {/* Decorative background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-rose-200/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-amber-200/20 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <header className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-xs font-medium text-slate-500 shadow-sm ring-1 ring-slate-200/60 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-teal-500" />
            Sentiment Analyzer
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            How does your review feel? 🔍
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Analyze sentiment with VADER — single reviews or CSV batches — and chat with our assistant.
          </p>
        </header>

        {/* Auth bar */}
        <div className="mb-4 flex items-center justify-end">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-200/60" />
          ) : user ? (
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/60 backdrop-blur transition hover:bg-white hover:shadow-md"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 text-xs font-bold text-white">
                {(profile?.full_name || user.email || '?')
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <span className="hidden sm:inline">{profile?.full_name || user.email?.split('@')[0]}</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => openAuth('signin')}
                className="rounded-xl px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuth('signup')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-3 py-1.5 text-sm font-medium text-white shadow-md shadow-teal-500/20 transition hover:from-teal-600 hover:to-emerald-600"
              >
                <LogIn className="h-3.5 w-3.5" />
                Create Profile
              </button>
            </div>
          )}
        </div>

        {/* Tab navigation */}
        <nav className="mb-6 flex gap-1.5 rounded-xl bg-white/70 p-1.5 shadow-sm ring-1 ring-slate-200/60 backdrop-blur">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isLocked = tab.needsAuth && !user;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive && !isLocked
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab content */}
        <div className="flex-1">
          {activeTab === 'single' && <SingleReview />}
          {activeTab === 'csv' && <CsvAnalysis />}
          {activeTab === 'chat' && <ChatAssistant />}
          {activeTab === 'social' && user && <SocialComments />}
          {activeTab === 'profile' && user && <ProfilePage />}
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 text-center text-xs text-slate-400">
          Powered by VADER sentiment analysis · Runs in your browser
        </footer>
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
