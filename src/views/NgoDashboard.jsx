import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  ShieldCheck, 
  Truck, 
  Clock, 
  MapPin, 
  ThermometerSnowflake, 
  CheckCircle2, 
  ArrowRight, 
  PhoneCall, 
  Sparkles,
  Check,
  User,
  Navigation,
  FileCheck2,
  FileText,
  AlertTriangle,
  UploadCloud,
  X,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BackendService } from '../services/backendService';

// Single Match Card with real-time ticking countdown timer
function MatchCard({ match, onAcceptAndDispatch }) {
  const [secondsLeft, setSecondsLeft] = useState(match.initialSeconds || 2700);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Format mm:ss
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isUrgent = minutes < 25;

  return (
    <div className={`bg-white rounded-3xl p-6 border-2 transition-all duration-300 shadow-md hover:shadow-xl flex flex-col justify-between ${
      isUrgent ? 'border-brand-orange ring-2 ring-brand-orange/20' : 'border-slate-200 hover:border-forest-700'
    }`}>
      
      {/* Card Header & Urgency Countdown UI */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <MapPin className="w-4 h-4 text-brand-orange" />
            <span className="font-bold text-slate-800">{match.distanceKm}</span> away
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              ~{match.driveTime}
            </span>
          </div>

          {/* Prominent Ticking Bright Orange Countdown Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 border border-brand-orange/40 text-brand-orange">
            <Clock className={`w-4 h-4 ${isUrgent ? 'animate-spin' : ''}`} />
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand-orange">
                Rescue Window
              </span>
              <span className="text-sm font-mono font-black tracking-tight text-brand-orange">
                {formattedTime}
              </span>
            </div>
          </div>
        </div>

        {/* Hotel & Match Information */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-forest-900 font-heading">
              {match.hotelName}
            </h3>
            {match.fssaiVerified && (
              <span className="text-emerald-700 bg-emerald-50 p-1 rounded-full text-xs" title="FSSAI Verified 5-Star Kitchen">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-medium">
            {match.pickupLocation}
          </p>
        </div>

        {/* Food Details Pill Box */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-forest-900 bg-forest-50 px-2.5 py-1 rounded-lg border border-forest-100">
              {match.category}
            </span>
            <span className="text-xs font-extrabold text-brand-orange">
              {match.quantityKg} kg • ~{match.portions} Portions
            </span>
          </div>

          <p className="text-xs font-medium text-slate-700 line-clamp-2">
            {match.itemsSummary}
          </p>

          <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium">
              <ThermometerSnowflake className="w-3.5 h-3.5 text-forest-800" />
              {match.coldStorageRequired ? 'Insulated Van Required' : 'Ambient OK'}
            </span>
            <span className="font-semibold text-forest-900">
              Best Before {match.bestBefore}
            </span>
          </div>
        </div>

        {/* Dietary and Allergens */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {match.dietary.map((tag, idx) => (
            <span key={idx} className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-100">
              ✓ {tag}
            </span>
          ))}
          {match.allergens && (
            <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-100">
              ℹ {match.allergens}
            </span>
          )}
        </div>
      </div>

      {/* Bold Dark Green "Accept & Dispatch" Button */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={() => onAcceptAndDispatch(match)}
          className="w-full py-3.5 px-4 rounded-2xl bg-forest-900 hover:bg-forest-950 text-white font-heading font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-forest-900/25 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <Truck className="w-4 h-4 text-brand-orange" />
          <span>Accept & Dispatch</span>
          <ArrowRight className="w-4 h-4 text-emerald-300" />
        </button>
      </div>

    </div>
  );
}

export default function NgoDashboard({ 
  currentUser,
  ngoMatches, 
  setNgoMatches, 
  pickupTrackers, 
  setPickupTrackers, 
  showNotification 
}) {
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' or 'tracker'
  const [selectedTracker, setSelectedTracker] = useState(pickupTrackers[0] || null);

  // NGO Registration Certificate State
  const [certData, setCertData] = useState(() => ({
    status: currentUser?.certificateStatus || 'approved',
    registrationNumber: currentUser?.registrationNo || 'DL/2018/0192841',
    issuingAuthority: currentUser?.issuingAuthority || 'Registrar of Societies, Govt. of NCT Delhi',
    registrationDate: '2018-04-12',
    originalFilename: currentUser?.certificateDocName || 'Robin_Hood_Army_Registration_Certificate_2018.pdf',
    fileSizeFormatted: '1.4 MB',
    submittedAt: '2026-10-14',
    reviewerNotes: 'Verified statutory non-profit legal entity standing under Societies Registration Act.',
    correctionRequested: null
  }));

  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [modalRegNo, setModalRegNo] = useState(currentUser?.registrationNo || 'DL/2018/0192841');
  const [modalAuthority, setModalAuthority] = useState(currentUser?.issuingAuthority || 'Registrar of Societies, Govt. of NCT Delhi');
  const [modalDate, setModalDate] = useState('2018-04-12');
  const [modalFile, setModalFile] = useState(null);
  const [modalFileName, setModalFileName] = useState('');
  const [modalFileSize, setModalFileSize] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalDeclaration, setModalDeclaration] = useState(false);
  const [isSubmittingCert, setIsSubmittingCert] = useState(false);

  // Load latest certificate data
  useEffect(() => {
    let isMounted = true;
    const identifier = currentUser?.email || currentUser?.id;
    if (identifier) {
      BackendService.fetchNgoCertificateByEmailOrId(identifier).then(data => {
        if (isMounted && data) {
          setCertData(data);
          if (data.registrationNumber) setModalRegNo(data.registrationNumber);
          if (data.issuingAuthority) setModalAuthority(data.issuingAuthority);
          if (data.registrationDate) setModalDate(data.registrationDate);
        }
      }).catch(err => {
        console.warn('Could not load NGO certificate:', err);
      });
    }
    return () => { isMounted = false; };
  }, [currentUser]);

  const handleModalFileSelect = (e) => {
    setModalError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setModalError('Only PDF files (.pdf) are supported.');
      setModalFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setModalError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 5 MB limit.`);
      setModalFile(null);
      return;
    }

    if (file.size === 0) {
      setModalError('The selected PDF file is empty (0 bytes).');
      setModalFile(null);
      return;
    }

    const formatted = file.size > 1048576 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    setModalFile(file);
    setModalFileName(file.name);
    setModalFileSize(formatted);
  };

  const handleUploadOrReplaceCertificate = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!modalRegNo.trim()) {
      setModalError('Please enter your registered organization number.');
      return;
    }
    if (!modalAuthority.trim()) {
      setModalError('Please enter the issuing authority or registry.');
      return;
    }
    if (!modalFile && !modalFileName) {
      setModalError('Please select a clear PDF copy of your registration certificate.');
      return;
    }
    if (!modalDeclaration) {
      setModalError('Please confirm the authorized submission declaration.');
      return;
    }

    setIsSubmittingCert(true);
    try {
      const updated = await BackendService.submitNgoRegistrationCertificate({
        ngoId: currentUser?.id || 'usr_ngo_user',
        orgName: currentUser?.name || 'Rescue NGO',
        registrationNumber: modalRegNo.trim(),
        issuingAuthority: modalAuthority.trim(),
        registrationDate: modalDate,
        orgAddress: currentUser?.location || 'Central Delhi Hub',
        city: 'New Delhi',
        state: 'Delhi',
        pinCode: '110001',
        authorizedRepresentative: currentUser?.contactPerson || 'Authorized Officer',
        officialEmail: currentUser?.email || 'dispatch@robinhoodarmy.com',
        officialPhone: '+91 11 2341 5500',
        originalFilename: modalFileName || 'NGO_Registration_Certificate.pdf',
        fileSizeFormatted: modalFileSize || '1.4 MB',
        status: 'pending_review',
        declarationConfirmed: true
      });

      if (modalFile) {
        try {
          await BackendService.uploadNgoCertificateToStorage(modalFile, currentUser?.id || 'usr_ngo_user');
        } catch (uErr) {
          console.warn('Storage upload note:', uErr);
        }
      }

      setCertData(updated);
      setIsCertModalOpen(false);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      if (showNotification) {
        showNotification('Registration certificate submitted! FeedAll compliance team will audit your document.', 'success');
      }
    } catch (err) {
      console.error('Error submitting replacement certificate:', err);
      setModalError('Failed to submit certificate. Please try again.');
    } finally {
      setIsSubmittingCert(false);
    }
  };

  const handleAcceptAndDispatch = async (match) => {
    // Remove from incoming feed optimistically
    setNgoMatches(prev => prev.filter(m => m.id !== match.id));

    const driverName = currentUser?.contactPerson 
      ? `${currentUser.contactPerson} (${currentUser.name})` 
      : "Mohit Verma (DL-1T-9021)";

    // Persist claim in Supabase database & create tracker
    const newTracker = await BackendService.claimAndDispatchMatch(match, {
      driver: driverName
    });

    if (newTracker) {
      setPickupTrackers(prev => [newTracker, ...prev]);
      setSelectedTracker(newTracker);
    }
    setActiveTab('tracker');

    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 }
    });

    showNotification(`Surplus batch claimed in Supabase! Van dispatched to ${match.hotelName}.`, 'success');
  };

  const advanceTrackerStep = async (trackerId) => {
    let nextStep = 0;
    let updatedSteps = [];

    setPickupTrackers(prev => prev.map(t => {
      if (t.id === trackerId) {
        nextStep = Math.min(t.currentStep + 1, 2);
        updatedSteps = t.steps.map((s, idx) => {
          if (idx < nextStep) return { ...s, status: 'completed' };
          if (idx === nextStep) return { ...s, status: 'active', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
          return s;
        });
        return {
          ...t,
          currentStep: nextStep,
          steps: updatedSteps
        };
      }
      return t;
    }));

    if (selectedTracker && selectedTracker.id === trackerId) {
      setSelectedTracker(prev => ({
        ...prev,
        currentStep: nextStep,
        steps: updatedSteps
      }));
    }

    // Persist tracker progression to Supabase
    await BackendService.updatePickupTrackerStep(trackerId, nextStep, updatedSteps);

    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.7 }
    });

    showNotification('Pickup telemetry step updated in Supabase database!', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. NGO PROFILE HEADER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-forest-900 text-white rounded-2xl shadow-md">
              <HeartHandshake className="w-8 h-8 text-brand-orange" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200">
                  Certified Rescue Organization
                </span>
                
                {/* NGO Registration Certificate Badge */}
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  certData?.status === 'approved' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : certData?.status === 'needs_correction'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  <FileCheck2 className="w-3.5 h-3.5 text-brand-orange" />
                  <span>
                    Reg: {certData?.registrationNumber || currentUser?.registrationNo || 'DL/2018/0192841'}
                  </span>
                  <span className="text-[10px] opacity-75 font-normal uppercase tracking-wider">
                    {certData?.status === 'approved' ? '• Verified Entity' : certData?.status === 'needs_correction' ? '• Correction Needed' : '• Audit Pending'}
                  </span>
                </span>
                
                <span className="text-xs text-slate-400 font-mono">
                  80G Certified
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-900 font-heading mt-1">
                {currentUser?.name || 'Robin Hood Army — Central Food Rescue Fleet'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUser?.location ? `Fleet Division • ${currentUser.location}` : 'Central Operations Hub • Connaught Place & Chanakyapuri Division • New Delhi'}
              </p>
            </div>
          </div>

          {/* Current Vehicle Capacity & Radius Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-forest-50 border border-forest-100 p-3 rounded-2xl">
              <div className="text-[10px] font-bold uppercase tracking-wider text-forest-700">
                Current Vehicle Capacity
              </div>
              <div className="text-sm font-extrabold text-forest-900 flex items-center gap-1.5 mt-0.5">
                <Truck className="w-4 h-4 text-brand-orange" />
                <span>2 Insulated Vans Available</span>
                <span className="text-xs text-forest-600 font-normal">• 650 kg Capacity</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Operating Radius
              </div>
              <div className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Navigation className="w-4 h-4 text-forest-700" />
                <span>12 km Radius</span>
              </div>
            </div>
          </div>

        </div>

        {/* View Switcher Tabs: Live Feed vs Pickup Tracker */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === 'feed'
                  ? 'bg-forest-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Live Match Feed</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-brand-orange text-white font-mono">
                {ngoMatches.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === 'tracker'
                  ? 'bg-forest-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-brand-orange" />
              <span>Active Pickup Tracker</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-forest-800 text-emerald-200 font-mono">
                {pickupTrackers.length}
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-brand-orange font-semibold">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>Timers synchronized in real time</span>
          </div>
        </div>
      </div>

      {/* 2. NGO REGISTRATION CERTIFICATE AUDIT STATUS SECTION */}
      <div className={`rounded-3xl p-6 border shadow-sm transition-all ${
        certData?.status === 'approved'
          ? 'bg-white border-emerald-200'
          : certData?.status === 'needs_correction'
          ? 'bg-rose-50/50 border-rose-200'
          : certData?.status === 'rejected'
          ? 'bg-rose-50 border-rose-300'
          : 'bg-amber-50/50 border-amber-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-2xl shrink-0 ${
              certData?.status === 'approved'
                ? 'bg-emerald-100 text-emerald-800'
                : certData?.status === 'needs_correction' || certData?.status === 'rejected'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              <FileCheck2 className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  NGO Registration Certificate
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  certData?.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : certData?.status === 'needs_correction'
                    ? 'bg-rose-100 text-rose-800'
                    : certData?.status === 'rejected'
                    ? 'bg-rose-200 text-rose-900'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {certData?.status === 'approved' && '✓ Approved'}
                  {certData?.status === 'pending_review' && '⏳ Pending Review'}
                  {certData?.status === 'needs_correction' && '⚠ Needs Correction'}
                  {certData?.status === 'rejected' && '✕ Rejected'}
                  {certData?.status === 'not_submitted' && 'Not Submitted'}
                </span>
              </div>

              {/* Status Descriptions & Feedback */}
              <div className="mt-1">
                {certData?.status === 'approved' && (
                  <p className="text-xs text-slate-700">
                    Your registration certificate has been reviewed and verified by the FeedAll compliance administration.
                  </p>
                )}
                {certData?.status === 'pending_review' && (
                  <p className="text-xs text-slate-700">
                    Your certificate has been submitted and is awaiting review. Our compliance team audits all registration documents within active operational hours.
                  </p>
                )}
                {certData?.status === 'needs_correction' && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-rose-800">
                      Please review the administrator's feedback and upload a corrected document.
                    </p>
                    {certData?.correctionRequested && (
                      <div className="text-xs p-2.5 rounded-xl bg-white border border-rose-200 text-rose-900 font-medium">
                        <strong>Administrator Feedback:</strong> {certData.correctionRequested}
                      </div>
                    )}
                  </div>
                )}
                {certData?.status === 'rejected' && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-rose-800">
                      Your document was not accepted. Review the available feedback and contact support if necessary.
                    </p>
                    {certData?.rejectionReason && (
                      <div className="text-xs p-2.5 rounded-xl bg-white border border-rose-200 text-rose-900 font-medium">
                        <strong>Reason:</strong> {certData.rejectionReason}
                      </div>
                    )}
                  </div>
                )}
                {certData?.status === 'not_submitted' && (
                  <p className="text-xs text-slate-700">
                    Upload your NGO registration certificate to begin verification.
                  </p>
                )}
              </div>

              {/* Document Metadata Badges */}
              <div className="mt-3 flex items-center gap-3 flex-wrap text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <FileText className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="font-semibold text-slate-800">{certData?.originalFilename || 'NGO_Registration_Certificate.pdf'}</span>
                  <span className="text-[10px] text-slate-400">({certData?.fileSizeFormatted || '1.4 MB'})</span>
                </div>
                <div className="text-slate-300">•</div>
                <div>
                  <span className="text-slate-400">Authority:</span> <span className="font-semibold text-slate-800">{certData?.issuingAuthority || 'Registrar of Societies'}</span>
                </div>
                <div className="text-slate-300">•</div>
                <div>
                  <span className="text-slate-400">Submitted:</span> <span className="font-semibold text-slate-800">{certData?.submittedAt ? new Date(certData.submittedAt).toLocaleDateString() : 'Active'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="shrink-0 flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setIsCertModalOpen(true)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                certData?.status === 'needs_correction'
                  ? 'bg-rose-700 hover:bg-rose-800 text-white animate-pulse'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-brand-orange" />
              <span>
                {certData?.status === 'needs_correction' 
                  ? 'Re-upload Corrected Certificate' 
                  : certData?.status === 'not_submitted' 
                  ? 'Upload Certificate' 
                  : 'Replace / Update Certificate'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. LIVE MATCH FEED TAB */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold font-heading text-forest-900">
                Incoming Geofenced Food Matches
              </h2>
              <p className="text-xs text-slate-500">
                Batches filtered to your 12km zone and refrigerated van capabilities.
              </p>
            </div>
            <span className="text-xs text-slate-500 font-medium bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              Showing <strong>{ngoMatches.length}</strong> available donations
            </span>
          </div>

          {ngoMatches.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">All Nearby Surplus Has Been Dispatched!</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Great job! All active corporate surplus matches in your zone are currently assigned. Check back shortly as banquets conclude.
              </p>
              <button
                onClick={() => setActiveTab('tracker')}
                className="mt-3 px-5 py-2 rounded-xl bg-forest-900 text-white text-xs font-bold hover:bg-forest-950 transition-colors"
              >
                View Active Delivery Tracker
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ngoMatches.map(match => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  onAcceptAndDispatch={handleAcceptAndDispatch} 
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. PICKUP TRACKER TAB (Vertical Stepper) */}
      {activeTab === 'tracker' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold font-heading text-forest-900">
                Live Cold-Chain Pickup & Delivery Tracker
              </h2>
              <p className="text-xs text-slate-500">
                End-to-end custody tracking from hotel kitchen dock to shelter dining hall.
              </p>
            </div>
          </div>

          {pickupTrackers.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">No Active Pickups in Progress</p>
              <p className="text-xs text-slate-400 mt-1">Accept an incoming match to launch the live telematics tracker.</p>
              <button
                onClick={() => setActiveTab('feed')}
                className="mt-4 px-5 py-2.5 bg-forest-900 text-white rounded-xl text-xs font-bold"
              >
                Go to Match Feed
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Tracker Selector List on Left */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Active Rescue Runs ({pickupTrackers.length})
                </span>
                {pickupTrackers.map(tracker => (
                  <div
                    key={tracker.id}
                    onClick={() => setSelectedTracker(tracker)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      selectedTracker?.id === tracker.id
                        ? 'bg-white border-forest-900 shadow-md ring-2 ring-forest-900/10'
                        : 'bg-white/70 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-forest-900">{tracker.id}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-brand-orange">
                        Step {tracker.currentStep + 1} of 3
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-800 mt-1">{tracker.hotelName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {tracker.quantityKg} kg • {tracker.category}
                    </div>
                  </div>
                ))}
              </div>

              {/* Vertical Stepper Detail on Right */}
              {selectedTracker && (
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                  
                  {/* Stepper Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-brand-orange">
                        MANIFEST #{selectedTracker.id}
                      </span>
                      <h3 className="text-xl font-bold font-heading text-forest-900">
                        {selectedTracker.hotelName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Batch: {selectedTracker.quantityKg} kg ({selectedTracker.portions} meals) • {selectedTracker.category}
                      </p>
                    </div>

                    {/* Step Advance Interactive Button */}
                    <div>
                      {selectedTracker.currentStep < 2 ? (
                        <button
                          onClick={() => advanceTrackerStep(selectedTracker.id)}
                          className="flex items-center gap-2 bg-forest-900 hover:bg-forest-950 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
                          <span>Advance Step ({selectedTracker.currentStep === 0 ? 'Mark Arrived' : 'Mark Collected'})</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Delivery Completed & Handed Over
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vertical Stepper Container */}
                  <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                    
                    {/* STEP 1: DISPATCHED */}
                    <div className="relative">
                      <div className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm transition-all ${
                        selectedTracker.currentStep >= 0 ? 'bg-forest-900 ring-4 ring-forest-100' : 'bg-slate-300'
                      }`}>
                        {selectedTracker.currentStep > 0 ? <Check className="w-3.5 h-3.5" /> : '1'}
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-forest-900 flex items-center gap-2">
                            Step 1: Vehicle Dispatched
                            {selectedTracker.currentStep > 0 && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-normal">
                                Completed
                              </span>
                            )}
                          </h4>
                          <span className="text-xs font-mono text-slate-400">16:15</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Temperature-controlled van departed from Central Rescue Depot.
                        </p>
                        <div className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-forest-800" />
                            <span className="font-semibold">Driver: Suresh Patil</span>
                            <span className="text-slate-400">(DL-1V-8902)</span>
                          </div>
                          <span className="text-forest-700 font-bold flex items-center gap-1">
                            <PhoneCall className="w-3 h-3" /> +91 98101 22345
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* STEP 2: ARRIVED */}
                    <div className="relative">
                      <div className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm transition-all ${
                        selectedTracker.currentStep >= 1 ? 'bg-forest-900 ring-4 ring-forest-100' : 'bg-slate-300'
                      }`}>
                        {selectedTracker.currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '2'}
                      </div>
                      <div className={`p-4 rounded-2xl border transition-all space-y-2 ${
                        selectedTracker.currentStep >= 1 ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/50 border-dashed border-slate-200 opacity-60'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-forest-900 flex items-center gap-2">
                            Step 2: Arrived at Hotel Loading Bay
                            {selectedTracker.currentStep === 1 && (
                              <span className="text-[10px] bg-brand-orange text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                                In Progress
                              </span>
                            )}
                            {selectedTracker.currentStep > 1 && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-normal">
                                Verified
                              </span>
                            )}
                          </h4>
                          <span className="text-xs font-mono text-slate-400">16:32</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Vehicle docked at Hotel Kitchen Service Bay 4. Cold-chain probe test performed.
                        </p>
                        <div className="bg-emerald-50 text-emerald-900 p-2.5 rounded-xl border border-emerald-200 text-xs font-medium flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <ThermometerSnowflake className="w-4 h-4 text-emerald-700" />
                            Core Temperature Audit: <strong>3.6°C</strong>
                          </span>
                          <span className="text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded">
                            FSSAI Safe Range (&lt; 4°C)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* STEP 3: COLLECTED */}
                    <div className="relative">
                      <div className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm transition-all ${
                        selectedTracker.currentStep === 2 ? 'bg-emerald-600 ring-4 ring-emerald-100' : 'bg-slate-300'
                      }`}>
                        {selectedTracker.currentStep === 2 ? <Check className="w-3.5 h-3.5" /> : '3'}
                      </div>
                      <div className={`p-4 rounded-2xl border transition-all space-y-2 ${
                        selectedTracker.currentStep === 2 ? 'bg-emerald-50/70 border-emerald-200' : 'bg-slate-50/50 border-dashed border-slate-200 opacity-60'
                      }`}>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-forest-900 flex items-center gap-2">
                            Step 3: Collected & En Route to Shelter
                            {selectedTracker.currentStep === 2 && (
                              <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                                Handover Complete
                              </span>
                            )}
                          </h4>
                          <span className="text-xs font-mono text-slate-400">16:48</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Digital OTP handover verified by Sous Chef. Food sealed and departing for final distribution.
                        </p>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Destination:</span>
                            <span className="font-bold text-forest-900">Jeevan Jyoti Shelter Home</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Beneficiaries:</span>
                            <span className="font-bold text-brand-orange">180 Children & Senior Residents</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* MODAL: UPLOAD / REPLACE NGO REGISTRATION CERTIFICATE */}
      {isCertModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-forest-950 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-brand-orange/20 rounded-xl">
                  <FileCheck2 className="w-5 h-5 text-brand-orange" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-heading">
                    {certData?.status === 'needs_correction' ? 'Upload Corrected Certificate' : 'NGO Registration Certificate'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Official statutory document audit for food rescue dispatch
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCertModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleUploadOrReplaceCertificate} className="p-6 space-y-4">
              
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Feedback Alert if correction needed */}
              {certData?.correctionRequested && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Reviewer Correction Feedback:
                  </span>
                  <p className="text-slate-700 font-medium">{certData.correctionRequested}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    NGO Registration Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalRegNo}
                    onChange={(e) => setModalRegNo(e.target.value)}
                    placeholder="e.g. DL/2018/0192841"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Registration Authority *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalAuthority}
                    onChange={(e) => setModalAuthority(e.target.value)}
                    placeholder="Registrar of Societies / MCA"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Registration Date
                </label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                />
              </div>

              {/* PDF Document Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Upload Registration Certificate (PDF) *
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Upload a clear, readable PDF of your organisation's registration certificate. Ensure that the organisation's name and registration details are visible. (Max 5 MB)
                </p>

                {modalFileName ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-brand-orange/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-5 h-5 text-rose-600 shrink-0" />
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-800 truncate">{modalFileName}</div>
                        <div className="text-[10px] text-slate-400">{modalFileSize || '1.4 MB'}</div>
                      </div>
                    </div>
                    <label className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer">
                      Change PDF
                      <input type="file" accept="application/pdf" onChange={handleModalFileSelect} className="hidden" />
                    </label>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-brand-orange bg-slate-50/50 hover:bg-orange-50/20 rounded-2xl p-5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all">
                    <UploadCloud className="w-6 h-6 text-brand-orange" />
                    <span className="text-xs font-bold text-slate-700">Choose PDF Document</span>
                    <span className="text-[10px] text-slate-400">PDF only, maximum file size 5 MB</span>
                    <input type="file" accept="application/pdf" onChange={handleModalFileSelect} className="hidden" />
                  </label>
                )}
              </div>

              {/* Declaration Checkbox */}
              <label className="flex items-start gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  required
                  checked={modalDeclaration}
                  onChange={(e) => setModalDeclaration(e.target.checked)}
                  className="mt-0.5 rounded text-forest-900 focus:ring-forest-900"
                />
                <span className="text-[11px] text-slate-600 leading-snug">
                  I confirm that the information provided relates to my organisation and that I am authorised to submit this document for verification.
                </span>
              </label>

              {/* Legal Notice */}
              <div className="text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <strong>Statutory Notice:</strong> This document verifies non-profit legal entity standing. An NGO registration certificate does not automatically prove food safety compliance or replace any legally required licence under the Food Safety and Standards Act.
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCertModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCert}
                  className="px-5 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-950 text-white text-xs font-bold shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingCert ? 'Uploading & Submitting...' : 'Submit for Verification'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
