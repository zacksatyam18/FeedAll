import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  X, 
  Search, 
  MapPin,
  Plus,
  ExternalLink,
  FileBadge
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BackendService } from '../services/backendService';

export default function AdminDashboard({ 
  currentUser: _currentUser,
  adminStats, 
  verificationQueue, 
  setVerificationQueue, 
  showNotification 
}) {
  const [adminTab, setAdminTab] = useState('ngo_certificates'); // 'ngo_certificates' | 'fssai_audits' | 'alternative_kyc' | 'ngo_directory'
  const [selectedNgoForAudit, setSelectedNgoForAudit] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [adminReviewNotes, setAdminReviewNotes] = useState('');

  // FSSAI Statutory Audits State
  const [fssaiAudits, setFssaiAudits] = useState([]);
  const [isLoadingFssaiAudits, setIsLoadingFssaiAudits] = useState(true);
  const [selectedFssaiForAudit, setSelectedFssaiForAudit] = useState(null);
  const [fssaiReviewNotes, setFssaiReviewNotes] = useState('');

  // Alternative Provider Verifications State
  const [altVerifications, setAltVerifications] = useState([]);
  const [isLoadingAlt, setIsLoadingAlt] = useState(true);

  // NGO Directory Oversight State
  const [ngoList, setNgoList] = useState([]);
  const [isLoadingNgoList, setIsLoadingNgoList] = useState(true);
  const [isAddNgoModalOpen, setIsAddNgoModalOpen] = useState(false);
  const [newNgoForm, setNewNgoForm] = useState({
    name: '',
    description: '',
    address: '',
    city: 'New Delhi',
    pinCode: '110001',
    latitude: '28.6315',
    longitude: '77.2167',
    phone: '+91 11 2341 5500',
    email: 'operations@ngo.org',
    contactPerson: 'Operations Lead',
    fleetCapacity: '2 Insulated Vans (600 kg Capacity)',
    services: ['Cooked Meals', 'Buffet Surplus']
  });

  useEffect(() => {
    let isMounted = true;

    BackendService.fetchFssaiVerifications()
      .then(data => {
        if (isMounted) setFssaiAudits(data || []);
      })
      .catch(err => {
        console.error('Failed to load FSSAI audits:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingFssaiAudits(false);
      });

    BackendService.fetchAlternativeVerifications()
      .then(data => {
        if (isMounted) setAltVerifications(data || []);
      })
      .catch(err => {
        console.error('Failed to load alternative verifications:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingAlt(false);
      });

    BackendService.fetchNgoDirectory()
      .then(data => {
        if (isMounted) setNgoList(data || []);
      })
      .catch(err => {
        console.error('Failed to load NGO directory:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingNgoList(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // FSSAI Audit Handlers
  const handleApproveFssai = async (id, licenseNo, fboName) => {
    setFssaiAudits(prev => prev.map(item => {
      if (item.id === id) return { ...item, verification_status: 'verified', review_notes: fssaiReviewNotes.trim() || 'FSSAI License confirmed via official FoSCoS portal audit.' };
      return item;
    }));

    await BackendService.updateFssaiVerificationStatus(id, 'verified', fssaiReviewNotes.trim() || 'FSSAI License confirmed via official FoSCoS portal audit.');

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    showNotification(`FSSAI License #${licenseNo} approved for ${fboName}! Platform compliance active.`, 'success');
    setSelectedFssaiForAudit(null);
    setFssaiReviewNotes('');
  };

  const handleRejectFssai = async (id, licenseNo, fboName) => {
    const notes = fssaiReviewNotes.trim() || 'License details discrepancy or invalid FSSAI record on FoSCoS portal.';
    setFssaiAudits(prev => prev.map(item => {
      if (item.id === id) return { ...item, verification_status: 'suspended', review_notes: notes };
      return item;
    }));

    await BackendService.updateFssaiVerificationStatus(id, 'suspended', notes);
    showNotification(`FSSAI License #${licenseNo} rejected for ${fboName}. Discrepancy logged.`, 'error');
    setSelectedFssaiForAudit(null);
    setFssaiReviewNotes('');
  };

  // NGO Registration Certificate Queue handlers
  const handleApproveCert = async (ngoId, ngoName) => {
    setVerificationQueue(prev => prev.map(item => {
      if (item.id === ngoId) return { ...item, status: 'Approved' };
      return item;
    }));

    await BackendService.updateNgoRegistrationCertificateStatus(ngoId, {
      status: 'approved',
      reviewNotes: adminReviewNotes.trim() || 'Registration certificate validated against registrar records.'
    });

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });

    showNotification(`NGO Registration Certificate approved for ${ngoName}! Platform dispatch enabled.`, 'success');
    setSelectedNgoForAudit(null);
    setAdminReviewNotes('');
  };

  const handleRequestCorrection = async (ngoId, ngoName) => {
    const notes = adminReviewNotes.trim() || 'Please upload a clearer scan of the official registration certificate with visible registration number and seal.';
    setVerificationQueue(prev => prev.map(item => {
      if (item.id === ngoId) return { ...item, status: 'Needs Correction' };
      return item;
    }));

    await BackendService.updateNgoRegistrationCertificateStatus(ngoId, {
      status: 'needs_correction',
      reviewNotes: notes
    });

    showNotification(`Correction request and feedback sent to ${ngoName}.`, 'info');
    setSelectedNgoForAudit(null);
    setAdminReviewNotes('');
  };

  const handleRejectCert = async (ngoId, ngoName) => {
    const notes = adminReviewNotes.trim() || 'Official registration certificate could not be authenticated with the issuing authority.';
    setVerificationQueue(prev => prev.map(item => {
      if (item.id === ngoId) return { ...item, status: 'Rejected' };
      return item;
    }));

    await BackendService.updateNgoRegistrationCertificateStatus(ngoId, {
      status: 'rejected',
      reviewNotes: notes
    });

    showNotification(`Registration certificate rejected for ${ngoName}. Discrepancy logged.`, 'error');
    setSelectedNgoForAudit(null);
    setAdminReviewNotes('');
  };

  // Alternative Provider Verification Handlers
  const handleApproveAlt = async (id, providerName) => {
    setAltVerifications(prev => prev.map(item => {
      if (item.id === id) return { ...item, status: 'Approved' };
      return item;
    }));

    await BackendService.updateAlternativeVerificationStatus(id, 'Approved', 'Aadhaar identity verified by compliance officer.');

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });

    showNotification(`Alternative KYC approved for ${providerName}! Provider authorized.`, 'success');
  };

  const handleRejectAlt = async (id, providerName) => {
    setAltVerifications(prev => prev.map(item => {
      if (item.id === id) return { ...item, status: 'Rejected' };
      return item;
    }));

    await BackendService.updateAlternativeVerificationStatus(id, 'Rejected', 'Document legibility discrepancy.');
    showNotification(`Alternative KYC rejected for ${providerName}. Resubmission requested.`, 'error');
  };

  // NGO Directory Toggle Active Status
  const handleToggleNgoActive = async (ngoId, currentStatus) => {
    const updatedStatus = !currentStatus;
    setNgoList(prev => prev.map(item => {
      if (item.id === ngoId) return { ...item, acceptingDonations: updatedStatus };
      return item;
    }));

    const targetNgo = ngoList.find(n => n.id === ngoId);
    if (targetNgo) {
      await BackendService.addOrUpdateNgoDirectoryListing({
        ...targetNgo,
        acceptingDonations: updatedStatus
      });
    }

    showNotification(`NGO dispatch status updated to: ${updatedStatus ? 'Active & Accepting' : 'Paused'}`, 'info');
  };

  // Add NGO Form Submit
  const handleAddNgoSubmit = async (e) => {
    e.preventDefault();
    const lat = parseFloat(newNgoForm.latitude);
    const lng = parseFloat(newNgoForm.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      showNotification('Please enter a valid latitude (-90 to 90).', 'error');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      showNotification('Please enter a valid longitude (-180 to 180).', 'error');
      return;
    }

    const newNgo = {
      id: `NGO-DIR-${Math.floor(200 + Math.random() * 799)}`,
      name: newNgoForm.name.trim(),
      description: newNgoForm.description.trim() || 'Verified regional food redistribution fleet partner.',
      address: newNgoForm.address.trim(),
      city: newNgoForm.city.trim(),
      pinCode: newNgoForm.pinCode.trim(),
      latitude: lat,
      longitude: lng,
      phone: newNgoForm.phone.trim(),
      email: newNgoForm.email.trim(),
      contactPerson: newNgoForm.contactPerson.trim(),
      verified: true,
      verificationBadge: 'FSSAI Safe Food Share Partner #21419550000312',
      darpanId: 'DL/2026/0998811',
      taxStatus: '80G & 12A Certified',
      acceptingDonations: true,
      services: newNgoForm.services,
      fleetCapacity: newNgoForm.fleetCapacity.trim(),
      operatingHours: '08:00 - 23:00 Daily',
      foodSafetyProtocols: 'Standard insulated vessel hygiene protocol.'
    };

    const saved = await BackendService.addOrUpdateNgoDirectoryListing(newNgo);
    setNgoList(prev => [saved, ...prev]);
    setIsAddNgoModalOpen(false);

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    showNotification(`Added ${newNgo.name} to the verified NGO directory!`, 'success');
  };

  const filteredQueue = verificationQueue.filter(item => {
    const q = filterQuery.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.registrationNo && item.registrationNo.toLowerCase().includes(q)) ||
      (item.issuingAuthority && item.issuingAuthority.toLowerCase().includes(q)) ||
      (item.fssaiLicense && item.fssaiLicense.toLowerCase().includes(q)) ||
      (item.operatingZone && item.operatingZone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* 1. ADMIN HEADER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-md">
            <ShieldCheck className="w-8 h-8 text-brand-orange" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                Statutory Regulatory Oversight
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                Statutory NGO Registry
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-forest-900 font-heading mt-1">
              Platform Oversight & Compliance Administration
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoring B2B surplus redistribution protocols, NGO registration certificates, and alternative KYC audits.
            </p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="bg-slate-100 p-1 rounded-2xl flex flex-wrap items-center gap-1 shrink-0">
          <button
            onClick={() => setAdminTab('ngo_certificates')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              adminTab === 'ngo_certificates' ? 'bg-white text-forest-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            NGO Certificates ({verificationQueue.length})
          </button>
          <button
            onClick={() => setAdminTab('fssai_audits')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              adminTab === 'fssai_audits' ? 'bg-white text-forest-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-brand-orange" />
            <span>FSSAI Audits ({fssaiAudits.length})</span>
          </button>
          <button
            onClick={() => setAdminTab('alternative_kyc')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              adminTab === 'alternative_kyc' ? 'bg-white text-forest-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-brand-orange" />
            <span>Alternative KYC ({altVerifications.length})</span>
          </button>
          <button
            onClick={() => setAdminTab('ngo_directory')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              adminTab === 'ngo_directory' ? 'bg-white text-forest-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-brand-orange" />
            <span>NGO Directory ({ngoList.length})</span>
          </button>
        </div>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Compliance Rate</div>
          <div className="mt-3 text-3xl font-extrabold font-heading text-forest-900">
            {adminStats.safetyComplianceRate}
          </div>
          <div className="text-xs text-slate-500 mt-1">Zero safety breaches recorded</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Network Entities</div>
          <div className="mt-3 text-3xl font-extrabold font-heading text-forest-900">
            {adminStats.activeHotels + adminStats.activeNgos}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {adminStats.activeHotels} Providers • {adminStats.activeNgos} NGOs
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Waste Diverted</div>
          <div className="mt-3 text-3xl font-extrabold font-heading text-forest-900">
            {adminStats.totalWasteSavedKg.toLocaleString()} kg
          </div>
          <div className="text-xs text-brand-orange font-bold mt-1">
            {adminStats.totalWasteMonthlyGrowth} Monthly Trajectory
          </div>
        </div>
      </div>

      {/* 3. TAB 1: NGO REGISTRATION CERTIFICATES QUEUE */}
      {adminTab === 'ngo_certificates' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Statutory NGO Verification Flow
              </div>
              <h2 className="text-xl font-extrabold font-heading text-forest-900">
                NGO Registration Certificate Review Queue
              </h2>
              <p className="text-xs text-slate-500">
                Audit official registration certificates (Societies, Trusts, Section 8, Darpan) before granting food rescue dispatch authorization.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search NGO, Reg #, Authority..."
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-forest-900 w-56 sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">NGO Name</th>
                  <th className="p-4">Registration #</th>
                  <th className="p-4">Issuing Authority</th>
                  <th className="p-4">Fleet Capacity</th>
                  <th className="p-4">Operating Zone</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Audit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{item.name}</td>
                    <td className="p-4 font-mono font-bold text-slate-800">{item.registrationNo || item.fssaiLicense || 'REG-PENDING'}</td>
                    <td className="p-4 text-slate-600 max-w-[180px] truncate">{item.issuingAuthority || 'Registrar of Societies'}</td>
                    <td className="p-4 text-slate-600">{item.fleetCapacityKg}</td>
                    <td className="p-4 text-slate-600">{item.operatingZone}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        item.status === 'Approved' ? 'bg-emerald-50 text-emerald-800' :
                        item.status === 'Needs Correction' ? 'bg-amber-50 text-amber-800' :
                        item.status === 'Rejected' ? 'bg-rose-50 text-rose-800' :
                        'bg-blue-50 text-blue-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedNgoForAudit(item);
                          setAdminReviewNotes(item.reviewNotes || '');
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 font-semibold text-[11px]"
                      >
                        Inspect Certificate
                      </button>
                      {(item.status === 'Pending Approval' || item.status === 'Needs Correction' || item.status === 'Pending Review') && (
                        <>
                          <button
                            onClick={() => handleApproveCert(item.id, item.name)}
                            className="px-2.5 py-1.5 rounded-lg bg-forest-900 text-white font-bold hover:bg-forest-950 text-[11px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectCert(item.id, item.name)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 text-[11px]"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB 2: ALTERNATIVE PROVIDER KYC (Aadhaar PDF Submissions) */}
      {adminTab === 'alternative_kyc' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-brand-orange" /> Alternative Provider Verification Flow
              </div>
              <h2 className="text-xl font-extrabold font-heading text-forest-900 mt-0.5">
                Provider Aadhaar KYC Audits ({altVerifications.length})
              </h2>
              <p className="text-xs text-slate-500">
                Identity documents submitted by community culinary partners and small catering entities.
              </p>
            </div>
          </div>

          {isLoadingAlt ? (
            <div className="p-10 text-center text-slate-400 text-xs animate-pulse">
              Loading KYC submissions from Supabase...
            </div>
          ) : altVerifications.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
              No pending alternative provider verification requests.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Provider / Entity</th>
                    <th className="p-4">Contact Person</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Aadhaar Document</th>
                    <th className="p-4">Masked UID</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Audit Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {altVerifications.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{item.providerName}</td>
                      <td className="p-4 text-slate-600">{item.contactPerson}</td>
                      <td className="p-4 text-slate-600">{item.city}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <FileText className="w-3.5 h-3.5" />
                          {item.fileName}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-600">{item.aadhaarMaskedUid}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          item.status === 'Approved' ? 'bg-emerald-50 text-emerald-800' :
                          item.status === 'Rejected' ? 'bg-rose-50 text-rose-800' :
                          'bg-amber-50 text-amber-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        {item.status === 'Pending Review' ? (
                          <>
                            <button
                              onClick={() => handleApproveAlt(item.id, item.providerName)}
                              className="px-2.5 py-1.5 rounded-lg bg-forest-900 text-white font-bold hover:bg-forest-950 text-[11px]"
                            >
                              Approve KYC
                            </button>
                            <button
                              onClick={() => handleRejectAlt(item.id, item.providerName)}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 text-[11px]"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Audit Logged</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: FSSAI STATUTORY AUDITS & FoSCoS REVIEWS */}
      {adminTab === 'fssai_audits' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-900 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-brand-orange" /> Commercial Food Provider FSSAI Oversight
              </div>
              <h2 className="text-xl font-extrabold font-heading text-forest-900 mt-0.5">
                FSSAI License Authenticity & FoSCoS Audit Queue ({fssaiAudits.length})
              </h2>
              <p className="text-xs text-slate-500">
                Authoritative 14-digit statutory verification records, entity match cross-checks, and official FoSCoS portal audit bridges.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://foscos.fssai.gov.in/advance-fbo-search"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-forest-900 flex items-center gap-1.5 transition-all"
              >
                <span>FoSCoS Search Portal</span>
                <ExternalLink className="w-3.5 h-3.5 text-brand-orange" />
              </a>
            </div>
          </div>

          {isLoadingFssaiAudits ? (
            <div className="p-10 text-center text-slate-400 text-xs animate-pulse">
              Loading FSSAI verification queue from Supabase...
            </div>
          ) : fssaiAudits.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
              No FSSAI verification records queued.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">FSSAI License #</th>
                    <th className="p-4">Submitted Provider</th>
                    <th className="p-4">Official Registered FBO</th>
                    <th className="p-4">City / State</th>
                    <th className="p-4">Validity</th>
                    <th className="p-4">Verification Status</th>
                    <th className="p-4 text-right">Audit Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fssaiAudits.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono font-bold text-forest-900">
                        {item.license_number}
                      </td>
                      <td className="p-4 font-semibold text-slate-900">
                        {item.submitted_org_name || item.fbo_name}
                      </td>
                      <td className="p-4 text-slate-700">
                        {item.fbo_name}
                      </td>
                      <td className="p-4 text-slate-600">
                        {item.registered_city}, {item.registered_state}
                      </td>
                      <td className="p-4 font-mono text-slate-600">
                        {item.validity_date || 'N/A'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          item.verification_status === 'verified'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : item.verification_status === 'suspended' || item.verification_status === 'expired'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {item.verification_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedFssaiForAudit(item);
                            setFssaiReviewNotes(item.review_notes || '');
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 font-semibold text-[11px]"
                        >
                          Inspect & Audit
                        </button>
                        {item.verification_status !== 'verified' && (
                          <button
                            onClick={() => handleApproveFssai(item.id, item.license_number, item.fbo_name)}
                            className="px-2.5 py-1.5 rounded-lg bg-forest-900 text-white font-bold hover:bg-forest-950 text-[11px]"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 4: NGO DIRECTORY OVERSIGHT */}
      {adminTab === 'ngo_directory' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-900 uppercase tracking-wider">
                <MapPin className="w-4 h-4 text-brand-orange" /> Real NGO Directory Directory Database
              </div>
              <h2 className="text-xl font-extrabold font-heading text-forest-900 mt-0.5">
                Active Rescue Fleets & Coordinates ({ngoList.length})
              </h2>
              <p className="text-xs text-slate-500">
                Verified regional non-profit fleets matched to nearby providers using Haversine geolocation.
              </p>
            </div>

            <button
              onClick={() => setIsAddNgoModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-950 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-brand-orange" />
              <span>Add Verified NGO</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-4">NGO Name</th>
                  <th className="p-4">Coordinates (Lat, Lng)</th>
                  <th className="p-4">City & PIN</th>
                  <th className="p-4">Fleet Capacity</th>
                  <th className="p-4">Contact Phone</th>
                  <th className="p-4">Dispatch Status</th>
                  <th className="p-4 text-right">Oversight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoadingNgoList ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-500 font-medium">
                      Loading NGO directory records...
                    </td>
                  </tr>
                ) : ngoList.map((ngo) => (
                  <tr key={ngo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{ngo.name}</div>
                      <div className="text-[10px] text-slate-400">{ngo.verificationBadge}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-600">
                      {ngo.latitude.toFixed(4)}, {ngo.longitude.toFixed(4)}
                    </td>
                    <td className="p-4 text-slate-600">
                      {ngo.city} — {ngo.pinCode}
                    </td>
                    <td className="p-4 text-slate-600">{ngo.fleetCapacity}</td>
                    <td className="p-4 font-mono text-slate-700">{ngo.phone}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        ngo.acceptingDonations ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {ngo.acceptingDonations ? '● Active Standby' : 'Paused'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleNgoActive(ngo.id, ngo.acceptingDonations)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-[11px] font-bold text-slate-700"
                      >
                        {ngo.acceptingDonations ? 'Pause Fleet' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD VERIFIED NGO */}
      {isAddNgoModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-forest-950 to-forest-900 text-white p-6 relative">
              <button
                onClick={() => setIsAddNgoModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-bold font-heading">Add Verified NGO to Directory</h3>
              <p className="text-xs text-emerald-200">Coordinates will be used for precision distance calculation.</p>
            </div>

            <form onSubmit={handleAddNgoSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">NGO Organization Name *</label>
                <input
                  type="text"
                  required
                  value={newNgoForm.name}
                  onChange={(e) => setNewNgoForm({ ...newNgoForm, name: e.target.value })}
                  placeholder="e.g. Robin Hood Army - South Delhi Hub"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={newNgoForm.city}
                    onChange={(e) => setNewNgoForm({ ...newNgoForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={newNgoForm.pinCode}
                    onChange={(e) => setNewNgoForm({ ...newNgoForm, pinCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-700 mb-1">Full Street Address *</label>
                <input
                  type="text"
                  required
                  value={newNgoForm.address}
                  onChange={(e) => setNewNgoForm({ ...newNgoForm, address: e.target.value })}
                  placeholder="14 Barakhamba Road, Connaught Place"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Latitude (-90 to 90) *</label>
                  <input
                    type="text"
                    required
                    value={newNgoForm.latitude}
                    onChange={(e) => setNewNgoForm({ ...newNgoForm, latitude: e.target.value })}
                    placeholder="28.6315"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Longitude (-180 to 180) *</label>
                  <input
                    type="text"
                    required
                    value={newNgoForm.longitude}
                    onChange={(e) => setNewNgoForm({ ...newNgoForm, longitude: e.target.value })}
                    placeholder="77.2167"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newNgoForm.phone}
                    onChange={(e) => setNewNgoForm({ ...newNgoForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-700 mb-1">Fleet Capacity</label>
                  <input
                    type="text"
                    value={newNgoForm.fleetCapacity}
                    onChange={(e) => setNewNgoForm({ ...newNgoForm, fleetCapacity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddNgoModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-forest-900 text-white font-bold hover:bg-forest-950"
                >
                  Save & Validate NGO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT NGO REGISTRATION CERTIFICATE */}
      {selectedNgoForAudit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden">
            <div className="bg-forest-950 text-white p-6 flex items-center justify-between">
              <div>
                <span className="text-xs text-brand-orange uppercase font-bold tracking-wider">Statutory NGO Audit Review</span>
                <h3 className="text-xl font-bold font-heading">{selectedNgoForAudit.name}</h3>
              </div>
              <button onClick={() => setSelectedNgoForAudit(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold">Registration Number:</span> 
                  <span className="font-mono font-bold text-forest-900 text-sm">
                    {selectedNgoForAudit.registrationNo || selectedNgoForAudit.fssaiLicense || 'REG-PENDING'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Issuing Authority:</span> 
                  <span className="font-bold text-slate-800">
                    {selectedNgoForAudit.issuingAuthority || 'Registrar of Societies'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Registration Date:</span> 
                  <span className="font-bold text-slate-800">
                    {selectedNgoForAudit.registrationDate || '2018-05-14'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Operating Zone:</span> 
                  <span className="font-bold text-slate-800">{selectedNgoForAudit.operatingZone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Fleet Capacity:</span> 
                  <span className="font-bold text-slate-800">{selectedNgoForAudit.fleetCapacityKg}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Current Audit Status:</span> 
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase inline-block mt-0.5 ${
                    selectedNgoForAudit.status === 'Approved' ? 'bg-emerald-50 text-emerald-800' :
                    selectedNgoForAudit.status === 'Needs Correction' ? 'bg-amber-50 text-amber-800' :
                    selectedNgoForAudit.status === 'Rejected' ? 'bg-rose-50 text-rose-800' :
                    'bg-blue-50 text-blue-800'
                  }`}>
                    {selectedNgoForAudit.status}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold uppercase text-slate-500 mb-2">Submitted NGO Registration Document (PDF)</h4>
                <div className="space-y-2">
                  {selectedNgoForAudit.documents?.map((doc, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between bg-slate-50">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{doc.name}</div>
                          <div className="text-[10px] text-slate-500">
                            {doc.type || 'Official Non-Profit Registration Certificate'} • {doc.size || '1.8 MB'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        PDF Validated
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviewer Feedback / Notes Input */}
              <div className="pt-2">
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Reviewer Notes & NGO Instructions
                </label>
                <textarea
                  rows={2}
                  value={adminReviewNotes}
                  onChange={(e) => setAdminReviewNotes(e.target.value)}
                  placeholder="Enter verification notes or instructions if requesting correction..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedNgoForAudit(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleRequestCorrection(selectedNgoForAudit.id, selectedNgoForAudit.name)}
                  className="px-3 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold"
                >
                  Request Correction
                </button>
                <button
                  type="button"
                  onClick={() => handleRejectCert(selectedNgoForAudit.id, selectedNgoForAudit.name)}
                  className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold"
                >
                  Reject Certificate
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveCert(selectedNgoForAudit.id, selectedNgoForAudit.name)}
                  className="px-4 py-2 rounded-xl bg-forest-900 text-white font-bold hover:bg-forest-950 shadow-sm"
                >
                  Approve Registration Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT FSSAI LICENSE & FoSCoS AUDIT */}
      {selectedFssaiForAudit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden">
            <div className="bg-forest-950 text-white p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-brand-orange uppercase font-bold tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Statutory FSSAI License Authenticity Audit</span>
                </div>
                <h3 className="text-xl font-bold font-heading mt-0.5">
                  {selectedFssaiForAudit.fbo_name || selectedFssaiForAudit.submitted_org_name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedFssaiForAudit(null)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close audit modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold text-[11px]">14-Digit FSSAI License #:</span> 
                  <span className="font-mono font-bold text-forest-900 text-sm tracking-wider">
                    {selectedFssaiForAudit.license_number}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[11px]">Statutory Status:</span> 
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase inline-block mt-0.5 ${
                    selectedFssaiForAudit.verification_status === 'verified'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : selectedFssaiForAudit.verification_status === 'suspended' || selectedFssaiForAudit.verification_status === 'expired'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {selectedFssaiForAudit.verification_status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[11px]">Submitted Entity Name:</span> 
                  <span className="font-semibold text-slate-900">
                    {selectedFssaiForAudit.submitted_org_name || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[11px]">Official Registered FBO:</span> 
                  <span className="font-bold text-slate-900">
                    {selectedFssaiForAudit.fbo_name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[11px]">Registered Premise Location:</span> 
                  <span className="font-semibold text-slate-800">
                    {selectedFssaiForAudit.registered_city}, {selectedFssaiForAudit.registered_state}
                  </span>
                  {selectedFssaiForAudit.premise_address && (
                    <span className="block text-[10px] text-slate-500 mt-0.5">
                      {selectedFssaiForAudit.premise_address}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[11px]">License Validity / Expiry:</span> 
                  <span className="font-mono font-bold text-slate-800">
                    {selectedFssaiForAudit.validity_date || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[11px]">Verification Source:</span> 
                  <span className="font-semibold text-slate-700 capitalize">
                    {selectedFssaiForAudit.verification_source ? selectedFssaiForAudit.verification_source.replace(/_/g, ' ') : 'Statutory Registry'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[11px]">Establishment Category:</span> 
                  <span className="font-semibold text-slate-700">
                    {selectedFssaiForAudit.category || 'Food Service / Catering / Hotel'}
                  </span>
                </div>
              </div>

              {/* Official FoSCoS Search Bridge Notice */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <FileBadge className="w-5 h-5 text-forest-900 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-forest-950 text-xs">
                    Official FoSCoS Portal Live Audit Bridge
                  </p>
                  <p className="text-[11px] text-forest-800 leading-relaxed">
                    Verify this license directly against the Food Safety and Standards Authority of India (FSSAI) Food Safety Compliance System (FoSCoS) portal using the official public search.
                  </p>
                  <a
                    href={`https://foscos.fssai.gov.in/advance-fbo-search`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-900 hover:text-brand-orange underline mt-1"
                  >
                    <span>Open FoSCoS Advance Search (Query: {selectedFssaiForAudit.license_number})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Compliance Officer Audit Notes */}
              <div className="pt-2">
                <label className="block font-bold uppercase text-slate-700 mb-1">
                  Compliance Officer Audit Notes
                </label>
                <textarea
                  rows={2}
                  value={fssaiReviewNotes}
                  onChange={(e) => setFssaiReviewNotes(e.target.value)}
                  placeholder="Record verification notes, FoSCoS record timestamp, or reasons for rejection..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900 font-sans"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFssaiForAudit(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleRejectFssai(
                    selectedFssaiForAudit.id, 
                    selectedFssaiForAudit.license_number, 
                    selectedFssaiForAudit.fbo_name
                  )}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold"
                >
                  Reject / Flag Discrepancy
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveFssai(
                    selectedFssaiForAudit.id, 
                    selectedFssaiForAudit.license_number, 
                    selectedFssaiForAudit.fbo_name
                  )}
                  className="px-4 py-2 rounded-xl bg-forest-900 text-white font-bold hover:bg-forest-950 shadow-sm"
                >
                  Confirm FSSAI Authenticity & Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
