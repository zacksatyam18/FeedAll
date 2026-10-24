import React, { useState } from 'react';
import { 
  Star, 
  Heart, 
  ShieldCheck, 
  MessageSquarePlus, 
  CheckCircle2, 
  Building2, 
  HeartHandshake, 
  Award, 
  ThermometerSnowflake, 
  Users,
  X,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BackendService } from '../services/backendService';

export default function FeedbackSection({ feedbacks, setFeedbacks, showNotification }) {
  const [filterRole, setFilterRole] = useState('all'); // 'all' | 'ngo' | 'provider' | 'shelter'
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // New feedback form state
  const [formData, setFormData] = useState({
    authorName: '',
    authorRole: 'ngo',
    authorBadge: 'Verified NGO Partner',
    targetEntity: 'The Grand Oberoi Palace',
    rating: 5,
    category: 'Culinary Safety & Temperature',
    tempVerified: '3.5°C Chilled',
    mealsDelivered: '120',
    impactNote: 'Fed 120 residents at community shelter',
    feedbackText: ''
  });

  // Toggle gratitude (like) on a review
  const toggleGratitude = async (id) => {
    let updatedHasLiked = false;
    let updatedCount = 0;

    setFeedbacks(prev => prev.map(item => {
      if (item.id === id) {
        updatedHasLiked = !item.hasLiked;
        updatedCount = updatedHasLiked ? item.gratitudeCount + 1 : Math.max(0, item.gratitudeCount - 1);
        return { ...item, hasLiked: updatedHasLiked, gratitudeCount: updatedCount };
      }
      return item;
    }));

    // Persist to Supabase
    await BackendService.toggleGratitude(id, updatedHasLiked, updatedCount);

    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.8 }
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.authorName || !formData.feedbackText) {
      showNotification('Please enter your name and feedback description', 'error');
      return;
    }

    const feedbackDraft = {
      id: `FB-${Math.floor(600 + Math.random() * 300)}`,
      authorName: formData.authorName,
      authorRole: formData.authorRole,
      authorBadge: formData.authorRole === 'provider' ? 'Hotel Partner' : formData.authorRole === 'ngo' ? 'Verified NGO Dispatcher' : 'Shelter Caretaker',
      targetEntity: formData.targetEntity,
      rating: Number(formData.rating),
      category: formData.category,
      tempVerified: formData.tempVerified,
      mealsDelivered: Number(formData.mealsDelivered) || 100,
      impactNote: formData.impactNote,
      feedbackText: formData.feedbackText,
      date: 'Just now',
      gratitudeCount: 1,
      hasLiked: true,
      verifiedHandover: true
    };

    const savedFeedback = await BackendService.createFeedback(feedbackDraft);

    setFeedbacks([savedFeedback, ...feedbacks]);
    setIsSubmitModalOpen(false);
    setFormData({
      authorName: '',
      authorRole: 'ngo',
      authorBadge: 'Verified NGO Partner',
      targetEntity: 'The Grand Oberoi Palace',
      rating: 5,
      category: 'Culinary Safety & Temperature',
      tempVerified: '3.5°C Chilled',
      mealsDelivered: '120',
      impactNote: 'Fed 120 residents at community shelter',
      feedbackText: ''
    });

    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 }
    });

    showNotification('Feedback & Quality Story saved to Supabase backend!', 'success');
  };

  const filteredFeedbacks = feedbacks.filter(item => {
    if (filterRole === 'all') return true;
    return item.authorRole === filterRole;
  });

  return (
    <section id="feedback-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      
      {/* Section Header & Trust Index Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-brand-orange" />
            Verified Dual-Party Quality & Trust
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-900 font-heading">
            Food Safety & Beneficiary Feedback
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1">
            Real reviews and temperature audit ratings exchanged between 5-star hotel culinary teams, logistics drivers, and shelter caretakers.
          </p>
        </div>

        {/* Action Button: Share Feedback */}
        <div>
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/20 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Share Quality Story / Review</span>
          </button>
        </div>
      </div>

      {/* UNIQUE FEATURE: PLATFORM REPUTATION & SAFETY SCORECARD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gradient-to-br from-forest-900 to-forest-950 text-white p-6 rounded-3xl shadow-xl border border-forest-800">
        <div className="p-3 border-r border-forest-800/80">
          <div className="flex items-center gap-1.5 text-xs text-brand-orange font-bold uppercase">
            <Star className="w-4 h-4 fill-brand-orange" /> Food Quality Index
          </div>
          <div className="text-3xl font-extrabold font-heading mt-1">4.98 <span className="text-xs font-normal text-emerald-200">/ 5.0</span></div>
          <div className="text-[11px] text-emerald-300 mt-0.5">Based on 1,420 handovers</div>
        </div>

        <div className="p-3 border-r border-forest-800/80">
          <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-bold uppercase">
            <ThermometerSnowflake className="w-4 h-4" /> Cold-Chain Integrity
          </div>
          <div className="text-3xl font-extrabold font-heading mt-1">99.6%</div>
          <div className="text-[11px] text-emerald-300 mt-0.5">&lt; 4°C verified by probe</div>
        </div>

        <div className="p-3 border-r border-forest-800/80">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold uppercase">
            <Users className="w-4 h-4" /> Beneficiaries Fed
          </div>
          <div className="text-3xl font-extrabold font-heading mt-1">314K+</div>
          <div className="text-[11px] text-emerald-300 mt-0.5">Zero food safety issues</div>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-1.5 text-xs text-orange-300 font-bold uppercase">
            <Heart className="w-4 h-4 fill-orange-400" /> Gratitude Sent
          </div>
          <div className="text-3xl font-extrabold font-heading mt-1">12,850+</div>
          <div className="text-[11px] text-emerald-300 mt-0.5">Community thank yous</div>
        </div>
      </div>

      {/* Interactive Role Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterRole('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterRole === 'all'
                ? 'bg-forest-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Stories ({feedbacks.length})
          </button>
          <button
            onClick={() => setFilterRole('ngo')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterRole === 'ngo'
                ? 'bg-forest-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-brand-orange" />
            From Verified NGOs
          </button>
          <button
            onClick={() => setFilterRole('provider')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterRole === 'provider'
                ? 'bg-forest-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-forest-800" />
            From Hotel Partners
          </button>
          <button
            onClick={() => setFilterRole('shelter')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterRole === 'shelter'
                ? 'bg-forest-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-yellow-500" />
            Beneficiary Shelters
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Showing <strong>{filteredFeedbacks.length}</strong> authenticated reviews
        </span>
      </div>

      {/* Feedback Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredFeedbacks.map(item => (
          <div 
            key={item.id}
            className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <div>
              {/* Header: Author & Star Rating */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base font-bold text-white shadow-sm ${
                    item.authorRole === 'provider' ? 'bg-forest-900' :
                    item.authorRole === 'ngo' ? 'bg-brand-orange' : 'bg-emerald-700'
                  }`}>
                    {item.authorRole === 'provider' ? '🏨' : item.authorRole === 'ngo' ? '🤝' : '🏡'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-forest-900 font-heading">
                      {item.authorName}
                    </h4>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-500">
                        {item.authorBadge}
                      </span>
                      {item.verifiedHandover && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Handover
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < item.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
                    />
                  ))}
                </div>
              </div>

              {/* Unique Cold-Chain & Impact Meta Badges */}
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-forest-50 text-forest-900 font-semibold border border-forest-100 text-[11px]">
                  <ThermometerSnowflake className="w-3.5 h-3.5 text-forest-800" />
                  {item.tempVerified}
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-50 text-brand-orange font-semibold border border-orange-100 text-[11px]">
                  <Users className="w-3.5 h-3.5" />
                  {item.mealsDelivered} Meals Distributed
                </span>

                <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 font-medium text-[11px]">
                  Target: {item.targetEntity}
                </span>
              </div>

              {/* Feedback Text */}
              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                "{item.feedbackText}"
              </p>
            </div>

            {/* Footer with Impact Note & Gratitude Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                {item.date} • <strong className="text-forest-900">{item.impactNote}</strong>
              </span>

              {/* Interactive Heart Gratitude Button */}
              <button
                onClick={() => toggleGratitude(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 active:scale-95 ${
                  item.hasLiked
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50/50'
                }`}
                title="Send gratitude to this team"
              >
                <Heart className={`w-3.5 h-3.5 ${item.hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{item.gratitudeCount}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* INTERACTIVE MODAL: SUBMIT QUALITY STORY */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-fadeIn">
            
            <div className="bg-forest-900 text-white p-6 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-heading">Submit Quality Audit & Story</h3>
                <p className="text-xs text-emerald-200/80">Rate the handover safety and celebrate community impact</p>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-forest-800 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Your Name / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    placeholder="e.g., Rajesh Kumar (Driver Lead)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Your Role Type *
                  </label>
                  <select
                    value={formData.authorRole}
                    onChange={(e) => setFormData({ ...formData, authorRole: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900 bg-white"
                  >
                    <option value="ngo">Verified NGO Rescue Team</option>
                    <option value="provider">Hotel Culinary / Chef</option>
                    <option value="shelter">Beneficiary Shelter Home</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Target Partner Organization
                  </label>
                  <input
                    type="text"
                    value={formData.targetEntity}
                    onChange={(e) => setFormData({ ...formData, targetEntity: e.target.value })}
                    placeholder="e.g., The Grand Oberoi"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Handover Core Temperature
                  </label>
                  <input
                    type="text"
                    value={formData.tempVerified}
                    onChange={(e) => setFormData({ ...formData, tempVerified: e.target.value })}
                    placeholder="e.g., 3.6°C Chilled"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Meals Distributed
                  </label>
                  <input
                    type="number"
                    value={formData.mealsDelivered}
                    onChange={(e) => setFormData({ ...formData, mealsDelivered: e.target.value })}
                    placeholder="120"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Overall Quality Rating
                  </label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900 bg-white"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5 Stars - Exceptional)</option>
                    <option value="4">⭐⭐⭐⭐ (4 Stars - High Quality)</option>
                    <option value="3">⭐⭐⭐ (3 Stars - Acceptable)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Beneficiary Community Impact
                </label>
                <input
                  type="text"
                  value={formData.impactNote}
                  onChange={(e) => setFormData({ ...formData, impactNote: e.target.value })}
                  placeholder="e.g., Fed 120 senior citizens at Jeevan Jyoti Home"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Your Experience & Safety Review *
                </label>
                <textarea
                  rows="3"
                  required
                  value={formData.feedbackText}
                  onChange={(e) => setFormData({ ...formData, feedbackText: e.target.value })}
                  placeholder="Describe packaging condition, temperature probe results, driver punctuality, and shelter gratitude..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-forest-900"
                ></textarea>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-forest-900 hover:bg-forest-950 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-brand-orange" />
                  Publish Audit Story
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </section>
  );
}
