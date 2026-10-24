import React from 'react';
import { 
  X, 
  ShieldCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Truck, 
  Clock, 
  Award, 
  ExternalLink, 
  Utensils, 
  CheckCircle2,
  Navigation
} from 'lucide-react';

export default function NgoDetailModal({ ngo, isOpen, onClose, onOpenEnquiry }) {
  if (!isOpen || !ngo) return null;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${ngo.latitude},${ngo.longitude}`;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ngo-detail-title"
    >
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-forest-950 to-forest-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-forest-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {ngo.verified && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified NGO Partner
              </span>
            )}
            {ngo.taxStatus && (
              <span className="text-xs text-slate-300 font-mono bg-white/10 px-2 py-0.5 rounded-full">
                {ngo.taxStatus}
              </span>
            )}
            {ngo.acceptingDonations && (
              <span className="text-xs font-semibold text-brand-orange bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-500/30">
                ● Accepting Surplus
              </span>
            )}
          </div>

          <h2 id="ngo-detail-title" className="text-xl sm:text-2xl font-extrabold font-heading text-white">
            {ngo.name}
          </h2>
          <p className="text-xs text-emerald-100/90 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-orange shrink-0" />
            <span>{ngo.address}, {ngo.city} — {ngo.pinCode}</span>
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-sm">
          
          {/* Mission & Overview */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Mission & Operations Overview
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {ngo.description}
            </p>
          </div>

          {/* Verification & Statutory Credentials */}
          <div className="p-4 rounded-2xl bg-forest-50/70 border border-forest-100 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-forest-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-forest-800" />
              Statutory Credentials & Food Safety
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Compliance Badge: </span>
                <span className="font-semibold text-forest-900">{ngo.verificationBadge || 'FSSAI Verified'}</span>
              </div>
              {ngo.darpanId && (
                <div>
                  <span className="text-slate-500 font-medium">NITI Aayog Darpan: </span>
                  <span className="font-mono font-semibold text-forest-900">{ngo.darpanId}</span>
                </div>
              )}
            </div>
            {ngo.foodSafetyProtocols && (
              <div className="text-xs text-forest-800/90 pt-1 border-t border-forest-200/50">
                <span className="font-semibold">Safety Protocol: </span>
                {ngo.foodSafetyProtocols}
              </div>
            )}
          </div>

          {/* Fleet & Logistics Capabilities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-brand-orange" />
                Fleet Capacity
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                {ngo.fleetCapacity || 'Insulated Vans Available'}
              </div>
              <div className="text-xs text-slate-500">
                Temperature-controlled crates for hot and chilled dishes.
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-forest-800" />
                Operating Hours
              </div>
              <div className="text-sm font-extrabold text-slate-900">
                {ngo.operatingHours || '08:00 - 23:00 Daily'}
              </div>
              <div className="text-xs text-slate-500">
                Dedicated rapid-dispatch fleet standby.
              </div>
            </div>
          </div>

          {/* Accepted Surplus Categories */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-brand-orange" />
              Accepted Food Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {ngo.services && ngo.services.map((svc, i) => (
                <span 
                  key={i}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {svc}
                </span>
              ))}
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Verified Dispatch Contacts
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-orange" />
                <a 
                  href={`tel:${ngo.phone}`} 
                  className="font-bold text-slate-900 hover:text-brand-orange transition-colors"
                >
                  {ngo.phone}
                </a>
              </div>
              {ngo.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-forest-800" />
                  <a 
                    href={`mailto:${ngo.email}`} 
                    className="font-medium text-slate-700 hover:text-forest-900 transition-colors truncate"
                  >
                    {ngo.email}
                  </a>
                </div>
              )}
            </div>
            {ngo.contactPerson && (
              <div className="text-[11px] text-slate-500">
                Liaison Officer: <span className="font-semibold text-slate-700">{ngo.contactPerson}</span>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5 text-brand-orange" />
            Get Directions
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                if (onOpenEnquiry) onOpenEnquiry(ngo);
              }}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-950 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-forest-900/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Utensils className="w-3.5 h-3.5 text-brand-orange" />
              Contact NGO & Donate Food
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
