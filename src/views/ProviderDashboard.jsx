import React, { useState } from 'react';
import { 
  Building2, 
  Leaf, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  Plus, 
  ThermometerSnowflake, 
  Truck, 
  Check, 
  Sparkles,
  ShieldCheck,
  FileText,
  MapPin
} from 'lucide-react';
import NearestNgoFinder from '../components/NearestNgoFinder';
import confetti from 'canvas-confetti';
import { BackendService } from '../services/backendService';

export default function ProviderDashboard({ 
  currentUser,
  providerStats, 
  activeListings, 
  setActiveListings, 
  showNotification
}) {
  // Donation Form Local State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Buffet Surplus',
    quantityKg: '',
    portions: '',
    prepTime: '15:30',
    expiryTime: '21:30',
    coldStorageRequired: true,
    dietary: 'Vegetarian',
    items: '',
    loadingBay: 'Gate 4 - Kitchen Cold Dock'
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const isAlternativeProvider = currentUser?.verificationMethod === 'alternative_aadhaar' || currentUser?.fssai === 'ALT-AADHAAR-PENDING';
  const [providerViewTab, setProviderViewTab] = useState(isAlternativeProvider ? 'alternative_ngo_finder' : 'donations');

  const categories = [
    'Buffet Surplus',
    'Cooked Meals',
    'Bakery/Pastries',
    'Fresh Produce',
    'Packaged Dairy'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.quantityKg) {
      showNotification('Please fill in food title and quantity', 'error');
      return;
    }

    setFormSubmitting(true);

    try {
      const activeHotelName = currentUser?.name || providerStats.hotelName || 'The Grand Oberoi Palace';
      const activeLocation = currentUser?.location || 'Connaught Place, New Delhi';

      const listingDraft = {
        id: `LIST-${Math.floor(100 + Math.random() * 900)}`,
        title: formData.title,
        category: formData.category,
        quantityKg: parseFloat(formData.quantityKg),
        portions: formData.portions ? parseInt(formData.portions) : Math.round(parseFloat(formData.quantityKg) * 2.2),
        prepTime: formData.prepTime,
        expiryTime: formData.expiryTime,
        expiresInMinutes: 45,
        coldStorageRequired: formData.coldStorageRequired,
        dietary: [formData.dietary],
        items: formData.items || `${formData.quantityKg}kg fresh banquet surplus`,
        status: 'Pending Match',
        hotelName: activeHotelName,
        location: activeLocation,
        loadingBay: formData.loadingBay,
        loggedAt: 'Just now',
        assignedNgo: null,
        temperature: formData.coldStorageRequired ? '3.5°C' : 'Ambient'
      };

      const savedListing = await BackendService.createFoodListing(listingDraft);

      setActiveListings(prev => [savedListing, ...prev]);
      setFormData({
        title: '',
        category: 'Buffet Surplus',
        quantityKg: '',
        portions: '',
        prepTime: '15:30',
        expiryTime: '21:30',
        coldStorageRequired: true,
        dietary: 'Vegetarian',
        items: '',
        loadingBay: 'Gate 4 - Kitchen Cold Dock'
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });

      showNotification('Surplus donation saved to Supabase & broadcasted to nearby NGOs!', 'success');
    } catch (err) {
      console.error('Error broadcasting surplus:', err);
      showNotification('Error saving food surplus to backend', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Status transition handlers for Kanban interactive simulation
  const handleMoveToAccepted = async (listingId) => {
    const updates = {
      status: 'Accepted (Awaiting Pickup)',
      assignedNgo: 'Robin Hood Army Fleet #3',
      driverName: 'Suresh Patil (DL-1V-8902)',
      driverEta: '14 mins away'
    };

    setActiveListings(prev => prev.map(item => {
      if (item.id === listingId) {
        return {
          ...item,
          ...updates
        };
      }
      return item;
    }));

    await BackendService.updateListingStatus(listingId, updates);
    showNotification('NGO accepted donation! Driver dispatched & updated in Supabase.', 'info');
  };

  const handleMoveToCompleted = async (listingId) => {
    const updates = {
      status: 'Completed',
      completedAt: 'Just now',
      temperature: '3.4°C verified at handover'
    };

    setActiveListings(prev => prev.map(item => {
      if (item.id === listingId) {
        return {
          ...item,
          ...updates
        };
      }
      return item;
    }));

    await BackendService.updateListingStatus(listingId, updates);

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.5 }
    });
    showNotification('Food handover completed! Logged to Supabase.', 'success');
  };

  const pendingListings = activeListings.filter(i => i.status === 'Pending Match');
  const acceptedListings = activeListings.filter(i => i.status === 'Accepted (Awaiting Pickup)');
  const completedListings = activeListings.filter(i => i.status === 'Completed');

  const displayHotelName = currentUser?.name || providerStats.hotelName;
  const displayFssai = currentUser?.fssai || providerStats.fssaiNumber;
  const displayLocation = currentUser?.location || 'Connaught Place, New Delhi';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* 1. PROVIDER HEADER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-forest-900 text-white rounded-2xl shadow-md">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200">
                Corporate Hospitality Partner
              </span>
              <span className="text-xs font-medium text-slate-400">
                ID: {displayFssai}
              </span>
              {isAlternativeProvider ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <FileText className="w-3.5 h-3.5 text-amber-600" /> Alternative Verification (Aadhaar KYC)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> FSSAI Verified
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-900 font-heading mt-1">
              {displayHotelName}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Executive Culinary & Banquet Surplus Logistics Portal • {displayLocation}
            </p>
          </div>
        </div>

        {/* Quick Actions & Tab Navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center">
            <button
              type="button"
              onClick={() => setProviderViewTab('donations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                providerViewTab === 'donations'
                  ? 'bg-white text-forest-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Surplus Operations
            </button>
            <button
              type="button"
              onClick={() => setProviderViewTab('alternative_ngo_finder')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                providerViewTab === 'alternative_ngo_finder'
                  ? 'bg-white text-forest-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-brand-orange" />
              <span>Nearest NGOs</span>
            </button>
          </div>

          {providerViewTab === 'donations' && (
            <button
              onClick={() => {
                const el = document.getElementById('donation-form');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-brand-orange hover:bg-orange-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-orange-500/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              <span>Log Surplus</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TAB CONTENT: SURPLUS OPERATIONS vs ALTERNATIVE NGO FINDER */}
      {providerViewTab === 'donations' ? (
        <>
          {/* 2. ANALYTICS BAR (Three Metric Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Waste Diverted (kg) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-forest-600 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Waste Diverted (kg)
            </span>
            <div className="p-2.5 rounded-xl bg-forest-50 text-forest-800">
              <Leaf className="w-5 h-5 text-forest-800" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-heading text-forest-900">
              {providerStats.wasteDivertedKg.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-slate-500">kg</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{providerStats.wasteDivertedTrend}</span>
          </div>
        </div>

        {/* Meals Saved */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-brand-orange transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Meals Saved
            </span>
            <div className="p-2.5 rounded-xl bg-orange-50 text-brand-orange">
              <Award className="w-5 h-5 text-brand-orange" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-heading text-forest-900">
              {providerStats.mealsSaved.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-slate-500">meals</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-orange">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{providerStats.mealsSavedTrend}</span>
          </div>
        </div>

        {/* CO2 Avoided */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-forest-600 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              CO₂ Avoided
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-heading text-forest-900">
              {providerStats.co2AvoidedTons}
            </span>
            <span className="text-sm font-bold text-slate-500">Tons CO₂e</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{providerStats.co2AvoidedTrend}</span>
          </div>
        </div>

      </div>

      {/* 3. DONATION FORM */}
      <div id="donation-form" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="border-b border-slate-100 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange uppercase tracking-wider">
              <Plus className="w-4 h-4" /> Log Fresh Banquet Surplus
            </div>
            <h2 className="text-xl font-bold font-heading text-forest-900 mt-1">
              Surplus Redistribution Broadcast
            </h2>
            <p className="text-xs text-slate-500">
              Broadcasted immediately to authenticated food rescue vans within a 5km radius.
            </p>
          </div>
          <div className="text-xs text-forest-800 bg-forest-50 px-3 py-1.5 rounded-xl border border-forest-100 font-medium self-start sm:self-auto">
            ⚡ Instant Broadcast to 18 Local NGO Fleets
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Title / Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Surplus Batch Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Grand Ball Buffet - Dal Makhani, Paneer & Rice"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-forest-900 focus:ring-2 focus:ring-forest-900/20 transition-all"
              />
            </div>

            {/* Food Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Food Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-forest-900 focus:ring-2 focus:ring-forest-900/20 bg-white transition-all"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Quantity (kg) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Quantity (kg) *
              </label>
              <input
                type="number"
                name="quantityKg"
                value={formData.quantityKg}
                onChange={handleInputChange}
                placeholder="e.g., 50"
                step="0.5"
                min="1"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-forest-900 focus:ring-2 focus:ring-forest-900/20 transition-all"
              />
            </div>

            {/* Estimated Portions */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Estimated Portions
              </label>
              <input
                type="number"
                name="portions"
                value={formData.portions}
                onChange={handleInputChange}
                placeholder="Auto-calculated (e.g. 110)"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-forest-900 focus:ring-2 focus:ring-forest-900/20 transition-all"
              />
            </div>

            {/* Prep Time */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Prep Time (Cooked At) *
              </label>
              <input
                type="time"
                name="prepTime"
                value={formData.prepTime}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-forest-900 focus:ring-2 focus:ring-forest-900/20 transition-all"
              />
            </div>

            {/* Expiry Time */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Expiry Time (Best Before) *
              </label>
              <input
                type="time"
                name="expiryTime"
                value={formData.expiryTime}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-forest-900 focus:ring-2 focus:ring-forest-900/20 transition-all"
              />
            </div>

            {/* Dietary Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Dietary Classification
              </label>
              <select
                name="dietary"
                value={formData.dietary}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-forest-900 focus:ring-2 focus:ring-forest-900/20 bg-white transition-all"
              >
                <option value="Vegetarian">Pure Vegetarian</option>
                <option value="Jain Friendly">Jain Friendly (No Root Veg)</option>
                <option value="Halal Certified">Halal Certified Non-Veg</option>
                <option value="Mixed">Mixed (Segregated Containers)</option>
              </select>
            </div>

            {/* Loading Bay & Dock */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Pickup Loading Bay
              </label>
              <input
                type="text"
                name="loadingBay"
                value={formData.loadingBay}
                onChange={handleInputChange}
                placeholder="Gate 4 - Kitchen Cold Dock"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-forest-900 focus:ring-2 focus:ring-forest-900/20 transition-all"
              />
            </div>

          </div>

          {/* Cold Storage Required Toggle (Special highlight requirement) */}
          <div className="p-4 rounded-2xl bg-forest-50/70 border border-forest-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${formData.coldStorageRequired ? 'bg-forest-900 text-white' : 'bg-slate-200 text-slate-500'}`}>
                <ThermometerSnowflake className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-forest-900">
                  Cold Storage Required (Refrigerated Transport)
                </span>
                <p className="text-xs text-slate-500">
                  Mandatory for perishable gravies, dairy, and cooked proteins per FSSAI regulations (&lt; 4°C).
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                name="coldStorageRequired"
                checked={formData.coldStorageRequired}
                onChange={handleInputChange}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-forest-900"></div>
              <span className="ml-3 text-xs font-bold text-forest-900">
                {formData.coldStorageRequired ? 'YES (Active Cold Chain)' : 'NO (Ambient)'}
              </span>
            </label>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={formSubmitting}
              className="flex items-center gap-2 bg-forest-900 hover:bg-forest-950 text-white px-8 py-3.5 rounded-2xl text-sm font-bold shadow-lg shadow-forest-900/20 transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              {formSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Broadcasting to Fleets...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-brand-orange" />
                  <span>Broadcast Surplus Donation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 4. ACTIVE LISTINGS: KANBAN-STYLE VIEW */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold font-heading text-forest-900">
              Active Redistribution Pipeline
            </h2>
            <p className="text-xs text-slate-500">
              Real-time Kanban tracking donations from kitchen log to shelter delivery.
            </p>
          </div>
          <span className="text-xs font-bold text-forest-900 bg-forest-50 px-3 py-1 rounded-full border border-forest-200">
            Total {activeListings.length} Logged Entries
          </span>
        </div>

        {/* 3 Kanban Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: Pending Match */}
          <div className="bg-slate-100/80 rounded-3xl p-4 sm:p-5 border border-slate-200 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-ping"></span>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Pending Match
                </h3>
              </div>
              <span className="text-xs font-bold bg-white text-brand-orange px-2.5 py-0.5 rounded-full border border-slate-200 shadow-sm">
                {pendingListings.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {pendingListings.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-white/60 rounded-2xl border border-dashed border-slate-300">
                  No batches waiting for match.
                </div>
              ) : (
                pendingListings.map(listing => (
                  <div 
                    key={listing.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded">
                        {listing.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {listing.id}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-forest-900 leading-snug">
                      {listing.title}
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Quantity</span>
                        <span className="font-extrabold text-forest-900">{listing.quantityKg} kg</span> ({listing.portions} meals)
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Best Before</span>
                        <span className="font-bold text-brand-orange">{listing.expiryTime}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <ThermometerSnowflake className="w-3.5 h-3.5 text-forest-800" />
                        {listing.coldStorageRequired ? 'Cold (< 4°C)' : 'Ambient'}
                      </span>
                      <span className="text-slate-400">{listing.loggedAt}</span>
                    </div>

                    {/* Interactive Action: Simulate NGO Acceptance */}
                    <button
                      onClick={() => handleMoveToAccepted(listing.id)}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-forest-200"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
                      Simulate NGO Match Acceptance
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Accepted (Awaiting Pickup) */}
          <div className="bg-slate-100/80 rounded-3xl p-4 sm:p-5 border border-slate-200 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-forest-700"></span>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Accepted (Awaiting Pickup)
                </h3>
              </div>
              <span className="text-xs font-bold bg-white text-forest-800 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-sm">
                {acceptedListings.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {acceptedListings.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-white/60 rounded-2xl border border-dashed border-slate-300">
                  No active pickups en route.
                </div>
              ) : (
                acceptedListings.map(listing => (
                  <div 
                    key={listing.id}
                    className="bg-white p-4 rounded-2xl border-2 border-forest-200 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold text-forest-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-brand-orange" />
                        Driver En Route
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {listing.id}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-forest-900 leading-snug">
                      {listing.title}
                    </h4>

                    <div className="bg-forest-50 p-2.5 rounded-xl border border-forest-100 space-y-1 text-xs">
                      <div className="font-bold text-forest-900 flex items-center justify-between">
                        <span>{listing.assignedNgo}</span>
                        <span className="text-brand-orange font-bold">{listing.driverEta || '12 mins'}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Driver: {listing.driverName || 'Rajesh Kumar'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Dock: {listing.loadingBay}
                      </div>
                    </div>

                    {/* Interactive Action: Simulate Pickup Handover Completed */}
                    <button
                      onClick={() => handleMoveToCompleted(listing.id)}
                      className="w-full mt-2 py-2 px-3 rounded-xl bg-forest-900 hover:bg-forest-950 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5 text-brand-orange" />
                      Confirm Handover & Log Temperature
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="bg-slate-100/80 rounded-3xl p-4 sm:p-5 border border-slate-200 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  Completed & Audited
                </h3>
              </div>
              <span className="text-xs font-bold bg-white text-emerald-700 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-sm">
                {completedListings.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {completedListings.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-white/60 rounded-2xl border border-dashed border-slate-300">
                  No completed donations today yet.
                </div>
              ) : (
                completedListings.map(listing => (
                  <div 
                    key={listing.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5 opacity-90 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Delivered
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {listing.id}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-forest-900 leading-snug">
                      {listing.title}
                    </h4>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Total Weight:</span>
                        <span className="font-bold text-forest-900">{listing.quantityKg} kg</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Temp Audit:</span>
                        <span className="font-mono text-emerald-700 font-bold">{listing.temperature}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Delivered By:</span>
                        <span className="text-slate-700">{listing.assignedNgo || 'Robin Hood Army'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-forest-800 font-semibold">
                      <span>Handover Manifest</span>
                      <span className="text-emerald-700 font-bold">✓ Audit Verified</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
      </>
      ) : (
        /* ALTERNATIVE PROVIDER VERIFICATION FLOW & NEAREST NGO FINDER */
        <div className="space-y-8 animate-fadeIn">
          
          {/* Alternative Verification Status Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border-2 border-amber-200/80 bg-gradient-to-br from-amber-50/30 via-white to-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl">
                  <FileText className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold font-heading text-forest-900">
                      Alternative Provider Verification: Aadhaar KYC Submitted
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                      Pending Review
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Statutory ID documentation for catering, self-help groups, and community culinary kitchens.
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-500 font-mono sm:text-right">
                Ref: #ALT-VERIF-7821
              </div>
            </div>

            {/* Document Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100 text-xs">
              <div>
                <span className="text-slate-500">Submitted Document: </span>
                <span className="font-semibold text-slate-900 block truncate">
                  📄 {currentUser?.aadhaarFileName || 'Aadhaar-KYC-Identity-Audit.pdf'} (1.4 MB)
                </span>
              </div>
              <div>
                <span className="text-slate-500">Masked ID Number: </span>
                <span className="font-mono font-bold text-slate-800 block">
                  {currentUser?.aadhaarMaskedUid || 'XXXX-XXXX-9021'}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Audit Status: </span>
                <span className="text-amber-800 font-bold block">
                  ● Compliance Officer Review In Progress
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Your Aadhaar identity proof has been submitted for statutory review under FeedAll's KYC compliance policy. While the administrative audit is being completed, you can locate and dispatch surplus food directly to verified NGO rescue fleets below.
            </p>
          </div>

          {/* Section: Find NGOs Near You */}
          <NearestNgoFinder 
            currentUser={currentUser} 
            showNotification={showNotification}
            alternativeVerificationStatus="Pending Review"
          />

        </div>
      )}

    </div>
  );
}
