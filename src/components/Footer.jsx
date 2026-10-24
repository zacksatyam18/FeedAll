import React from 'react';
import { ShieldCheck, ArrowUpRight, QrCode } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer({ setCurrentRole, onOpenDonation }) {
  return (
    <footer className="bg-forest-950 text-white border-t border-forest-800/80 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-forest-800/60">
          
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-xl">
                <img 
                  src="/feedall-logo.png" 
                  alt="Feedall Logo" 
                  className="h-9 w-auto object-contain"
                />
              </div>
              <div>
                <span className="font-heading font-extrabold text-xl tracking-tight text-white">
                  Feed<span className="text-brand-orange">all</span>
                </span>
                <p className="text-[9px] tracking-widest uppercase text-emerald-300 font-semibold">
                  Food For A Better Tomorrow
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India's premier enterprise B2B surplus food redistribution marketplace connecting corporate hotels and commercial banquet kitchens with verified NGOs.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-brand-orange" />
              <span>FSSAI Safe Food Share Partner</span>
            </div>

            {/* Donation & Maintenance Fund Quick Link */}
            <div className="pt-1">
              <button
                type="button"
                onClick={onOpenDonation}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-forest-900/90 hover:bg-forest-800 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all shadow-sm hover:border-emerald-400"
              >
                <QrCode className="w-3.5 h-3.5 text-brand-orange" />
                <span>Support Platform Fund (QR)</span>
              </button>
            </div>
          </div>

          {/* Solution Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200 mb-4 font-heading">
              Enterprise Portals
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <button 
                  onClick={() => setCurrentRole('provider')}
                  className="hover:text-brand-orange transition-colors flex items-center gap-1.5"
                >
                  Hotels & Caterers Portal <ArrowUpRight className="w-3 h-3 opacity-60" />
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentRole('ngo')}
                  className="hover:text-brand-orange transition-colors flex items-center gap-1.5"
                >
                  Verified NGO Rescue Network <ArrowUpRight className="w-3 h-3 opacity-60" />
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentRole('admin')}
                  className="hover:text-brand-orange transition-colors flex items-center gap-1.5"
                >
                  FSSAI Compliance Admin <ArrowUpRight className="w-3 h-3 opacity-60" />
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setCurrentRole('provider')}
                  className="hover:text-brand-orange transition-colors flex items-center gap-1.5"
                >
                  Safe Handover & Impact Logs
                </button>
              </li>
            </ul>
          </div>

          {/* Compliance & Standards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200 mb-4 font-heading">
              Statutory Compliance
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                FSSAI Surplus Food Regulations (2019)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                Companies Act Sec 135 (CSR 2% Mandate)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                Section 80G Tax Deductibility
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-orange"></span>
                ISO 14064 Carbon Accounting
              </li>
            </ul>
          </div>

          {/* Global Impact Goals */}
          <div className="bg-forest-900/60 p-4 rounded-2xl border border-forest-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-200 mb-2 font-heading">
              UN SDG Commitment
            </h4>
            <div className="space-y-2 text-[11px] text-slate-300">
              <div className="flex items-center justify-between p-2 rounded-lg bg-forest-950/80">
                <span className="font-bold text-yellow-400">SDG 2: Zero Hunger</span>
                <span className="font-mono text-emerald-300 font-bold">3.14L Meals</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-forest-950/80">
                <span className="font-bold text-orange-400">SDG 12: Responsible Consumption</span>
                <span className="font-mono text-emerald-300 font-bold">142+ Tons</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-forest-950/80">
                <span className="font-bold text-emerald-400">SDG 13: Climate Action</span>
                <span className="font-mono text-emerald-300 font-bold">357 Tons CO₂e</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {CURRENT_YEAR} Feedall Technologies Private Limited. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terms of Safe Donation</span>
            <span className="hover:text-white cursor-pointer transition-colors">Cold-Chain SOP</span>
            <span className="hover:text-white cursor-pointer transition-colors">Security Audits</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
