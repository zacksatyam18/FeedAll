import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  ShieldCheck,
  Heart,
  Copy,
  Check,
  ExternalLink,
  X,
  Server,
  Lock,
  Zap,
  Building2,
  Mail,
  Sparkles,
  QrCode
} from 'lucide-react';

const PRESET_AMOUNTS = [
  { label: '₹250', value: 250, desc: '1 Day Database & SSL' },
  { label: '₹500', value: 500, desc: 'API & Cold-Chain Sync' },
  { label: '₹1,000', value: 1000, desc: '1 Week Server Hosting' },
  { label: '₹2,500', value: 2500, desc: 'Security & DDoS Shield' },
  { label: '₹5,000', value: 5000, desc: 'Monthly Infrastructure' }
];

export default function AdminDonationModal({ isOpen, onClose, showNotification }) {
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [activeTab, setActiveTab] = useState('upi'); // 'upi' | 'corporate'
  const canvasRef = useRef(null);

  const upiId = 'feedall.admin@upi';
  const payeeName = 'FeedAll Platform Admin Fund';
  const finalAmount = isCustom ? (parseFloat(customAmount) || 0) : selectedAmount;

  // Build UPI URI
  const upiUrl = finalAmount > 0
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent('Platform Maintenance and Security Donation')}`
    : `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&cu=INR&tn=${encodeURIComponent('Platform Maintenance and Security Donation')}`;

  // Generate QR Code dynamically
  useEffect(() => {
    if (!isOpen) return;

    QRCode.toDataURL(upiUrl, {
      width: 280,
      margin: 1.5,
      color: {
        dark: '#0a3d24', // forest green theme
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then(url => {
        setQrDataUrl(url);
      })
      .catch(err => {
        console.error('Failed to generate QR code', err);
      });
  }, [isOpen, upiUrl]);

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    if (showNotification) {
      showNotification('UPI ID copied to clipboard: ' + upiId, 'success');
    }
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Emerald Gradient */}
        <div className="relative bg-gradient-to-r from-forest-900 via-forest-800 to-emerald-800 text-white p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Admin Platform & Security Maintenance Fund</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
            Help Us Keep FeedAll Secure & Running
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-xl">
            FeedAll is a community-driven surplus food redistribution initiative. 
            Your generous contributions directly fund our 24/7 cloud servers, database encryption, 
            FSSAI verification APIs, and platform security.
          </p>

          {/* Quick tab switch */}
          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upi')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'upi'
                  ? 'bg-white text-forest-900 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan UPI QR Code</span>
            </button>
            <button
              onClick={() => setActiveTab('corporate')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'corporate'
                  ? 'bg-white text-forest-900 shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Company / CSR Support</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 max-h-[75vh] overflow-y-auto">
          {activeTab === 'upi' ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* QR Code Presentation Box */}
              <div className="md:col-span-6 flex flex-col items-center text-center bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-inner">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-forest-800 uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-brand-orange" />
                  Instant UPI Scan
                </div>

                {/* QR Canvas / Image Wrapper */}
                <div className="relative p-3 bg-white rounded-2xl border-2 border-forest-200 shadow-md">
                  {qrDataUrl ? (
                    <img 
                      src={qrDataUrl} 
                      alt="Donation UPI QR Code" 
                      className="w-48 h-48 sm:w-56 sm:h-56 rounded-lg object-contain mx-auto"
                    />
                  ) : (
                    <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 text-xs">
                      Generating QR Code...
                    </div>
                  )}

                  {/* FeedAll Logo Stamp in Center */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-white shadow-lg border border-forest-200 flex items-center justify-center p-1">
                      <span className="text-[10px] font-extrabold text-forest-900 font-heading">FeedAll</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-xs font-semibold text-slate-700">
                  {finalAmount > 0 ? `Amount: ₹${finalAmount.toLocaleString('en-IN')}` : 'Any Contribution'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Works with Google Pay, PhonePe, Paytm, BHIM & all UPI apps
                </div>

                {/* Direct UPI Mobile Link */}
                <div className="mt-3 w-full flex flex-col gap-2">
                  <a
                    href={upiUrl}
                    className="sm:hidden w-full py-2 px-3 rounded-xl bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open UPI App on Phone
                  </a>

                  {/* Copy UPI ID */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200 text-xs w-full">
                    <div className="text-left truncate font-mono text-[11px] text-slate-700 select-all font-semibold pl-1">
                      {upiId}
                    </div>
                    <button
                      onClick={handleCopyUpi}
                      className="px-2.5 py-1 rounded-lg bg-forest-50 hover:bg-forest-100 text-forest-800 font-semibold text-[11px] flex items-center gap-1 transition-colors flex-shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-600" />
                          <span>Copy UPI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Amount Selection & Security Breakdown */}
              <div className="md:col-span-6 flex flex-col justify-between h-full space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                    Select Contribution Amount
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_AMOUNTS.map((amt) => (
                      <button
                        key={amt.value}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amt.value);
                          setIsCustom(false);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          !isCustom && selectedAmount === amt.value
                            ? 'bg-forest-50 border-forest-600 ring-2 ring-forest-600/20 text-forest-950 font-bold'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="text-sm font-extrabold text-forest-900">{amt.label}</div>
                        <div className="text-[10px] text-slate-500 truncate">{amt.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount Field */}
                  <div className="mt-3">
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="Enter other custom amount"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setIsCustom(true);
                        }}
                        className={`w-full pl-8 pr-3 py-2 rounded-xl border text-xs text-slate-800 transition-all outline-none ${
                          isCustom
                            ? 'border-forest-600 ring-2 ring-forest-600/20 bg-forest-50/30'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Transparent Impact Cards */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    How We Allocate Every Rupee
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-forest-800 flex-shrink-0">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[11px] leading-tight">
                      <span className="font-bold text-forest-900">35% Security & Encryption:</span> 256-bit SSL certificates, automated vulnerability audits, and DDoS protection.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800 flex-shrink-0">
                      <Server className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[11px] leading-tight">
                      <span className="font-bold text-forest-900">40% Cloud Hosting:</span> High-availability PostgreSQL database and edge server uptime.
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                    <div className="p-1.5 rounded-lg bg-orange-100 text-brand-orange flex-shrink-0">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-[11px] leading-tight">
                      <span className="font-bold text-forest-900">25% FSSAI Verification APIs:</span> Validating licenses in real-time to guarantee food donor compliance.
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            /* Corporate / Company Donation Flow */
            <div className="space-y-5">
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Building2 className="w-4 h-4 text-amber-700" />
                  Corporate Sponsorship & CSR Partnership
                </div>
                <p className="mt-1.5 text-xs text-amber-800/90 leading-relaxed">
                  Hotels, food corporations, tech companies, and CSR foundations can partner directly with the FeedAll Admin Team to sponsor regional cold-chain clusters, server infrastructure, or NGO onboarding drives.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-800">Direct Bank Transfer (NEFT / RTGS)</div>
                  <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-600">
                    <div><span className="text-slate-400">Account:</span> FeedAll Platform Admin Fund</div>
                    <div><span className="text-slate-400">A/C No:</span> 982301928401</div>
                    <div><span className="text-slate-400">IFSC:</span> HDFC0001248</div>
                    <div><span className="text-slate-400">Branch:</span> New Delhi Tech Hub</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs font-bold text-slate-800">Official Contact & Invoicing</div>
                  <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                    Need an official receipt, CSR compliance documentation, or custom sponsorship package?
                  </p>
                  <a
                    href="mailto:admin@feedall.org?subject=FeedAll%20Corporate%20Sponsorship%20Inquiry"
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest-800 text-white text-xs font-bold hover:bg-forest-900 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email Admins (admin@feedall.org)
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>Thank you for empowering zero-food-waste across India.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
