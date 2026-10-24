import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  MapPin, 
  Navigation, 
  Search, 
  ShieldCheck, 
  Phone, 
  Clock, 
  Truck, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  RotateCcw,
  Utensils,
  Filter
} from 'lucide-react';
import { calculateDistanceKm, resolveLocation } from '../utils/geoUtils';
import { BackendService } from '../services/backendService';
import NgoDetailModal from './NgoDetailModal';
import DonationEnquiryModal from './DonationEnquiryModal';

export default function NearestNgoFinder({ 
  currentUser, 
  showNotification,
  alternativeVerificationStatus = 'Pending Review' 
}) {
  // Directory state
  const [ngos, setNgos] = useState([]);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(true);

  // User location state
  // Default fallback: Central Delhi (Connaught Place / Parliament Area: 28.6315, 77.2167)
  const [coords, setCoords] = useState({ lat: 28.6315, lng: 77.2167 });
  const [locationLabel, setLocationLabel] = useState('Connaught Place, New Delhi (Default Location)');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingManual, setIsSearchingManual] = useState(false);
  const [radiusKm, setRadiusKm] = useState(10); // 10, 25, 50 km
  const [serviceFilter, setServiceFilter] = useState('all');

  // Modals state
  const [selectedNgoForDetails, setSelectedNgoForDetails] = useState(null);
  const [selectedNgoForEnquiry, setSelectedNgoForEnquiry] = useState(null);

  // Enquiries list for this provider
  const [enquiries, setEnquiries] = useState([]);
  const [isLoadingEnquiries, setIsLoadingEnquiries] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('find'); // 'find' | 'enquiries'

  // Manual refresh for enquiries
  const loadEnquiries = useCallback(async () => {
    if (!currentUser?.email) return;
    setIsLoadingEnquiries(true);
    try {
      const data = await BackendService.fetchDonationEnquiries(currentUser.email);
      setEnquiries(data || []);
    } catch (err) {
      console.error('Failed to load enquiries:', err);
    } finally {
      setIsLoadingEnquiries(false);
    }
  }, [currentUser]);

  // Initial asynchronous data load from Supabase / Backend
  useEffect(() => {
    let isMounted = true;

    BackendService.fetchNgoDirectory().then((data) => {
      if (isMounted) {
        setNgos(data || []);
        setIsLoadingDirectory(false);
      }
    });

    if (currentUser?.email) {
      BackendService.fetchDonationEnquiries(currentUser.email).then((data) => {
        if (isMounted) {
          setEnquiries(data || []);
          setIsLoadingEnquiries(false);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Handle Geolocation Button ("Use My Location")
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please enter your location manually below.');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocationLabel(`GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        setIsLocating(false);
        if (showNotification) {
          showNotification('Current GPS coordinates detected successfully!', 'success');
        }
      },
      (error) => {
        setIsLocating(false);
        let errorMsg = 'Could not retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission was denied. You can enter your city, locality, or PIN code manually below.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'GPS location is currently unavailable. Please enter your locality manually.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Location request timed out. Please enter your locality manually.';
        }
        setLocationError(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Handle Manual Location Search
  const handleManualSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingManual(true);
    setLocationError('');

    try {
      const resolved = await resolveLocation(searchQuery);
      if (resolved) {
        setCoords({ lat: resolved.lat, lng: resolved.lng });
        setLocationLabel(resolved.name || searchQuery);
        if (showNotification) {
          showNotification(`Location set to: ${resolved.name}`, 'info');
        }
      } else {
        setLocationError(`Could not find coordinates for "${searchQuery}". Try searching a major hub (e.g. Connaught Place, Mumbai, Bengaluru, or PIN code 110001).`);
      }
    } catch {
      setLocationError('Network error while searching location. Please try again.');
    } finally {
      setIsSearchingManual(false);
    }
  };

  // Quick preset locality selector
  const setPresetLocation = (label, lat, lng) => {
    setCoords({ lat, lng });
    setLocationLabel(label);
    setLocationError('');
  };

  // Calculate distance, sort, and filter NGOs
  const processedNgos = useMemo(() => {
    if (!ngos || ngos.length === 0) return [];

    return ngos
      .map((ngo) => {
        const distance = calculateDistanceKm(coords.lat, coords.lng, ngo.latitude, ngo.longitude);
        // Estimate driving time (~25 km/h urban traffic in India)
        const estMinutes = distance ? Math.round((distance / 25) * 60) : null;
        return {
          ...ngo,
          distanceKm: distance,
          estDriveTime: estMinutes ? (estMinutes < 60 ? `~${estMinutes} mins` : `~${(estMinutes / 60).toFixed(1)} hrs`) : 'N/A'
        };
      })
      .filter((ngo) => {
        // Radius filter
        if (ngo.distanceKm == null || ngo.distanceKm > radiusKm) return false;
        // Service filter
        if (serviceFilter !== 'all') {
          if (!ngo.services || !ngo.services.includes(serviceFilter)) return false;
        }
        return true;
      })
      .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  }, [ngos, coords, radiusKm, serviceFilter]);

  const handleEnquiryCreated = (newEnquiry) => {
    setEnquiries((prev) => [newEnquiry, ...prev]);
    setActiveSubTab('enquiries');
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-bold text-brand-orange bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                Alternative Provider Flow
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                Verification: {alternativeVerificationStatus}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-forest-900">
              Find NGOs Near You
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Connect with nearby NGOs to coordinate surplus food donation and redistribution.
            </p>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl shrink-0">
            <button
              onClick={() => setActiveSubTab('find')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'find' 
                  ? 'bg-white text-forest-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nearest Directory ({processedNgos.length})
            </button>
            <button
              onClick={() => setActiveSubTab('enquiries')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'enquiries' 
                  ? 'bg-white text-forest-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Enquiries Sent</span>
              {enquiries.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-brand-orange text-white text-[10px] flex items-center justify-center font-bold">
                  {enquiries.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mandatory Statutory Notice */}
        <div className="mt-5 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Important Legal & Food Safety Notice: </span>
            Finding and connecting with an NGO does <span className="underline font-bold">not</span> mean the food provider has been legally exempted from applicable statutory food safety requirements under the Food Safety and Standards Act (2006) and the FSS (Recovery and Distribution of Surplus Food) Regulations, 2019. Providers remain responsible for hygienic cooking, safe temperature maintenance, and proper allergen declarations.
          </div>
        </div>

        {/* 2. LOCATION & RADIUS CONTROLS */}
        {activeSubTab === 'find' && (
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
            
            {/* Active Coordinates Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-forest-50/60 p-3.5 rounded-2xl border border-forest-100 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-orange shrink-0" />
                <span className="text-slate-500 font-medium">Selected Location: </span>
                <span className="font-bold text-forest-900 truncate max-w-md">{locationLabel}</span>
              </div>
              <div className="text-slate-500 font-medium">
                Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}
              </div>
            </div>

            {/* Location Inputs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-3 items-center">
              
              {/* Geolocation Button */}
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={isLocating}
                className="px-4 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-950 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all whitespace-nowrap disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-forest-700"
                aria-label="Use device GPS location"
              >
                <Navigation className={`w-3.5 h-3.5 text-brand-orange ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Detecting GPS...' : 'Use My Location'}</span>
              </button>

              {/* Manual Search Input */}
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter city, locality, address, or PIN (e.g., Connaught Place, 110001, Mumbai)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900 focus:ring-1 focus:ring-forest-900"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingManual || !searchQuery.trim()}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {isSearchingManual ? 'Searching...' : 'Search'}
                </button>
              </form>

              {/* Radius Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Radius:
                </span>
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-forest-900 focus:outline-none focus:border-forest-900"
                >
                  <option value={10}>10 km (Default)</option>
                  <option value={25}>25 km (Expanded)</option>
                  <option value={50}>50 km (Metropolitan)</option>
                </select>
              </div>

            </div>

            {/* Error Message if location fails */}
            {locationError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{locationError}</span>
                </div>
                <button
                  onClick={() => setLocationError('')}
                  className="text-xs font-bold hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Quick Location Chips */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
              <span className="font-semibold text-slate-400">Quick Metro Hubs:</span>
              <button
                onClick={() => setPresetLocation('Connaught Place, New Delhi', 28.6315, 77.2167)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-forest-100 hover:text-forest-900 font-medium transition-colors"
              >
                Central Delhi (110001)
              </button>
              <button
                onClick={() => setPresetLocation('Chanakyapuri, New Delhi', 28.5910, 77.1890)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-forest-100 hover:text-forest-900 font-medium transition-colors"
              >
                Chanakyapuri (110021)
              </button>
              <button
                onClick={() => setPresetLocation('Udyog Vihar, Gurugram', 28.4980, 77.0820)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-forest-100 hover:text-forest-900 font-medium transition-colors"
              >
                Gurugram (122015)
              </button>
              <button
                onClick={() => setPresetLocation('Lower Parel, Mumbai', 18.9986, 72.8311)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-forest-100 hover:text-forest-900 font-medium transition-colors"
              >
                Mumbai Central (400013)
              </button>
              <button
                onClick={() => setPresetLocation('Rajajinagar, Bengaluru', 12.9982, 77.5530)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-forest-100 hover:text-forest-900 font-medium transition-colors"
              >
                Bengaluru Hub (560010)
              </button>
            </div>

            {/* Service Filters */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap text-xs">
              <span className="font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Services:
              </span>
              {[
                { id: 'all', label: 'All Services' },
                { id: 'Cooked Meals', label: 'Cooked Meals' },
                { id: 'Buffet Surplus', label: 'Buffet Surplus' },
                { id: 'Bakery', label: 'Bakery' },
                { id: 'Cold-Chain Transport', label: 'Cold-Chain Van' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setServiceFilter(filter.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    serviceFilter === filter.id
                      ? 'bg-forest-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* 3. NGO RESULTS CARDS GRID */}
      {activeSubTab === 'find' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <div>
              Sorted by <span className="font-bold text-forest-900">actual calculated distance</span> (nearest to farthest).
            </div>
            <div>
              Showing <span className="font-bold text-forest-900">{processedNgos.length}</span> active NGO fleets within {radiusKm} km
            </div>
          </div>

          {isLoadingDirectory ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse space-y-4">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-16 bg-slate-100 rounded-2xl" />
                  <div className="h-10 bg-slate-200 rounded-xl" />
                </div>
              ))}
            </div>
          ) : processedNgos.length === 0 ? (
            /* Honest, graceful empty state */
            <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border-2 border-dashed border-slate-300 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center mx-auto shadow-sm">
                <MapPin className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-heading text-slate-800">
                  No Verified NGOs Found Within {radiusKm} km
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  We could not find active NGO fleets within {radiusKm} km of <span className="font-semibold text-slate-700">{locationLabel}</span>. Expand your search radius or choose a nearby metro center.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
                {radiusKm < 25 && (
                  <button
                    onClick={() => setRadiusKm(25)}
                    className="px-4 py-2 rounded-xl bg-forest-900 text-white text-xs font-bold hover:bg-forest-950 transition-colors shadow-sm"
                  >
                    Expand Radius to 25 km
                  </button>
                )}
                {radiusKm < 50 && (
                  <button
                    onClick={() => setRadiusKm(50)}
                    className="px-4 py-2 rounded-xl bg-brand-orange text-white text-xs font-bold hover:bg-orange-600 transition-colors shadow-sm"
                  >
                    Expand Radius to 50 km
                  </button>
                )}
                <button
                  onClick={() => setPresetLocation('Connaught Place, New Delhi', 28.6315, 77.2167)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Search Delhi NCR
                </button>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 max-w-sm mx-auto">
                Are you an NGO operating in this territory? Contact FeedAll Compliance Admin to onboard and verify your fleet.
              </div>
            </div>
          ) : (
            /* Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedNgos.map((ngo) => {
                const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${ngo.latitude},${ngo.longitude}`;

                return (
                  <div
                    key={ngo.id}
                    className="bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-forest-700 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between group"
                  >
                    <div>
                      {/* Distance & Drive Time Tag */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <MapPin className="w-4 h-4 text-brand-orange shrink-0" />
                          <span className="text-forest-900 text-sm font-extrabold">{ngo.distanceKm} km</span>
                          <span className="text-[11px] text-slate-400 font-normal">away</span>
                        </div>
                        <span className="text-[10px] font-bold bg-forest-50 text-forest-800 border border-forest-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-forest-600" />
                          {ngo.estDriveTime}
                        </span>
                      </div>

                      {/* NGO Name & Verification Badge */}
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold font-heading text-forest-900 group-hover:text-forest-950 leading-snug">
                            {ngo.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          {ngo.verified && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200" title={ngo.verificationBadge}>
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              FSSAI Verified
                            </span>
                          )}
                          {ngo.acceptingDonations && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              ● Standby
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 pt-1">
                          {ngo.address}, {ngo.city}
                        </p>
                      </div>

                      {/* Fleet Capacity & Service Area Box */}
                      <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <Truck className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                          <span className="font-semibold text-slate-900">{ngo.fleetCapacity}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-2">
                          {ngo.description}
                        </div>
                      </div>

                      {/* Service Chips */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {ngo.services && ngo.services.slice(0, 3).map((svc, idx) => (
                          <span 
                            key={idx}
                            className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-100"
                          >
                            ✓ {svc}
                          </span>
                        ))}
                      </div>

                      {/* Contact Phone */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                          <Phone className="w-3.5 h-3.5 text-brand-orange" />
                          <a 
                            href={`tel:${ngo.phone}`} 
                            className="hover:text-brand-orange transition-colors"
                          >
                            {ngo.phone}
                          </a>
                        </div>
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-forest-800 hover:text-forest-950 inline-flex items-center gap-1"
                        >
                          Directions
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedNgoForDetails(ngo)}
                        className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => setSelectedNgoForEnquiry(ngo)}
                        className="w-full py-2.5 px-3 rounded-xl bg-forest-900 hover:bg-forest-950 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-forest-900/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <Utensils className="w-3.5 h-3.5 text-brand-orange" />
                        <span>Contact NGO</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. ACTIVE ENQUIRIES TAB */}
      {activeSubTab === 'enquiries' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold font-heading text-forest-900">
                Dispatched Food Donation Enquiries
              </h3>
              <p className="text-xs text-slate-500">
                Track status updates from NGO rescue fleets for your submitted surplus batches.
              </p>
            </div>
            <button
              onClick={loadEnquiries}
              className="p-2 text-slate-500 hover:text-forest-900 rounded-xl hover:bg-slate-100 transition-colors"
              title="Refresh enquiries"
            >
              <RotateCcw className={`w-4 h-4 ${isLoadingEnquiries ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {enquiries.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
              <Utensils className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No Donation Enquiries Sent Yet</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Use the "Nearest Directory" tab to select an NGO within your radius and send an initial surplus donation enquiry.
              </p>
              <button
                onClick={() => setActiveSubTab('find')}
                className="mt-2 px-4 py-2 rounded-xl bg-forest-900 text-white text-xs font-bold hover:bg-forest-950 transition-colors"
              >
                Find Nearby NGOs
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {enquiries.map((enq) => {
                const statusColor = 
                  enq.status === 'accepted' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  enq.status === 'declined' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                  enq.status === 'completed' ? 'bg-forest-50 text-forest-900 border-forest-200' :
                  'bg-amber-50 text-amber-800 border-amber-200';

                return (
                  <div 
                    key={enq.id}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-forest-900 text-sm font-heading">
                            {enq.foodTitle}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor}`}>
                            {enq.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Recipient: <span className="font-semibold text-slate-800">{enq.ngoName}</span> • Tracking Ref: #{enq.id}
                        </div>
                      </div>

                      <div className="text-right text-xs font-bold text-brand-orange">
                        {enq.quantityKg} kg • ~{enq.portions} Portions
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">Loading Dock: </span>
                        <span className="font-semibold text-slate-800">{enq.pickupLocation}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Window: </span>
                        <span className="font-semibold text-slate-800">{enq.preferredTime}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Storage: </span>
                        <span className="font-semibold text-slate-800">{enq.storageRequired}</span>
                      </div>
                    </div>

                    {enq.responseMessage && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-900 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">NGO Fleet Dispatcher Note: </span>
                          {enq.responseMessage}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      <NgoDetailModal 
        ngo={selectedNgoForDetails}
        isOpen={Boolean(selectedNgoForDetails)}
        onClose={() => setSelectedNgoForDetails(null)}
        onOpenEnquiry={(ngo) => setSelectedNgoForEnquiry(ngo)}
      />

      <DonationEnquiryModal
        ngo={selectedNgoForEnquiry}
        isOpen={Boolean(selectedNgoForEnquiry)}
        onClose={() => setSelectedNgoForEnquiry(null)}
        currentUser={currentUser}
        onEnquirySuccess={handleEnquiryCreated}
        showNotification={showNotification}
      />

    </div>
  );
}
