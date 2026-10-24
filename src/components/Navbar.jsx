import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  HeartHandshake,
  ShieldCheck,
  Bell,
  ChevronDown,
  LogIn,
  LogOut,
  Home,
  Heart,
  MessageSquareHeart,
  Menu,
  X,
  QrCode
} from 'lucide-react';

const NAV_LINKS = [
  { id: 'our-mission',       label: 'Our Mission'       },
  { id: 'donation-programs', label: 'Donation Programs' },
  { id: 'impact',            label: 'Impact'            },
  { id: 'about-us',          label: 'About Us'          },
  { id: 'feedback-section',  label: 'Feedback', icon: MessageSquareHeart }
];

export default function Navbar({
  currentRole,
  setCurrentRole,
  currentUser,
  onOpenAuth,
  onSignOut,
  unreadAlerts = 1,
  onOpenDonation
}) {
  const [showRoleMenu,   setShowRoleMenu]   = useState(false);
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);
  const [mobileOpen,     setMobileOpen]     = useState(false);

  // Close dropdowns when clicking outside
  const navRef = useRef(null);
  useEffect(() => {
    const handleClick = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setShowRoleMenu(false);
        setShowAlertsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close mobile menu on viewport resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const roles = [
    { id: 'landing',  label: 'Public Home',    icon: Home,           desc: 'Overview & Story'             },
    { id: 'provider', label: 'Hotel Portal',   icon: Building2,      desc: 'Banquet Surplus Logistics'    },
    { id: 'ngo',      label: 'NGO Rescue',     icon: HeartHandshake, desc: 'Live Rescue Matches & Fleet'  },
    { id: 'admin',    label: 'Platform Admin', icon: ShieldCheck,    desc: 'FSSAI Approvals & Audit'      }
  ];

  const currentRoleObj = roles.find((r) => r.id === currentRole) || roles[0];

  const scrollToSection = (id) => {
    setMobileOpen(false);
    if (currentRole !== 'landing') {
      setCurrentRole('landing');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 130);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header ref={navRef} className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">

          {/* ── Logo ── */}
          <button
            onClick={() => { setCurrentRole('landing'); setMobileOpen(false); }}
            className="flex items-center gap-2.5 group shrink-0"
            aria-label="Feedall home"
          >
            <img
              src="/feedall-logo.png"
              alt="Feedall — Food for a better tomorrow"
              className="h-11 sm:h-14 w-auto object-contain transition-transform group-hover:scale-[1.03]"
            />
          </button>

          {/* ── Desktop section links ── */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-700">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="hover:text-forest-900 transition-colors relative py-1 inline-flex items-center gap-1.5 after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-brand-orange after:transition-all hover:after:w-full"
              >
                {link.icon && <link.icon className="w-3.5 h-3.5 text-brand-orange" />}
                {link.label}
              </button>
            ))}
          </nav>

          {/* ── Right controls (desktop) ── */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Portal switcher */}
            <div className="relative hidden md:block">
              <button
                onClick={() => { setShowRoleMenu(!showRoleMenu); setShowAlertsMenu(false); }}
                aria-expanded={showRoleMenu}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:border-forest-300 text-[11px] font-semibold text-slate-600 transition-colors"
              >
                <currentRoleObj.icon className="w-3.5 h-3.5 text-brand-orange" />
                <span className="hidden xl:inline">Portal:</span> {currentRoleObj.label}
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showRoleMenu ? 'rotate-180' : ''}`} />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white text-slate-800 shadow-2xl border border-slate-200 p-2 z-50 animate-fadeIn">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Active Dashboard
                  </div>
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => { setCurrentRole(role.id); setShowRoleMenu(false); }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 text-xs transition-colors ${
                        currentRole === role.id
                          ? 'bg-forest-50 text-forest-900 font-bold border border-forest-200'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <role.icon className="w-4 h-4 text-brand-orange" />
                      <div>
                        <div>{role.label}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{role.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Support Platform & Security QR Button */}
            <button
              onClick={onOpenDonation}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-[11px] font-bold text-forest-900 transition-all shadow-sm hover:shadow active:scale-95"
              title="Donate to support FeedAll platform hosting, server security & database"
            >
              <QrCode className="w-3.5 h-3.5 text-forest-700" />
              <span>Support Us (QR)</span>
            </button>

            {/* Alerts */}
            <div className="relative">
              <button
                onClick={() => { setShowAlertsMenu(!showAlertsMenu); setShowRoleMenu(false); }}
                aria-expanded={showAlertsMenu}
                className="relative p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                title="Live surplus & cold-chain notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                    {unreadAlerts}
                  </span>
                )}
              </button>

              {showAlertsMenu && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white text-slate-800 shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fadeIn">
                  <div className="p-3 bg-forest-900 text-white flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">Live Platform Activity</span>
                    <span className="text-[10px] bg-forest-800 text-emerald-200 px-2 py-0.5 rounded-full font-mono">Real-time</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto text-xs p-1">
                    <div className="p-3 hover:bg-slate-50">
                      <p className="font-bold text-forest-900">Oberoi Palace Surplus Match</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">65kg banquet dal &amp; rice broadcast to local NGO fleets.</p>
                      <span className="text-[10px] text-brand-orange font-bold">Expires in 42 mins</span>
                    </div>
                    <div className="p-3 hover:bg-slate-50">
                      <p className="font-bold text-forest-900">Cold Chain Temperature Verified</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">Le Méridien pickup logged at 3.6°C (compliant &lt; 4°C).</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Auth */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
                  <span className="text-base">{currentUser.avatar || '👤'}</span>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-brand-orange uppercase tracking-wider">
                      {currentUser.role === 'provider'
                        ? 'Hotel Partner'
                        : currentUser.role === 'ngo'
                          ? 'NGO Fleet'
                          : 'Admin'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('signin', 'provider')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-forest-800" />
                  Sign In
                </button>
                <button
                  onClick={() => onOpenDonation ? onOpenDonation() : scrollToSection('donation-programs')}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all"
                >
                  <Heart className="w-3.5 h-3.5 fill-white" />
                  <span className="hidden sm:inline">Donate Now</span>
                  <span className="sm:hidden">Donate</span>
                </button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white animate-slideUp">
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-forest-50 hover:text-forest-900 transition-colors flex items-center gap-2"
              >
                {link.icon && <link.icon className="w-4 h-4 text-brand-orange" />}
                {link.label}
              </button>
            ))}

            {/* Mobile Support QR Button */}
            <div className="pt-2">
              <button
                onClick={() => { onOpenDonation?.(); setMobileOpen(false); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-forest-900 text-xs font-bold shadow-sm"
              >
                <QrCode className="w-4 h-4 text-forest-700" />
                Support Platform & Security (Scan QR)
              </button>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => { setCurrentRole(role.id); setMobileOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold transition-colors ${
                    currentRole === role.id
                      ? 'bg-forest-50 text-forest-900 border border-forest-200'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <role.icon className="w-4 h-4 text-brand-orange" />
                  <div>
                    <div>{role.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{role.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {!currentUser && (
              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => { onOpenAuth('signin', 'provider'); setMobileOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-forest-900 text-white text-sm font-bold"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In to Account
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
