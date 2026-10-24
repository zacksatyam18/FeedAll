import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NotificationToast from './components/NotificationToast';
import AuthModal from './components/AuthModal';
import AdminDonationModal from './components/AdminDonationModal';

import LandingView from './views/LandingView';
import ProviderDashboard from './views/ProviderDashboard';
import NgoDashboard from './views/NgoDashboard';
import AdminDashboard from './views/AdminDashboard';

import { BackendService } from './services/backendService';
import {
  initialProviderStats,
  initialActiveListings,
  initialNgoMatches,
  initialPickupTrackers,
  initialVerificationQueue,
  globalAdminStats,
  initialFeedbacks
} from './data/mockData';

export default function App() {
  // Current active view / role
  const [currentRole, setCurrentRole] = useState('landing'); // 'landing' | 'provider' | 'ngo' | 'admin'
  
  // Current logged in user (null = guest)
  const [currentUser, setCurrentUser] = useState(null);

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('signin');
  const [authModalRole, setAuthModalRole] = useState('provider');

  // Platform Maintenance & Security Donation Modal state (UPI / QR Code)
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  // Data stores
  const [providerStats, setProviderStats] = useState(initialProviderStats);
  const [activeListings, setActiveListings] = useState(initialActiveListings);
  const [ngoMatches, setNgoMatches] = useState(initialNgoMatches);
  const [pickupTrackers, setPickupTrackers] = useState(initialPickupTrackers);
  const [verificationQueue, setVerificationQueue] = useState(initialVerificationQueue);
  const [adminStats, setAdminStats] = useState(globalAdminStats);
  
  // Feedback Store
  const [feedbacks, setFeedbacks] = useState(initialFeedbacks);

  // Toast feedback state
  const [notification, setNotification] = useState(null);

  // Load all initial data from Supabase PostgreSQL database
  useEffect(() => {
    async function loadBackendData() {
      try {
        // 1. Recover active Supabase Auth session if present
        const session = await BackendService.getCurrentSession();
        if (session?.user?.email) {
          const profile = await BackendService.fetchProfileByEmail(session.user.email);
          if (profile) {
            setCurrentUser(profile);
            setCurrentRole(profile.role);
          }
        }

        const [
          listings,
          matches,
          trackers,
          verifications,
          pStats,
          aStats,
          fbacks
        ] = await Promise.all([
          BackendService.fetchFoodListings(),
          BackendService.fetchNgoMatches(),
          BackendService.fetchPickupTrackers(),
          BackendService.fetchNgoVerifications(),
          BackendService.fetchProviderStats(),
          BackendService.fetchAdminStats(),
          BackendService.fetchFeedbacks()
        ]);

        if (listings && listings.length > 0) setActiveListings(listings);
        if (matches && matches.length > 0) setNgoMatches(matches);
        if (trackers && trackers.length > 0) setPickupTrackers(trackers);
        if (verifications && verifications.length > 0) setVerificationQueue(verifications);
        if (pStats) setProviderStats(pStats);
        if (aStats) setAdminStats(aStats);
        if (fbacks && fbacks.length > 0) setFeedbacks(fbacks);
      } catch (err) {
        console.error('Error initializing backend data from Supabase:', err);
      }
    }

    loadBackendData();
  }, []);

  const notifTimerRef = useRef(null);

  const showNotification = useCallback((message, type = 'info') => {
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    setNotification({ message, type });
    notifTimerRef.current = setTimeout(() => {
      setNotification(null);
      notifTimerRef.current = null;
    }, 4500);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { if (notifTimerRef.current) clearTimeout(notifTimerRef.current); }, []);

  // Open Auth Modal helper
  const handleOpenAuth = (tab = 'signin', role = 'provider') => {
    setAuthModalTab(tab);
    setAuthModalRole(role);
    setIsAuthModalOpen(true);
  };

  // Login Success Handler
  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setCurrentRole(userData.role);
    showNotification(`Welcome back, ${userData.name}! Logged in as ${userData.role.toUpperCase()}.`, 'success');
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    const prevName = currentUser?.name;
    await BackendService.signOut();
    setCurrentUser(null);
    setCurrentRole('landing');
    showNotification(`${prevName || 'User'} signed out successfully.`, 'info');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-brand-orange selection:text-white">
      {/* Enterprise Clean Sticky Navbar */}
      <Navbar 
        currentRole={currentRole} 
        setCurrentRole={setCurrentRole}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onSignOut={handleSignOut}
        unreadAlerts={ngoMatches.length > 0 ? 1 : 0}
        onOpenDonation={() => setIsDonationModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentRole === 'landing' && (
          <LandingView 
            setCurrentRole={setCurrentRole} 
            onOpenAuth={handleOpenAuth}
            feedbacks={feedbacks}
            setFeedbacks={setFeedbacks}
            showNotification={showNotification}
            adminStats={adminStats}
            ngoMatches={ngoMatches}
            onOpenDonation={() => setIsDonationModalOpen(true)}
          />
        )}

        {currentRole === 'provider' && (
          <ProviderDashboard 
            currentUser={currentUser}
            providerStats={providerStats}
            activeListings={activeListings}
            setActiveListings={setActiveListings}
            showNotification={showNotification}
          />
        )}

        {currentRole === 'ngo' && (
          <NgoDashboard 
            currentUser={currentUser}
            ngoMatches={ngoMatches}
            setNgoMatches={setNgoMatches}
            pickupTrackers={pickupTrackers}
            setPickupTrackers={setPickupTrackers}
            showNotification={showNotification}
          />
        )}

        {currentRole === 'admin' && (
          <AdminDashboard 
            currentUser={currentUser}
            adminStats={adminStats}
            verificationQueue={verificationQueue}
            setVerificationQueue={setVerificationQueue}
            showNotification={showNotification}
          />
        )}
      </main>

      {/* Enterprise Global Footer */}
      <Footer 
        setCurrentRole={setCurrentRole} 
        onOpenDonation={() => setIsDonationModalOpen(true)}
      />

      {/* Platform Maintenance & Security Fund Donation Modal (QR Code) */}
      <AdminDonationModal 
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
        showNotification={showNotification}
      />

      {/* Authentication Modal (Sign In / Register) */}
      <AuthModal 
        key={`${authModalTab}-${authModalRole}`}
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        initialTab={authModalTab}
        initialRole={authModalRole}
      />

      {/* Global Toast Notification */}
      <NotificationToast 
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}
