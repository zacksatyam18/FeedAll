import React, { useState } from 'react';
import { 
  X, 
  Send, 
  ShieldCheck, 
  AlertTriangle, 
  MapPin, 
  Phone,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BackendService } from '../services/backendService';

export default function DonationEnquiryModal({ 
  ngo, 
  isOpen, 
  onClose, 
  currentUser, 
  onEnquirySuccess,
  showNotification 
}) {
  const [step, setStep] = useState(1); // 1 = Form, 2 = Confirmation Review
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [foodTitle, setFoodTitle] = useState('');
  const [category, setCategory] = useState('Buffet Surplus');
  const [quantityKg, setQuantityKg] = useState('');
  const [portions, setPortions] = useState('');
  const [prepTime, setPrepTime] = useState('16:00');
  const [expiryTime, setExpiryTime] = useState('22:00');
  const [storageRequired, setStorageRequired] = useState('Cold-Storage (< 4°C)');
  const [pickupLocation, setPickupLocation] = useState(
    currentUser?.location ? `${currentUser.name || 'Kitchen Dock'}, ${currentUser.location}` : 'Kitchen Loading Bay 4, Connaught Place'
  );
  const [preferredTime, setPreferredTime] = useState('Within 45 mins (Urgent Evening Run)');
  const [notes, setNotes] = useState('');
  const [contactPerson, setContactPerson] = useState(
    currentUser?.contactPerson ? `${currentUser.contactPerson} (${currentUser.name || 'Provider'})` : 'Executive Kitchen Dispatcher'
  );
  const [contactPhone, setContactPhone] = useState('+91 98100 23456');
  const [complianceConfirmed, setComplianceConfirmed] = useState(false);

  if (!isOpen || !ngo) return null;

  const handleNextToConfirm = (e) => {
    e.preventDefault();
    setFormError('');

    if (!foodTitle.trim()) {
      setFormError('Please specify the food title or items.');
      return;
    }
    if (!quantityKg || Number(quantityKg) <= 0) {
      setFormError('Please specify a valid quantity in kg.');
      return;
    }
    if (!portions || Number(portions) <= 0) {
      setFormError('Please specify an estimated number of portions.');
      return;
    }
    if (!pickupLocation.trim()) {
      setFormError('Please provide a specific pickup loading bay or address.');
      return;
    }

    setStep(2);
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    if (!complianceConfirmed) {
      setFormError('Please confirm the food safety and temperature compliance statement.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const enquiryPayload = {
        providerEmail: currentUser?.email || 'provider@feedall.org',
        providerName: currentUser?.name || 'Authorized Food Provider',
        ngoId: ngo.id,
        ngoName: ngo.name,
        foodTitle: foodTitle.trim(),
        category,
        quantityKg: Number(quantityKg),
        portions: Number(portions),
        prepTime,
        expiryTime,
        storageRequired,
        pickupLocation: pickupLocation.trim(),
        preferredTime,
        notes: notes.trim(),
        contactPerson: `${contactPerson.trim()} • ${contactPhone.trim()}`
      };

      const result = await BackendService.createDonationEnquiry(enquiryPayload);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      if (showNotification) {
        showNotification(`Donation enquiry sent to ${ngo.name}! You will receive status alerts upon fleet response.`, 'success');
      }

      if (onEnquirySuccess) {
        onEnquirySuccess(result);
      }

      onClose();
    } catch (err) {
      console.error('Failed to submit donation enquiry:', err);
      setFormError('Unable to send enquiry. Please check connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enquiry-modal-title"
    >
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-forest-950 to-forest-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-300 hover:text-white hover:bg-forest-800 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Close donation modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-brand-orange bg-brand-orange/20 px-2 py-0.5 rounded-full border border-brand-orange/40">
              Food Donation Enquiry
            </span>
            <span className="text-xs text-emerald-200 font-semibold">
              Step {step} of 2: {step === 1 ? 'Details' : 'Confirmation'}
            </span>
          </div>

          <h2 id="enquiry-modal-title" className="text-lg sm:text-xl font-extrabold font-heading text-white">
            Dispatch Request to {ngo.name}
          </h2>
          <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>FSSAI Partner Fleet standby in {ngo.city}</span>
          </p>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 text-xs sm:text-sm">
          
          {/* Regulatory Food Safety Warning */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Statutory Food Handling Reminder: </span>
              Prepared hot meals must be maintained above 60°C and cold items kept below 4°C prior to vehicle handover.
            </div>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          {/* STEP 1: FORM INPUTS */}
          {step === 1 && (
            <form id="enquiry-form" onSubmit={handleNextToConfirm} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Food Surplus Description *
                </label>
                <input
                  type="text"
                  required
                  value={foodTitle}
                  onChange={(e) => setFoodTitle(e.target.value)}
                  placeholder="e.g., Dal Makhani, Paneer Butter Masala, Pulao, 120 Tandoori Rotis"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900 focus:ring-1 focus:ring-forest-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-forest-900"
                  >
                    <option value="Buffet Surplus">Buffet Surplus</option>
                    <option value="Cooked Meals">Cooked Meals</option>
                    <option value="Bakery/Pastries">Bakery/Pastries</option>
                    <option value="Fresh Produce">Fresh Produce</option>
                    <option value="Packaged Dairy">Packaged Dairy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Quantity (kg) & Portions *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      required
                      min="1"
                      value={quantityKg}
                      onChange={(e) => setQuantityKg(e.target.value)}
                      placeholder="kg (e.g. 45)"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                    />
                    <input
                      type="number"
                      required
                      min="1"
                      value={portions}
                      onChange={(e) => setPortions(e.target.value)}
                      placeholder="Portions (120)"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Preparation Time & Safe Limit
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      value={prepTime}
                      onChange={(e) => setPrepTime(e.target.value)}
                      className="w-full px-2 py-2.5 rounded-xl border border-slate-300 text-xs"
                      title="Prep time"
                    />
                    <input
                      type="time"
                      value={expiryTime}
                      onChange={(e) => setExpiryTime(e.target.value)}
                      className="w-full px-2 py-2.5 rounded-xl border border-slate-300 text-xs"
                      title="Best before"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Storage Requirement
                  </label>
                  <select
                    value={storageRequired}
                    onChange={(e) => setStorageRequired(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-forest-900"
                  >
                    <option value="Cold-Storage (< 4°C)">Cold-Storage (&lt; 4°C)</option>
                    <option value="Ambient OK">Ambient OK (Dry / Bakery)</option>
                    <option value="Hot-Hold (> 60°C)">Hot-Hold (&gt; 60°C)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Pickup Location & Loading Dock *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="e.g., Gate 4 Kitchen Cold Dock, The Grand Oberoi"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Preferred Collection Window
                </label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-forest-900"
                >
                  <option value="Within 45 mins (Urgent Evening Run)">Within 45 mins (Urgent Evening Run)</option>
                  <option value="Within 90 mins">Within 90 mins</option>
                  <option value="Between 21:00 - 22:30">Between 21:00 - 22:30</option>
                  <option value="Early Morning Next Day">Early Morning Next Day (Bakery/Dry)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Lead Dispatcher"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Phone *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98100 23456"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Allergen & Handling Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., 100% Vegetarian; sealed in food-grade SS vessels; includes dairy; zero nuts."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                />
              </div>

            </form>
          )}

          {/* STEP 2: CONFIRMATION REVIEW */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-forest-50 border border-forest-100 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-forest-900 flex items-center justify-between">
                  <span>Enquiry Summary</span>
                  <span className="text-brand-orange font-bold">{quantityKg} kg • ~{portions} portions</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <div>
                    <span className="font-semibold text-forest-900">Food Items: </span>
                    {foodTitle} ({category})
                  </div>
                  <div>
                    <span className="font-semibold text-forest-900">Storage / Cold-Chain: </span>
                    {storageRequired} (Prep: {prepTime} | Best Before: {expiryTime})
                  </div>
                  <div>
                    <span className="font-semibold text-forest-900">Pickup Dock: </span>
                    {pickupLocation}
                  </div>
                  <div>
                    <span className="font-semibold text-forest-900">Collection Window: </span>
                    {preferredTime}
                  </div>
                  {notes && (
                    <div>
                      <span className="font-semibold text-forest-900">Handling Notes: </span>
                      {notes}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-forest-900">Liaison Contact: </span>
                    {contactPerson} ({contactPhone})
                  </div>
                </div>
              </div>

              {/* Statutory Confirmation Checkbox */}
              <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={complianceConfirmed}
                  onChange={(e) => setComplianceConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-forest-900 focus:ring-forest-900"
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  I confirm that this surplus food is wholesome, hygienically handled, and packaged in food-grade containers in accordance with FSSAI regulations.
                </span>
              </label>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="enquiry-form"
                className="px-6 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-950 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-forest-900/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Review & Confirm</span>
                <ArrowRight className="w-4 h-4 text-brand-orange" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting || !complianceConfirmed}
                className="px-6 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isSubmitting ? (
                  <span>Sending Enquiry...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm & Send to {ngo.name.split('—')[0]}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
