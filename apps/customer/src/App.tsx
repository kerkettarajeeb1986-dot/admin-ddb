import React, { useState } from 'react';
import { AuthProvider, useAuth } from '../../../src/shared/context/AuthContext';
import { StoreProvider } from '../../../src/shared/context/StoreContext';
import { CustomerApp } from '../../../src/shared/components/customer/CustomerApp';
import { Header } from '../../../src/shared/components/common/Header';
import { ProfileView } from '../../../src/shared/components/common/ProfileView';
import { UnifiedAuthModal } from '../../../src/shared/components/auth/UnifiedAuthModal';
import { ErrorBoundary } from '../../../src/shared/components/common/ErrorBoundary';

const CustomerRoot: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Header
        onOpenProfile={() => {
          if (user) {
            setShowProfile(!showProfile);
          } else {
            setShowAuthModal(true);
          }
        }}
        onOpenAdmin={() => {
          window.location.href = '/admin';
        }}
      />

      <main className="flex-1">
        {showProfile ? (
          <div className="p-4 sm:p-8 max-w-4xl mx-auto">
            <ProfileView onClose={() => setShowProfile(false)} />
          </div>
        ) : (
          <CustomerApp />
        )}
      </main>

      {showAuthModal && (
        <UnifiedAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <StoreProvider>
          <CustomerRoot />
        </StoreProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
