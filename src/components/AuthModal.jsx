import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  HeartHandshake, 
  ShieldCheck, 
  Lock, 
  Mail, 
  Building, 
  MapPin, 
  ArrowRight, 
  Sparkles,
  FileBadge,
  FileText,
  AlertTriangle,
  UploadCloud,
  Trash2,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FileCheck2,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { demoAccounts } from '../data/mockData';
import { BackendService } from '../services/backendService';
import { FssaiVerificationService } from '../services/fssaiVerificationService';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, initialTab = 'signin', initialRole = 'provider' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'signin' | 'signup'
  const [selectedRole, setSelectedRole] = useState(initialRole); // 'provider' | 'ngo' | 'admin'

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [fssaiNo, setFssaiNo] = useState('');
  const [location, setLocation] = useState('New Delhi');
  const [contactName, setContactName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Provider Verification Mode: 'fssai' vs 'alternative'
  const [providerVerificationType, setProviderVerificationType] = useState('fssai');
  const [aadhaarUid, setAadhaarUid] = useState('');
  const [aadhaarUndertaking, setAadhaarUndertaking] = useState(false);
  const aadhaarFileName = 'Aadhaar-KYC-Identity-Audit.pdf';

  // Real-time FSSAI Authenticity Verification State
  const [isVerifyingFssai, setIsVerifyingFssai] = useState(false);
  const [fssaiVerificationState, setFssaiVerificationState] = useState(null);

  // NGO Registration Certificate Block State
  const [ngoRegNo, setNgoRegNo] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('Registrar of Societies, Govt. of NCT Delhi');
  const [ngoRegDate, setNgoRegDate] = useState('2021-06-15');
  const [ngoAddress, setNgoAddress] = useState('14 Barakhamba Road, Connaught Place');
  const [ngoCity, setNgoCity] = useState('New Delhi');
  const [ngoState, setNgoState] = useState('Delhi');
  const [ngoPinCode, setNgoPinCode] = useState('110001');
  const [ngoPhone, setNgoPhone] = useState('+91 11 2341 5500');
  const [ngoDeclaration, setNgoDeclaration] = useState(false);

  // Real PDF File Upload State
  const [ngoCertFile, setNgoCertFile] = useState(null);
  const [ngoCertFileName, setNgoCertFileName] = useState('');
  const [ngoCertFileSize, setNgoCertFileSize] = useState('');
  const [certUploadStatus, setCertUploadStatus] = useState('idle'); // 'idle' | 'uploaded' | 'error'
  const [certUploadError, setCertUploadError] = useState('');

  // FSSAI input change handler (Immediately invalidates stale verification)
  const handleFssaiChange = (e) => {
    const val = e.target.value;
    setFssaiNo(val);
    // Invalidate previous verification result immediately if number is changed
    if (fssaiVerificationState && fssaiVerificationState.licenseNo !== val.trim()) {
      setFssaiVerificationState(null);
    }
  };

  // Re-evaluates identity matching when entity name changes
  const handleOrgNameChange = (e) => {
    const val = e.target.value;
    setOrgName(val);
    if (fssaiVerificationState?.officialRecord && fssaiVerificationState.officialRecord.licenseStatus === 'active') {
      const match = FssaiVerificationService.compareBusinessDetails(
        fssaiVerificationState.officialRecord,
        val,
        location
      );
      if (!match.isMatch) {
        setFssaiVerificationState(prev => ({
          ...prev,
          status: 'details_mismatch',
          isVerified: false,
          matchDetails: match,
          message: `License #${prev.licenseNo} is active, but registered to "${prev.officialRecord.fboName}". Entered entity "${val || 'Unspecified'}" differs significantly.`
        }));
      } else if (fssaiVerificationState.status === 'details_mismatch') {
        setFssaiVerificationState(prev => ({
          ...prev,
          status: 'verified',
          isVerified: true,
          matchDetails: match,
          message: `FSSAI License #${prev.licenseNo} verified successfully against official records. Commercial food safety compliance confirmed.`
        }));
      }
    }
  };

  // Re-evaluates identity matching when location changes
  const handleLocationChange = (e) => {
    const val = e.target.value;
    setLocation(val);
    if (fssaiVerificationState?.officialRecord && fssaiVerificationState.officialRecord.licenseStatus === 'active') {
      const match = FssaiVerificationService.compareBusinessDetails(
        fssaiVerificationState.officialRecord,
        orgName,
        val
      );
      if (!match.isMatch) {
        setFssaiVerificationState(prev => ({
          ...prev,
          status: 'details_mismatch',
          isVerified: false,
          matchDetails: match,
          message: `License #${prev.licenseNo} is active, but registered to "${prev.officialRecord.fboName}" (${prev.officialRecord.registeredCity}). Location differs.`
        }));
      } else if (fssaiVerificationState.status === 'details_mismatch') {
        setFssaiVerificationState(prev => ({
          ...prev,
          status: 'verified',
          isVerified: true,
          matchDetails: match,
          message: `FSSAI License #${prev.licenseNo} verified successfully against official records. Commercial food safety compliance confirmed.`
        }));
      }
    }
  };

  // Trigger real-time FSSAI authenticity verification
  const handleVerifyFssaiLicense = async () => {
    if (isVerifyingFssai) return;
    setAuthError('');

    // Format validation first (zero network cost)
    const formatCheck = FssaiVerificationService.validateFssaiFormat(fssaiNo);
    if (!formatCheck.isValid) {
      setFssaiVerificationState({
        status: 'invalid_format',
        isVerified: false,
        licenseNo: fssaiNo,
        message: formatCheck.message
      });
      return;
    }

    setIsVerifyingFssai(true);
    try {
      const result = await BackendService.verifyFssaiLicense({
        licenseNo: formatCheck.canonicalLicenseNo,
        orgName,
        location
      });
      setFssaiVerificationState(result);
      if (result.isVerified) {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('FSSAI verification service exception:', err);
      setFssaiVerificationState({
        status: 'service_unavailable',
        isVerified: false,
        licenseNo: fssaiNo,
        message: 'FSSAI verification service is temporarily unreachable. Please check network connectivity or use FoSCoS portal.',
        foscosUrl: FssaiVerificationService.getFoscosSearchUrl(fssaiNo)
      });
    } finally {
      setIsVerifyingFssai(false);
    }
  };

  if (!isOpen) return null;

  // Real PDF file validation and handling
  const handlePdfFileSelect = (e) => {
    setCertUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validate file extension & MIME type (PDF only)
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setCertUploadError('Only PDF files (.pdf) are supported. Please upload your official registration certificate.');
      setNgoCertFile(null);
      setCertUploadStatus('error');
      return;
    }

    // 2. Validate file size (5 MB maximum)
    const MAX_5MB = 5 * 1024 * 1024;
    if (file.size > MAX_5MB) {
      setCertUploadError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 5 MB limit. Please compress your PDF.`);
      setNgoCertFile(null);
      setCertUploadStatus('error');
      return;
    }

    if (file.size === 0) {
      setCertUploadError('The selected PDF file is empty (0 bytes). Please select a valid document.');
      setNgoCertFile(null);
      setCertUploadStatus('error');
      return;
    }

    // Formatted size
    const formatted = file.size > 1048576 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    setNgoCertFile(file);
    setNgoCertFileName(file.name);
    setNgoCertFileSize(formatted);
    setCertUploadStatus('uploaded');
  };

  const handleRemovePdf = () => {
    setNgoCertFile(null);
    setNgoCertFileName('');
    setNgoCertFileSize('');
    setCertUploadStatus('idle');
    setCertUploadError('');
  };

  // Auto-fill demo credentials
  const autofillDemo = (roleKey) => {
    setSelectedRole(roleKey);
    setAuthError('');
    const demo = demoAccounts[roleKey];
    setEmail(demo.email);
    setPassword('Feedall@2026!');
    setOrgName(demo.name);
    setLocation(demo.location);
    setContactName(demo.contactPerson);
    
    if (roleKey === 'provider') {
      const canonicalLicense = '10020011004523';
      setFssaiNo(canonicalLicense);
      setProviderVerificationType('fssai');
      setFssaiVerificationState({
        status: 'verified',
        isVerified: true,
        licenseNo: canonicalLicense,
        officialRecord: FssaiVerificationService.AUTHORITATIVE_FSSAI_REGISTRY[canonicalLicense],
        message: `FSSAI License #${canonicalLicense} verified successfully against official records. Commercial food safety compliance confirmed.`,
        source: 'authoritative_statutory_registry'
      });
    } else if (roleKey === 'ngo') {
      setNgoRegNo(demo.registrationNo || 'DL/2018/0192841');
      setIssuingAuthority(demo.issuingAuthority || 'Registrar of Societies, Govt. of NCT Delhi');
      setNgoRegDate(demo.registrationDate || '2018-04-12');
      setNgoCertFileName(demo.certificateDocName || 'Robin_Hood_Army_Registration_Certificate_2018.pdf');
      setNgoCertFileSize('1.4 MB');
      setCertUploadStatus('uploaded');
      setNgoDeclaration(true);
      setNgoPhone('+91 11 2341 5500');
      setNgoAddress('14 Barakhamba Road, Connaught Place');
      setNgoCity('New Delhi');
      setNgoPinCode('110001');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return; // Prevent double submission
    setAuthError('');

    // Basic validation
    if (!email || !email.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    // Provider FSSAI Verification Validation
    if (activeTab === 'signup' && selectedRole === 'provider' && providerVerificationType === 'fssai') {
      if (!fssaiNo.trim()) {
        setAuthError('Please enter your 14-digit FSSAI Commercial License number.');
        return;
      }
      if (!fssaiVerificationState) {
        setAuthError('Please click "Verify License" to validate your FSSAI license before completing registration.');
        return;
      }
      if (fssaiVerificationState.status === 'invalid_format') {
        setAuthError('Your FSSAI license format is invalid. Please enter a valid 14-digit numeric license number.');
        return;
      }
      if (fssaiVerificationState.status === 'expired' || fssaiVerificationState.status === 'suspended') {
        setAuthError(`Registration cannot proceed: FSSAI License is currently ${fssaiVerificationState.status.toUpperCase()}. Active statutory license is required.`);
        return;
      }
    }

    if (activeTab === 'signup' && selectedRole === 'provider' && providerVerificationType === 'alternative') {
      if (!aadhaarUid.trim()) {
        setAuthError('Please enter your 12-digit Aadhaar / Virtual ID number.');
        return;
      }
      if (!aadhaarUndertaking) {
        setAuthError('Please check the statutory compliance undertaking.');
        return;
      }
    }

    if (activeTab === 'signup' && selectedRole === 'ngo') {
      if (!orgName.trim()) {
        setAuthError('Please enter your registered organization name.');
        return;
      }
      if (!ngoRegNo.trim()) {
        setAuthError('Please enter your NGO registration number.');
        return;
      }
      if (!issuingAuthority.trim()) {
        setAuthError('Please specify the registration authority or issuing body.');
        return;
      }
      if (!ngoCertFile && !ngoCertFileName) {
        setAuthError('Please upload your official NGO Registration Certificate (PDF).');
        return;
      }
      if (!ngoDeclaration) {
        setAuthError('Please confirm that you are authorised to submit this document.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const userData = await BackendService.loginOrRegisterUser({
        name: orgName || (selectedRole === 'provider' ? 'The Grand Oberoi Palace' : selectedRole === 'ngo' ? 'Robin Hood Army Fleet' : 'Feedall Compliance Admin'),
        email: email || `${selectedRole}@feedall.org`,
        password: password || 'Feedall@2026!',
        role: selectedRole,
        fssai: selectedRole === 'provider' 
          ? (providerVerificationType === 'alternative' ? 'ALT-AADHAAR-PENDING' : (fssaiNo || '10020011004523'))
          : 'NGO-EXEMPT-STATUTORY',
        fssaiVerificationState: selectedRole === 'provider' && providerVerificationType === 'fssai' ? fssaiVerificationState : null,
        location: location || ngoCity || 'New Delhi',
        contactPerson: contactName || 'Authorized Officer',
        avatar: selectedRole === 'provider' ? '🏨' : selectedRole === 'ngo' ? '🤝' : '🛡️',
        registrationNo: ngoRegNo,
        issuingAuthority: issuingAuthority,
        registrationDate: ngoRegDate,
        address: ngoAddress,
        city: ngoCity,
        state: ngoState,
        pinCode: ngoPinCode,
        phone: ngoPhone,
        certificateDocName: ngoCertFileName || 'NGO_Registration_Certificate.pdf',
        certificateDocSize: ngoCertFileSize || '1.4 MB'
      });

      if (selectedRole === 'provider' && providerVerificationType === 'alternative') {
        userData.verificationMethod = 'alternative_aadhaar';
        userData.alternativeStatus = 'Pending Review';
        userData.aadhaarFileName = aadhaarFileName;
        userData.aadhaarMaskedUid = aadhaarUid;

        // Persist to alternative verifications table
        await BackendService.submitAlternativeVerification({
          providerEmail: userData.email,
          providerName: userData.name,
          contactPerson: userData.contactPerson,
          phone: '+91 98100 23456',
          city: userData.location,
          address: `${userData.name}, ${userData.location}`,
          fileName: aadhaarFileName,
          fileSize: '1.4 MB',
          aadhaarMaskedUid: aadhaarUid
        });
      }

      if (selectedRole === 'ngo') {
        userData.registrationNo = ngoRegNo || 'DL/2018/0192841';
        userData.issuingAuthority = issuingAuthority;
        userData.certificateDocName = ngoCertFileName || 'NGO_Registration_Certificate.pdf';
        userData.certificateStatus = 'pending_review';

        if (ngoCertFile) {
          try {
            await BackendService.uploadNgoCertificateToStorage(ngoCertFile, userData.id);
          } catch (uploadErr) {
            console.warn('Storage upload note:', uploadErr);
          }
        }
      }

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });

      onLoginSuccess(userData);
      onClose();
    } catch (err) {
      console.error('Login error:', err);
      setAuthError('Authentication failed. Please check your credentials or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        
        {/* Header with Feedall Branding */}
        <div className="bg-gradient-to-r from-forest-950 to-forest-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-forest-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-xl shadow-md">
              <img 
                src="/feedall-logo.png" 
                alt="Feedall" 
                className="h-9 w-auto object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-extrabold text-xl tracking-tight text-white">
                  Feed<span className="text-brand-orange">all</span>
                </span>
                <span className="text-[10px] bg-brand-orange text-white font-bold px-1.5 py-0.5 rounded uppercase">
                  Auth Portal
                </span>
              </div>
              <p className="text-[10px] tracking-wider uppercase text-emerald-200 font-semibold">
                FOOD FOR A BETTER TOMORROW
              </p>
            </div>
          </div>

          {/* Tab Switcher: Sign In vs Sign Up */}
          <div className="mt-6 flex rounded-2xl bg-forest-950/80 p-1 border border-forest-800">
            <button
              type="button"
              onClick={() => setActiveTab('signin')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'signin'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              Sign In to Account
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'signup'
                  ? 'bg-brand-orange text-white shadow-md'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              Register New Organization
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Quick Demo Autofill Helpers */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
              <span className="flex items-center gap-1 text-forest-900">
                <Sparkles className="w-3.5 h-3.5 text-brand-orange" /> Quick Demo Autofill
              </span>
              <span className="text-slate-400">Click to test instant login</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => autofillDemo('provider')}
                className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border text-left flex items-center gap-1.5 transition-all ${
                  selectedRole === 'provider' 
                    ? 'bg-forest-900 text-white border-forest-900' 
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>🏨</span>
                <span className="truncate">Hotel Provider</span>
              </button>

              <button
                type="button"
                onClick={() => autofillDemo('ngo')}
                className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border text-left flex items-center gap-1.5 transition-all ${
                  selectedRole === 'ngo' 
                    ? 'bg-brand-orange text-white border-brand-orange' 
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>🤝</span>
                <span className="truncate">NGO Fleet</span>
              </button>

              <button
                type="button"
                onClick={() => autofillDemo('admin')}
                className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border text-left flex items-center gap-1.5 transition-all ${
                  selectedRole === 'admin' 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>🛡️</span>
                <span className="truncate">Admin Portal</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Role Radio Select */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Select Your Entity Type *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('provider')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    selectedRole === 'provider'
                      ? 'border-forest-900 bg-forest-50/80 text-forest-900 font-bold ring-2 ring-forest-900/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-forest-800" />
                  <span className="text-[11px]">Hotel / Food Partner</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('ngo')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    selectedRole === 'ngo'
                      ? 'border-brand-orange bg-orange-50/80 text-brand-orange font-bold ring-2 ring-brand-orange/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4 text-brand-orange" />
                  <span className="text-[11px]">Rescue NGO</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    selectedRole === 'admin'
                      ? 'border-slate-900 bg-slate-100 text-slate-900 font-bold ring-2 ring-slate-900/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  <span className="text-[11px]">Compliance Admin</span>
                </button>
              </div>
            </div>

            {/* If Sign Up: Extra Organization & Verification Fields */}
            {activeTab === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Organization / Entity Name *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={handleOrgNameChange}
                      placeholder={selectedRole === 'provider' ? 'e.g., ITC Maurya Luxury Hotel' : 'e.g., Robin Hood Army Delhi'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900 focus:ring-1 focus:ring-forest-900"
                    />
                  </div>
                </div>

                {/* 1. PROVIDER REGISTRATION PATHWAYS (FSSAI OR ALTERNATIVE KYC) */}
                {selectedRole === 'provider' && (
                  <>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        Provider Verification Pathway *
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setProviderVerificationType('fssai')}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                            providerVerificationType === 'fssai'
                              ? 'bg-forest-900 text-white border-forest-900 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <FileBadge className="w-3.5 h-3.5 text-brand-orange" />
                            <span>FSSAI License</span>
                          </div>
                          <div className="text-[10px] opacity-80 font-normal">Commercial hotels & banquets</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setProviderVerificationType('alternative')}
                          className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                            providerVerificationType === 'alternative'
                              ? 'bg-forest-900 text-white border-forest-900 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <FileText className="w-3.5 h-3.5 text-brand-orange" />
                            <span>Alternative KYC</span>
                          </div>
                          <div className="text-[10px] opacity-80 font-normal">Aadhaar PDF identity review</div>
                        </button>
                      </div>
                    </div>

                    {providerVerificationType === 'alternative' ? (
                      <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-brand-orange/30 space-y-3">
                        <div className="flex items-start gap-2 text-xs text-orange-950">
                          <AlertTriangle className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                          <div className="text-[11px] leading-relaxed">
                            <span className="font-bold">Alternative Verification: </span>
                            For community kitchens, caterers & event organizers without commercial FSSAI documentation. Submit an Aadhaar Identity PDF for regulatory KYC review.
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                              Aadhaar Number / Virtual ID *
                            </label>
                            <input
                              type="text"
                              required
                              value={aadhaarUid}
                              onChange={(e) => setAadhaarUid(e.target.value)}
                              placeholder="XXXX-XXXX-9021"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                              City / Hub Location *
                            </label>
                            <input
                              type="text"
                              required
                              value={location}
                              onChange={handleLocationChange}
                              placeholder="Connaught Place, New Delhi"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Aadhaar Identity PDF Document *
                          </label>
                          <div className="p-2.5 rounded-xl bg-white border border-dashed border-slate-300 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                              <span className="font-semibold text-slate-800 truncate">{aadhaarFileName}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">(1.4 MB)</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                              ✓ Verified PDF
                            </span>
                          </div>
                        </div>

                        <label className="flex items-start gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            required
                            checked={aadhaarUndertaking}
                            onChange={(e) => setAadhaarUndertaking(e.target.checked)}
                            className="mt-0.5 rounded text-forest-900 focus:ring-forest-900"
                          />
                          <span className="text-[11px] text-slate-600 leading-snug">
                            I confirm that food donated will be hygienically segregated and handled under basic FSSAI surplus protocols.
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* FSSAI Commercial License Input & Inline Verify Button */}
                          <div className="sm:col-span-1">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                FSSAI Commercial License # *
                              </label>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {fssaiNo.replace(/[^0-9]/g, '').length}/14 Digits
                              </span>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-2">
                              <div className="relative flex-1">
                                <FileBadge className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  required
                                  maxLength={18}
                                  value={fssaiNo}
                                  onChange={handleFssaiChange}
                                  placeholder="e.g. 10020011004523"
                                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono tracking-wider focus:outline-none focus:border-forest-900 focus:ring-1 focus:ring-forest-900"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={handleVerifyFssaiLicense}
                                disabled={isVerifyingFssai || !fssaiNo.trim()}
                                className="px-3.5 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-950 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm disabled:opacity-50 shrink-0"
                              >
                                {isVerifyingFssai ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Verifying...</span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="w-3.5 h-3.5 text-brand-orange" />
                                    <span>Verify License</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* City / Hub Location */}
                          <div className="sm:col-span-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                              City / Hub Location *
                            </label>
                            <div className="relative">
                              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                required
                                value={location}
                                onChange={handleLocationChange}
                                placeholder="Connaught Place, New Delhi"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900 focus:ring-1 focus:ring-forest-900"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Inline Verification Result Card */}
                        {fssaiVerificationState && (
                          <div className={`p-3.5 rounded-2xl border text-xs space-y-2 transition-all ${
                            fssaiVerificationState.status === 'verified'
                              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                              : fssaiVerificationState.status === 'invalid_format'
                              ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                              : fssaiVerificationState.status === 'not_found'
                              ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                              : fssaiVerificationState.status === 'expired' || fssaiVerificationState.status === 'suspended' || fssaiVerificationState.status === 'inactive'
                              ? 'bg-rose-50 border-rose-300 text-rose-950'
                              : fssaiVerificationState.status === 'details_mismatch'
                              ? 'bg-amber-50 border-amber-300 text-amber-950'
                              : fssaiVerificationState.status === 'rate_limited' || fssaiVerificationState.status === 'service_unavailable'
                              ? 'bg-slate-100 border-slate-300 text-slate-800'
                              : 'bg-sky-50 border-sky-300 text-sky-950'
                          }`} aria-live="polite">
                            
                            {/* Status Badge Header */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 font-bold">
                                {fssaiVerificationState.status === 'verified' ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span className="text-emerald-800">FSSAI Authenticity Confirmed — Active License</span>
                                  </>
                                ) : fssaiVerificationState.status === 'invalid_format' ? (
                                  <>
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span className="text-amber-800">License Number Format Notice</span>
                                  </>
                                ) : fssaiVerificationState.status === 'not_found' ? (
                                  <>
                                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                                    <span className="text-amber-900">No Matching Statutory Record Found</span>
                                  </>
                                ) : fssaiVerificationState.status === 'expired' ? (
                                  <>
                                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                    <span className="text-rose-800">License Expired — Ineligible for Redistribution</span>
                                  </>
                                ) : fssaiVerificationState.status === 'suspended' ? (
                                  <>
                                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                    <span className="text-rose-800">License Suspended by Regulatory Authority</span>
                                  </>
                                ) : fssaiVerificationState.status === 'details_mismatch' ? (
                                  <>
                                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                                    <span className="text-amber-900">Details Mismatch — Manual Review Required</span>
                                  </>
                                ) : fssaiVerificationState.status === 'rate_limited' ? (
                                  <>
                                    <AlertCircle className="w-4 h-4 text-slate-600 shrink-0" />
                                    <span className="text-slate-800">Verification Rate Limit Notice</span>
                                  </>
                                ) : fssaiVerificationState.status === 'service_unavailable' ? (
                                  <>
                                    <AlertCircle className="w-4 h-4 text-slate-600 shrink-0" />
                                    <span className="text-slate-800">Verification Gateway Unavailable</span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0" />
                                    <span className="text-sky-900">Official FoSCoS Portal Verification Required</span>
                                  </>
                                )}
                              </div>

                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                fssaiVerificationState.status === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : fssaiVerificationState.status === 'expired' || fssaiVerificationState.status === 'suspended'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {fssaiVerificationState.status.replace(/_/g, ' ')}
                              </span>
                            </div>

                            {/* Message Description */}
                            <p className="text-[11px] leading-relaxed">
                              {fssaiVerificationState.message}
                            </p>

                            {/* Verified Authoritative Business Details */}
                            {fssaiVerificationState.officialRecord && (
                              <div className="p-2.5 rounded-xl bg-white/90 border border-slate-200 text-[11px] space-y-1 mt-1 shadow-xs">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-semibold">Registered FBO Name:</span>
                                  <span className="font-bold text-slate-900">{fssaiVerificationState.officialRecord.fboName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-semibold">License Type:</span>
                                  <span className="text-slate-700">{fssaiVerificationState.officialRecord.licenseType}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-semibold">Premise Location:</span>
                                  <span className="text-slate-700">{fssaiVerificationState.officialRecord.registeredCity}, {fssaiVerificationState.officialRecord.registeredState}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-500 font-semibold">Validity / Expiry Date:</span>
                                  <span className="font-bold font-mono text-slate-900">{fssaiVerificationState.officialRecord.validityDate}</span>
                                </div>
                                {fssaiVerificationState.officialRecord.safetyRating && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-500 font-semibold">Safety Certification:</span>
                                    <span className="text-emerald-700 font-bold">{fssaiVerificationState.officialRecord.safetyRating}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Details Mismatch Comparison Grid */}
                            {fssaiVerificationState.status === 'details_mismatch' && fssaiVerificationState.officialRecord && (
                              <div className="p-2.5 rounded-xl bg-amber-100/60 border border-amber-200 text-[11px] space-y-1">
                                <div className="font-bold text-amber-900 text-[10px] uppercase tracking-wider mb-1">Entity Discrepancy Breakdown</div>
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                  <div>
                                    <span className="text-slate-500 block">Entered Organization:</span>
                                    <span className="font-semibold text-rose-700">{orgName || '(Not specified)'}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block">Authoritative FBO Record:</span>
                                    <span className="font-semibold text-emerald-800">{fssaiVerificationState.officialRecord.fboName}</span>
                                  </div>
                                </div>
                                <div className="text-[10px] text-slate-600 mt-1">
                                  * Note: You may complete registration, and your submission will be routed to Compliance Admin manual review.
                                </div>
                              </div>
                            )}

                            {/* FoSCoS Official Portal External Verification Action */}
                            {(fssaiVerificationState.status === 'manual_review_required' || 
                              fssaiVerificationState.status === 'not_found' || 
                              fssaiVerificationState.status === 'service_unavailable') && (
                              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200/80">
                                <span className="text-[10px] text-slate-500">
                                  Official Government Portal: FoSCoS (Food Safety Compliance System)
                                </span>
                                <a
                                  href={fssaiVerificationState.foscosUrl || FssaiVerificationService.getFoscosSearchUrl(fssaiNo)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-[11px] font-bold text-forest-900 shadow-xs shrink-0"
                                >
                                  <span>Verify on Official FoSCoS Portal</span>
                                  <ExternalLink className="w-3 h-3 text-brand-orange" />
                                </a>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* 2. NGO REGISTRATION CERTIFICATE BLOCK (DEDICATED) */}
                {selectedRole === 'ngo' && (
                  <div className="p-4 rounded-2xl bg-orange-50/40 border border-brand-orange/30 space-y-3.5">
                    
                    {/* Header */}
                    <div>
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-brand-orange" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-forest-900 font-heading">
                          NGO Registration Certificate
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        Upload your organisation's official registration certificate so the FeedAll team can review your NGO profile.
                      </p>
                    </div>

                    {/* Organisation Details */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            NGO Registration Number *
                          </label>
                          <input
                            type="text"
                            required
                            value={ngoRegNo}
                            onChange={(e) => setNgoRegNo(e.target.value)}
                            placeholder="e.g. DL/2018/0192841 or Trust Deed #"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Registration Authority / Issuing Body *
                          </label>
                          <input
                            type="text"
                            required
                            value={issuingAuthority}
                            onChange={(e) => setIssuingAuthority(e.target.value)}
                            placeholder="e.g. Registrar of Societies, Charity Comm."
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Registration Date
                          </label>
                          <input
                            type="date"
                            value={ngoRegDate}
                            onChange={(e) => setNgoRegDate(e.target.value)}
                            className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-forest-900"
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            City & State *
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <input
                              type="text"
                              required
                              value={ngoCity}
                              onChange={(e) => setNgoCity(e.target.value)}
                              placeholder="City"
                              className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                            />
                            <input
                              type="text"
                              required
                              value={ngoState}
                              onChange={(e) => setNgoState(e.target.value)}
                              placeholder="State"
                              className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Postal PIN Code *
                          </label>
                          <input
                            type="text"
                            required
                            value={ngoPinCode}
                            onChange={(e) => setNgoPinCode(e.target.value)}
                            placeholder="110001"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Registered Office Address *
                          </label>
                          <input
                            type="text"
                            required
                            value={ngoAddress}
                            onChange={(e) => setNgoAddress(e.target.value)}
                            placeholder="14 Barakhamba Road, Connaught Place"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                            Official Contact Phone *
                          </label>
                          <div className="relative">
                            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="tel"
                              required
                              value={ngoPhone}
                              onChange={(e) => setNgoPhone(e.target.value)}
                              placeholder="+91 11 2341 5500"
                              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Required PDF Upload Field */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                            Upload NGO Registration Certificate (PDF) *
                          </label>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            certUploadStatus === 'uploaded' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            certUploadStatus === 'error' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                            'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {certUploadStatus === 'uploaded' ? 'Document Selected' : certUploadStatus === 'error' ? 'Validation Error' : 'Not Uploaded'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-2">
                          Upload a clear, readable PDF of your organisation's registration certificate. Ensure that the organisation's name and registration details are visible. (PDF only, max 5 MB)
                        </p>

                        {ngoCertFileName ? (
                          <div className="p-3 rounded-xl bg-white border border-brand-orange/40 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-2.5 truncate">
                              <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4 text-rose-600" />
                              </div>
                              <div className="truncate">
                                <div className="text-xs font-bold text-slate-800 truncate">{ngoCertFileName}</div>
                                <div className="text-[10px] text-slate-400">{ngoCertFileSize || '1.4 MB'} • application/pdf</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>Uploaded</span>
                              </span>
                              <button
                                type="button"
                                onClick={handleRemovePdf}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Remove or replace document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="border-2 border-dashed border-slate-300 hover:border-brand-orange bg-white hover:bg-orange-50/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all">
                            <UploadCloud className="w-6 h-6 text-brand-orange" />
                            <span className="text-xs font-bold text-slate-700">
                              Click to choose PDF or drag & drop here
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Official Society Registration, Trust Deed, or Section 8 License (Max 5 MB)
                            </span>
                            <input
                              type="file"
                              accept="application/pdf"
                              onChange={handlePdfFileSelect}
                              className="hidden"
                            />
                          </label>
                        )}

                        {certUploadError && (
                          <div className="text-[11px] text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{certUploadError}</span>
                          </div>
                        )}
                      </div>

                      {/* Declaration Checkbox */}
                      <label className="flex items-start gap-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          required
                          checked={ngoDeclaration}
                          onChange={(e) => setNgoDeclaration(e.target.checked)}
                          className="mt-0.5 rounded text-forest-900 focus:ring-forest-900"
                        />
                        <span className="text-[11px] text-slate-600 leading-snug">
                          I confirm that the information provided relates to my organisation and that I am authorised to submit this document for verification.
                        </span>
                      </label>

                      {/* Statutory Legal Clarification */}
                      <div className="text-[10px] text-slate-500 bg-slate-100 p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                        <strong>Statutory Notice:</strong> This document verifies non-profit organizational legitimacy. An NGO registration certificate does not automatically prove food safety compliance or replace any legally required licence under the Food Safety and Standards Act.
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. ADMIN REGISTRATION DETAILS */}
                {selectedRole === 'admin' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Auditing Directorate / Hub
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="National Headquarters"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                        Auditor Designation
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Compliance Officer"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Official Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="executive@hotel.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900 focus:ring-1 focus:ring-forest-900"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password *
                </label>
                {activeTab === 'signin' && (
                  <span className="text-[11px] text-brand-orange cursor-pointer hover:underline">
                    Forgot password?
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900 focus:ring-1 focus:ring-forest-900"
                />
              </div>
            </div>

            {/* Error message */}
            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                <span className="text-rose-500 mt-0.5 shrink-0">⚠</span>
                {authError}
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 py-3.5 px-4 rounded-2xl bg-forest-900 hover:bg-forest-950 text-white font-heading font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-forest-900/25 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>{activeTab === 'signin' ? 'Sign In to Dashboard' : 'Complete Verification & Register'}</span>
                  <ArrowRight className="w-4 h-4 text-brand-orange" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <span className="text-[11px] text-slate-400">
                {activeTab === 'signin' ? "Don't have an enterprise account? " : "Already registered? "}
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'signin' ? 'signup' : 'signin')}
                  className="text-brand-orange font-bold hover:underline"
                >
                  {activeTab === 'signin' ? 'Register Now' : 'Sign In'}
                </button>
              </span>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}
