import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowRight,
  Building2,
  HeartHandshake,
  ShieldCheck,
  Leaf,
  Clock,
  ThermometerSnowflake,
  Utensils,
  Truck,
  Sprout,
  MapPin,
  Timer,
  Heart,
  CheckCircle2,
  Sparkles,
  Users,
  Radio,
  QrCode
} from 'lucide-react';
import FeedbackSection from '../components/FeedbackSection';
import HeroSlider from '../components/HeroSlider';

/* ------------------------------------------------------------------
   UTILITIES
   ------------------------------------------------------------------ */
const numberFormatter = new Intl.NumberFormat('en-US');

/** CountUp: animates from 0 to value once when section scrolls into view.
 *  Observer disconnects after first trigger, preventing re-runs on re-render.
 *  Handles cleanup of both the observer and the animation frame.
 */
function CountUp({ value = 0, duration = 1600 }) {
  const ref   = useRef(null);
  const [display, setDisplay] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (value === 0) return undefined;
    const node = ref.current;
    if (!node) return undefined;

    let frame;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasRun.current) return;
        hasRun.current = true;
        observer.disconnect();

        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          // Ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(value * eased));
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.35 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return <span ref={ref}>{numberFormatter.format(display)}</span>;
}

/** useScrollReveal — adds .is-visible to each ref when it enters the viewport.
 *  A single shared observer is used for efficiency.
 *  Returns a register function: const { register } = useScrollReveal();
 */
function useScrollReveal(threshold = 0.12) {
  const refs    = useRef([]);
  const observer = useRef(null);

  const register = useCallback((el) => {
    if (el && !refs.current.includes(el)) {
      refs.current.push(el);
    }
  }, []);

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold }
    );

    refs.current.forEach((el) => {
      if (el) observer.current.observe(el);
    });

    return () => observer.current?.disconnect();
  }, [threshold]);

  return { register };
}

/* ------------------------------------------------------------------
   STATIC DATA
   ------------------------------------------------------------------ */
const formatClock = (seconds = 0) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const donationPrograms = [
  {
    icon: Utensils,
    title: 'Sponsor Daily Meals',
    description:
      'Fund hot, nutritious meals for children and elders in our verified shelter network every single day.',
    impact: '₹1,500 feeds 30 people for a day',
    accent: 'bg-brand-orange'
  },
  {
    icon: Truck,
    title: 'Fund a Cold-Chain Van',
    description:
      'Keep rescued food below 4°C while it travels from hotel kitchens to community kitchens.',
    impact: 'One van rescues ~1,200 kg a month',
    accent: 'bg-forest-900'
  },
  {
    icon: HeartHandshake,
    title: 'Rescue a Surplus Kitchen',
    description:
      'Connect a hotel or banquet kitchen to nearby NGOs so event surplus never reaches a bin.',
    impact: 'Average dispatch in 22 minutes',
    accent: 'bg-brand-leaf'
  },
  {
    icon: Sprout,
    title: 'Festival Food Drives',
    description:
      'Sponsor large-format drives during festivals, weddings and conferences across our city network.',
    impact: 'Peak-day drives feed 5,000+ people',
    accent: 'bg-brand-gold'
  }
];

const missionPillars = [
  {
    icon: Clock,
    title: 'Rescue within the window',
    text: 'Surplus is logged, matched and dispatched inside the 45-minute food-safety window.'
  },
  {
    icon: ThermometerSnowflake,
    title: 'Safety before speed',
    text: 'Every handover is temperature-probed, OTP verified and recorded in a public audit trail.'
  },
  {
    icon: Heart,
    title: 'Dignity in every plate',
    text: 'Restaurant-grade meals reach shelter homes, night schools and community kitchens.'
  }
];

const values = [
  'FSSAI-compliant cold chain',
  'Verified NGO fleets',
  'Transparent impact reporting',
  'Zero-waste kitchens'
];

/** Hero slides — each image gets staggered scale/opacity transition via .hero-slide / .active classes */
const heroSlides = [
  {
    src: '/hero-children-meals.jpg',
    alt: 'Children receiving a freshly served mid-day meal at school'
  },
  {
    src: '/hero-meal-rows.jpg',
    alt: 'School children eating a mid-day meal together in rows'
  },
  {
    src: '/hero-community-kitchen.jpg',
    alt: 'Volunteers cooking a large community meal in a kitchen'
  },
  {
    src: '/hero-meal-serving.jpg',
    alt: 'Volunteers serving meals to young students'
  },
  {
    src: '/hero-meal-outdoors.jpg',
    alt: 'Students sharing a meal outdoors at school'
  }
];

