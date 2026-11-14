import { useEffect, useRef, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthModal } from './components/AuthModal';
import { FeedView } from './components/FeedView';
import { LeftSidebar } from './components/LeftSidebar';
import { MobileBottomNav, MobileHeader } from './components/MobileNav';
import { ProfileView } from './components/ProfileView';
import { RightSidebar } from './components/RightSidebar';
import { SettingsView } from './components/SettingsView';
import { useAuthStore } from './store/authStore';
import { usePostStore } from './store/postStore';
import { useUserStore } from './store/userStore';
import type { AppView, FeedTab } from './types';

export default function App() {
  const { checkAuth } = useAuthStore();
  const { fetchFeed, setTopicFilter } = usePostStore();
  const { fetchSuggestedUsers } = useUserStore();

  const [view, setView] = useState<AppView>({ type: 'feed', tab: 'home' });
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    void (async () => {
      await checkAuth();
      await Promise.all([fetchFeed('home', ''), fetchSuggestedUsers()]);
    })();
  }, [checkAuth, fetchFeed, fetchSuggestedUsers]);

  const handleNavigate = (nextView: AppView) => {
    setView(nextView);
    if (nextView.type === 'feed') {
      void fetchFeed(nextView.tab, nextView.tab === 'home' ? '' : undefined);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchFeedTab = (tab: FeedTab) => {
    setView({ type: 'feed', tab });
    void fetchFeed(tab, tab === 'home' ? '' : undefined);
  };

  const handleNavigateProfile = (userId: string) => {
    setView({ type: 'profile', userId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTopic = (topic: string) => {
    setView({ type: 'feed', tab: 'explore' });
    void setTopicFilter(topic);
  };

  const handleFocusComposer = () => {
    if (view.type !== 'feed' || view.tab === 'following') {
      setView({ type: 'feed', tab: 'home' });
      void fetchFeed('home', '');
    }
    setTimeout(() => {
      composerRef.current?.focus();
      composerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 60);
  };

  const handleAuthSuccess = () => {
    const activeTab = view.type === 'feed' ? view.tab : 'home';
    void fetchFeed(activeTab);
    void fetchSuggestedUsers();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            color: '#0F172A',
            fontSize: '13px',
          },
        }}
      />

      <MobileHeader onNavigate={handleNavigate} />

      <div className="mx-auto flex max-w-[1360px] justify-center">
        <LeftSidebar
          currentView={view}
          onNavigate={handleNavigate}
          onFocusComposer={handleFocusComposer}
        />

        <main className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-8">
          <div className="mx-auto max-w-[660px]">
            {view.type === 'feed' && (
              <FeedView
                activeTab={view.tab}
                composerRef={composerRef}
                onSwitchTab={handleSwitchFeedTab}
                onNavigateProfile={handleNavigateProfile}
              />
            )}

            {view.type === 'profile' && (
              <ProfileView
                userId={view.userId}
                onBack={() => handleNavigate({ type: 'feed', tab: 'home' })}
                onNavigateProfile={handleNavigateProfile}
              />
            )}

            {view.type === 'settings' && (
              <SettingsView
                onBack={() => handleNavigate({ type: 'feed', tab: 'home' })}
              />
            )}
          </div>
        </main>

        <RightSidebar
          onNavigateProfile={handleNavigateProfile}
          onSelectTopic={handleSelectTopic}
        />
      </div>

      <MobileBottomNav
        currentView={view}
        onNavigate={handleNavigate}
        onFocusComposer={handleFocusComposer}
      />

      <AuthModal onSuccess={handleAuthSuccess} />
    </div>
  );
}