/* Preload all hero images so transitions are seamless */
heroSlides.forEach(({ src }) => {
  const img = new Image();
  img.src = src;
});

/* ------------------------------------------------------------------
   MAIN COMPONENT
   ------------------------------------------------------------------ */
export default function LandingView({
  setCurrentRole,
  onOpenAuth,
  feedbacks,
  setFeedbacks,
  showNotification,
  adminStats = {},
  ngoMatches = [],
  onOpenDonation
}) {
  /* ── Impact figures ── */
  const foodRescuedKg = adminStats.totalWasteSavedKg        ?? 8850;
  const mealsServed   = adminStats.totalMealsDistributed    ?? 314200;
  const partnerOrgs   = (adminStats.activeHotels ?? 48) + (adminStats.activeNgos ?? 92);
  const co2Avoided    = Math.round(adminStats.totalCo2eAvoidedTons ?? 357);
  const citiesActive  = adminStats.citiesActive             ?? 8;
  const hotelPartners = adminStats.activeHotels             ?? 48;
  const ngoFleets     = adminStats.activeNgos               ?? 92;

  /* ── Hero carousel configuration is encapsulated in HeroSlider (0.5s transition, 3s autoplay) ── */

  /* ── Live match feed countdown ── */
  const liveMatches = ngoMatches.slice(0, 3);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setElapsedSeconds((s) => s + 1),
      1000
    );
    return () => clearInterval(interval);
  }, []);

  /* ── Scroll-reveal ── */
  const { register } = useScrollReveal();

  const openAuth = (tab, role) => {
    if (onOpenAuth) onOpenAuth(tab, role);
  };

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <div className="bg-white">

      {/* ============================================================
          HERO
          ============================================================ */}
      <section className="relative overflow-hidden bg-brand-cream">
        {/* Fade-to-white gradient at the bottom of the hero */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-white/70 pointer-events-none z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-[1.02fr_1fr] items-start gap-10">

            {/* ── Left: headline & CTAs ── */}
            <div className="relative py-12 sm:py-16 lg:py-20 lg:pr-10">
              {/* Ink accent lines */}
              <span className="hidden sm:block absolute -top-1 right-6 h-1.5 w-10 rotate-[-18deg] rounded-full bg-brand-orange/70" />
              <span className="hidden sm:block absolute top-4 right-2 h-1.5 w-6 rotate-[-18deg] rounded-full bg-brand-orange/50" />

              <h1 className="text-4xl sm:text-5xl lg:text-[50px] font-extrabold font-heading tracking-tight text-slate-900 leading-[1.08]">
                Building a&nbsp;<span className="whitespace-nowrap">Hunger-Free</span>&nbsp;India,
                Together
              </h1>

              <p className="mt-5 text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
                We mobilize surplus food from kitchens and provide daily nutritious meals to
                underserved communities.{' '}
                <span className="relative inline-block font-semibold text-slate-800">
                  Everyday.
                  <svg
                    viewBox="0 0 120 10"
                    className="absolute -bottom-1.5 left-0 w-full h-2.5 text-brand-gold"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 6 C 30 1, 70 9, 118 3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => openAuth('signup', 'provider')}
                  className="px-7 py-3.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white text-sm font-bold shadow-lg shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  Register as Partner
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => openAuth('signup', 'ngo')}
                  className="px-7 py-3.5 rounded-xl bg-white hover:bg-forest-50 text-forest-900 text-sm font-bold border-2 border-forest-900 transition-all flex items-center justify-center gap-2"
                >
                  <HeartHandshake className="w-4 h-4 text-brand-orange" />
                  Join as NGO
                </button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-leaf" />
                  FSSAI-compliant handovers
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-leaf" />
                  45-minute cold-chain rescue
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-leaf" />
                  Live impact tracking
                </span>
              </div>
            </div>

            {/* ── Right: AUTOMATIC 0.5s horizontal sliding hero carousel ── */}
            <div className="relative pb-16 lg:pb-24">
              <div className="relative h-[260px] sm:h-[360px] lg:h-[520px] overflow-hidden rounded-[28px] shadow-2xl shadow-forest-900/20">
                <HeroSlider slides={heroSlides} />
              </div>

              {/* Live counter badge */}
              <div className="absolute bottom-16 lg:bottom-20 left-3 sm:left-5 bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-slate-200 px-4 py-3 flex items-center gap-3 z-20">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-leaf opacity-70" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-leaf" />
                </span>
                <div>
                  <div className="text-xs font-bold text-forest-900">
                    {numberFormatter.format(mealsServed)}+ meals served
                  </div>
                  <div className="text-[10px] text-slate-500">Live from the Feedall network</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================
          IMPACT BAND
          ============================================================ */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 lg:-mt-14">
        <div
          ref={register}
          className="reveal rounded-[28px] overflow-hidden shadow-2xl shadow-forest-900/25 grid md:grid-cols-[0.85fr_2fr]"
        >
          {/* Orange food-rescued block */}
          <div className="relative bg-brand-orange text-white px-7 sm:px-9 py-9 sm:py-11 flex flex-col justify-center overflow-hidden">
            <div className="absolute -left-8 -top-10 w-28 h-28 rounded-full bg-white/10" />
            <div className="absolute -right-6 bottom-0 w-24 h-24 rounded-full bg-white/10" />
            <div className="relative">
              <div className="text-3xl sm:text-[40px] font-extrabold font-heading leading-none tracking-tight">
                <CountUp value={foodRescuedKg} />+ kg
              </div>
              <div className="mt-2 text-sm font-semibold text-white/90">Food Rescued</div>
              <div className="mt-1 h-0.5 w-14 bg-forest-900/50 rounded-full" />
            </div>
          </div>

          {/* Green impact block */}
          <div className="relative bg-forest-800 text-white px-6 sm:px-10 py-9 sm:py-11">
            <div className="absolute right-6 top-5 text-brand-gold/80" aria-hidden="true">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-center">Our Impact</h2>
            <div className="mx-auto mt-2 h-[3px] w-12 rounded-full bg-brand-orange" />

            <div
              ref={register}
              className="reveal-children mt-7 grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-white/15 gap-6 sm:gap-0 text-center"
            >
              <div className="sm:px-4">
                <div className="text-2xl sm:text-3xl font-extrabold font-heading leading-none">
                  <CountUp value={mealsServed} />+
                </div>
                <div className="mt-1.5 text-xs font-medium text-emerald-100/90">Daily Meals Served</div>
              </div>
              <div className="sm:px-4">
                <div className="text-2xl sm:text-3xl font-extrabold font-heading leading-none">
                  <CountUp value={partnerOrgs} />+
                </div>
                <div className="mt-1.5 text-xs font-medium text-emerald-100/90">Partner Organizations</div>
              </div>
              <div className="sm:px-4">
                <div className="text-2xl sm:text-3xl font-extrabold font-heading leading-none">
                  <CountUp value={citiesActive} />
                </div>
                <div className="mt-1.5 text-xs font-medium text-emerald-100/90">Cities Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          OUR MISSION
          ============================================================ */}
      <section id="our-mission" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-12 lg:gap-16 items-start">

          <div ref={register} className="reveal">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-[11px] font-bold uppercase tracking-widest">
              <Leaf className="w-3.5 h-3.5 text-brand-leaf" />
              Our Mission
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 leading-tight">
              No good meal should ever become waste.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              India discards millions of meals while millions go hungry. Feedall closes that gap
              with a verified redistribution network: hotel and banquet kitchens log surplus,
              nearby NGOs claim it, and every handover is temperature-checked and logged. What
              was prepared with care reaches a plate with dignity.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-brand-cream border border-slate-200 p-4 card-hover">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                  <Timer className="w-3.5 h-3.5" />
                  Average Pickup
                </div>
                <div className="mt-1 text-xl font-extrabold font-heading text-forest-900">
                  {adminStats.averagePickupMins ?? 22} mins
                </div>
              </div>
              <div className="rounded-2xl bg-brand-cream border border-slate-200 p-4 card-hover">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-leaf">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Safety Compliance
                </div>
                <div className="mt-1 text-xl font-extrabold font-heading text-forest-900">
                  {adminStats.safetyComplianceRate ?? '99.8%'}
                </div>
              </div>
            </div>
          </div>

          <div ref={register} className="reveal space-y-4">
            {missionPillars.map((pillar) => (
              <div
                key={pillar.title}
                className="flex items-start gap-4 rounded-3xl bg-white border border-slate-200 shadow-sm p-5 sm:p-6 card-hover"
              >
                <div className="shrink-0 w-11 h-11 rounded-2xl bg-forest-900 text-brand-gold flex items-center justify-center">
                  <pillar.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-forest-900 font-heading">{pillar.title}</h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">{pillar.text}</p>
                </div>
              </div>
            ))}

            <div className="flex flex-wrap gap-2 pt-3">
              {values.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center gap-1.5 rounded-full bg-forest-50 border border-forest-100 px-3 py-1.5 text-[11px] font-semibold text-forest-800"
                >
                  <CheckCircle2 className="w-3 h-3 text-brand-leaf" />
                  {value}
                </span>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================
          DONATION PROGRAMS
          ============================================================ */}
      <section
        id="donation-programs"
        className="scroll-mt-24 bg-brand-cream border-y border-slate-200 py-20 sm:py-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={register} className="reveal max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-orange-200 text-brand-orange text-[11px] font-bold uppercase tracking-widest">
              <Heart className="w-3.5 h-3.5 fill-brand-orange" />
              Donation Programs
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold font-heading text-slate-900">
              Choose how you want to feed India
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Every program is tracked end to end, so you see exactly how many meals your support delivered.
            </p>
          </div>

          <div
            ref={register}
            className="reveal-children mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {donationPrograms.map((program) => (
              <div
                key={program.title}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between card-hover"
              >
                <div>
                  <div className={`w-11 h-11 rounded-2xl ${program.accent} text-white flex items-center justify-center`}>
                    <program.icon className="w-5 h-5" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-forest-900 font-heading">{program.title}</h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">{program.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-brand-orange">{program.impact}</div>
                  <button
                    onClick={() => {
                      if (showNotification) {
                        showNotification(`${program.title}: create a partner account to continue.`, 'info');
                      }
                      openAuth('signup', 'provider');
                    }}
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-forest-900 text-forest-900 hover:bg-forest-900 hover:text-white transition-colors px-4 py-2.5 text-xs font-bold"
                  >
                    Support this program
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Admin Platform Maintenance & Security Fund Banner */}
          <div className="mt-12 rounded-3xl bg-gradient-to-br from-forest-950 via-forest-900 to-emerald-950 text-white p-7 sm:p-10 shadow-2xl border border-emerald-500/30 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Admin Platform Maintenance &amp; Security Fund</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
                Help Admins Maintain Platform Security &amp; 24/7 Hosting
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                Whether you are an individual donor, an NGO, or a company, your contributions empower us to maintain continuous 24/7 server infrastructure, encrypted database storage, continuous SSL security, and real-time automated FSSAI verification.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-emerald-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Instant UPI QR Scan
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Corporate / CSR Invoicing
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  100% Transparent Cloud Allocation
                </span>
              </div>
            </div>

            <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <button
                type="button"
                onClick={onOpenDonation}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-brand-orange hover:bg-orange-600 text-white font-bold text-sm shadow-xl shadow-orange-500/30 transition-all flex items-center justify-center gap-2.5 group active:scale-95"
              >
                <QrCode className="w-5 h-5 group-hover:rotate-6 transition-transform" />
                <span>Scan QR Code to Donate</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          IMPACT + LIVE SURPLUS
          ============================================================ */}
      <section id="impact" className="scroll-mt-24 bg-forest-950 text-white py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div ref={register} className="reveal max-w-2xl">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-forest-900 border border-forest-700 text-emerald-300 text-[11px] font-bold uppercase tracking-widest">
                <Leaf className="w-3.5 h-3.5" />
                Impact
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold font-heading">
                Impact you can verify, updated live
              </h2>
              <p className="mt-3 text-sm text-emerald-100/80">
                Figures are pulled from our Supabase-backed redistribution ledger as surplus moves
                from kitchens to communities.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Live network status
            </div>
          </div>

          <div
            ref={register}
            className="reveal-children mt-10 grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          >
            {[
              { label: 'Food Rescued',   value: foodRescuedKg,  suffix: 'kg',   icon: Leaf          },
              { label: 'Meals Served',   value: mealsServed,    suffix: '',      icon: Utensils      },
              { label: 'CO₂e Avoided',   value: co2Avoided,     suffix: 'tons',  icon: Sprout        },
              { label: 'Hotel Partners', value: hotelPartners,  suffix: '',      icon: Building2     },
              { label: 'NGO Fleets',     value: ngoFleets,      suffix: '',      icon: HeartHandshake},
              { label: 'Cities Active',  value: citiesActive,   suffix: '',      icon: MapPin        }
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl bg-forest-900/70 border border-forest-800 p-5 sm:p-6 card-hover"
              >
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                  <stat.icon className="w-3.5 h-3.5 text-brand-orange" />
                  {stat.label}
                </div>
                <div className="mt-3 text-2xl sm:text-3xl font-extrabold font-heading">
                  <CountUp value={stat.value} />
                  {stat.suffix && (
                    <span className="text-base font-semibold text-emerald-200 ml-1.5">{stat.suffix}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Live surplus feed */}
          <div ref={register} className="reveal mt-10 rounded-3xl bg-white text-slate-800 shadow-2xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 sm:px-8 py-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand-orange">
                  <Radio className="w-3.5 h-3.5" />
                  Live surplus feed
                </div>
                <h3 className="mt-1 text-lg font-bold font-heading text-forest-900">
                  Food available for rescue right now
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {liveMatches.length} active {liveMatches.length === 1 ? 'match' : 'matches'}
              </span>
            </div>

            {liveMatches.length === 0 ? (
              <div className="px-6 sm:px-8 py-8 text-sm text-slate-500">
                No surplus is waiting at the moment — every logged meal has already been collected.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {liveMatches.map((match) => {
                  const remaining = Math.max(0, (match.initialSeconds ?? 2700) - elapsedSeconds);
                  const urgent    = remaining < 15 * 60;

                  return (
                    <li
                      key={match.id}
                      className="px-6 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-forest-900 truncate">{match.title}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {match.hotelName}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {match.distanceKm}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {numberFormatter.format(match.portions)} portions
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold tabular-nums ${
                            urgent
                              ? 'bg-orange-50 text-brand-orange border border-orange-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <Timer className="w-3.5 h-3.5" />
                          {remaining > 0 ? formatClock(remaining) : 'Expired'}
                        </span>
                        <button
                          onClick={() => setCurrentRole('ngo')}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-forest-900 hover:bg-forest-800 text-white px-4 py-2 text-xs font-bold transition-colors"
                        >
                          Rescue
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="px-6 sm:px-8 py-4 bg-brand-cream border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-[11px] text-slate-500">
                Live matches refresh automatically as kitchens log new surplus.
              </p>
              <button
                onClick={() => setCurrentRole('ngo')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-900 hover:text-brand-orange transition-colors"
              >
                Open the NGO Rescue Portal
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          ABOUT US / PORTALS
          ============================================================ */}
      <section id="about-us" className="scroll-mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start">

          <div ref={register} className="reveal">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-[11px] font-bold uppercase tracking-widest">
              <HeartHandshake className="w-3.5 h-3.5 text-brand-orange" />
              About Us
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold font-heading text-slate-900">
              A food rescue network built on trust
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              Feedall connects corporate hotels, banquet kitchens and caterers with FSSAI-verified
              NGOs and shelter homes. Our compliance team audits every partner, our cold-chain
              telemetry checks every handover, and our impact ledger is open for every donor and
              partner to inspect.
            </p>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Started as a weekend volunteer effort, Feedall now runs across{' '}
              <strong className="text-forest-900">{citiesActive} cities</strong> with{' '}
              <strong className="text-forest-900">{hotelPartners} hotel partners</strong> and{' '}
              <strong className="text-forest-900">{ngoFleets} verified NGO fleets</strong>.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => openAuth('signup', 'ngo')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest-900 hover:bg-forest-800 text-white px-6 py-3 text-sm font-bold transition-colors"
              >
                <HeartHandshake className="w-4 h-4 text-brand-gold" />
                Join as an NGO
              </button>
              <button
                onClick={() => openAuth('signup', 'provider')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-forest-900 text-forest-900 hover:bg-forest-50 px-6 py-3 text-sm font-bold transition-colors"
              >
                <Building2 className="w-4 h-4 text-brand-orange" />
                Register your kitchen
              </button>
            </div>
          </div>

          <div ref={register} className="reveal grid gap-4">
            {[
              {
                icon: Building2,
                title: 'Hotel & Caterer Portal',
                desc: 'Log banquet surplus and track refrigerated pickups.',
                role: 'provider',
                accent: 'text-brand-orange'
              },
              {
                icon: HeartHandshake,
                title: 'NGO Rescue Portal',
                desc: 'Claim live surplus matches and dispatch your fleet.',
                role: 'ngo',
                accent: 'text-brand-leaf'
              },
              {
                icon: ShieldCheck,
                title: 'Compliance Admin',
                desc: 'Approve NGO licences and audit cold-chain records.',
                role: 'admin',
                accent: 'text-brand-gold'
              }
            ].map((portal) => (
              <button
                key={portal.role}
                onClick={() => setCurrentRole(portal.role)}
                className="group text-left rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-forest-300 transition-all flex items-center gap-4 card-hover"
              >
                <div className="shrink-0 w-11 h-11 rounded-2xl bg-forest-900 text-white flex items-center justify-center">
                  <portal.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-forest-900 font-heading">{portal.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{portal.desc}</div>
                </div>
                <ArrowRight className={`w-4 h-4 ${portal.accent} transition-transform group-hover:translate-x-1`} />
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ============================================================
          FEEDBACK SECTION
          ============================================================ */}
      <div className="bg-slate-50 border-t border-slate-200">
        <FeedbackSection
          feedbacks={feedbacks}
          setFeedbacks={setFeedbacks}
          showNotification={showNotification}
        />
      </div>

    </div>
  );
}
