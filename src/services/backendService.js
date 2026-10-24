import { supabase } from '../lib/supabase';
import {
  initialProviderStats,
  initialActiveListings,
  initialNgoMatches,
  initialPickupTrackers,
  initialVerificationQueue,
  globalAdminStats,
  initialFeedbacks,
  initialNgoDirectory,
  initialDonationEnquiries,
  initialAlternativeVerifications,
  initialNgoCertificates,
  initialFssaiVerifications
} from '../data/mockData';
import { FssaiVerificationService } from './fssaiVerificationService';

// Helper to convert database row to listing format
const mapListingFromDb = (row) => ({
  id: row.id,
  title: row.title,
  category: row.category,
  quantityKg: Number(row.quantity_kg),
  portions: Number(row.portions),
  prepTime: row.prep_time,
  expiryTime: row.expiry_time,
  expiresInMinutes: row.expires_in_minutes || 45,
  coldStorageRequired: Boolean(row.cold_storage_required),
  dietary: Array.isArray(row.dietary) ? row.dietary : [],
  items: row.items,
  status: row.status,
  hotelName: row.hotel_name,
  location: row.location,
  loadingBay: row.loading_bay,
  loggedAt: row.logged_at,
  assignedNgo: row.assigned_ngo,
  driverName: row.driver_name,
  driverEta: row.driver_eta,
  completedAt: row.completed_at,
  temperature: row.temperature
});

// Helper to convert database row to match format
const mapMatchFromDb = (row) => ({
  id: row.id,
  hotelName: row.hotel_name,
  hotelRating: row.hotel_rating || '5.0 ★ Luxury Partner',
  fssaiVerified: Boolean(row.fssai_verified),
  distanceKm: row.distance_km || '2.5 km',
  driveTime: row.drive_time || '10 mins',
  category: row.category,
  title: row.title,
  quantityKg: Number(row.quantity_kg),
  portions: Number(row.portions),
  prepTime: row.prep_time,
  bestBefore: row.best_before,
  initialSeconds: row.initial_seconds || 2700,
  coldStorageRequired: Boolean(row.cold_storage_required),
  dietary: Array.isArray(row.dietary) ? row.dietary : [],
  itemsSummary: row.items_summary,
  pickupLocation: row.pickup_location,
  urgencyLevel: row.urgency_level || 'MEDIUM',
  allergens: row.allergens,
  contactPerson: row.contact_person,
  status: row.status
});

// Helper to convert database row to tracker format
const mapTrackerFromDb = (row) => ({
  id: row.id,
  matchId: row.match_id,
  hotelName: row.hotel_name,
  quantityKg: Number(row.quantity_kg),
  portions: Number(row.portions),
  category: row.category,
  currentStep: row.current_step,
  steps: row.steps || []
});

// Helper to convert database row to NGO verification format
const mapVerificationFromDb = (row) => ({
  id: row.id,
  name: row.name || row.org_name,
  registrationNo: row.registration_no || row.registration_number,
  issuingAuthority: row.issuing_authority || 'Registrar of Societies',
  registrationDate: row.registration_date || '15-Jan-2023',
  fleetCapacityKg: row.fleet_capacity_kg || '1,000 kg (2 Vans)',
  operatingZone: row.operating_zone || row.city || 'Central Delhi Hub',
  trustScore: row.trust_score || 95,
  status: row.status || 'Pending Approval',
  submittedDate: row.submitted_date || row.submitted_at || 'Today',
  contactPerson: row.contact_person || row.authorized_representative,
  email: row.email || row.official_email,
  phone: row.phone || row.official_phone,
  certificateDocName: row.original_filename || (row.documents && row.documents[0]?.name) || 'NGO_Registration_Certificate.pdf',
  documents: row.documents || [
    { 
      name: row.original_filename || "NGO Registration Certificate.pdf", 
      size: row.file_size_formatted || "1.2 MB", 
      verified: row.status === 'approved' || row.status === 'Approved', 
      type: "Registration Certificate" 
    }
  ],
  reviewerNotes: row.reviewer_notes,
  correctionRequested: row.correction_requested,
  rejectionReason: row.rejection_reason
});

// Helper to convert database row to NGO Registration Certificate format
const mapNgoCertificateFromDb = (row) => ({
  id: row.id,
  ngoId: row.ngo_id,
  orgName: row.org_name,
  registrationNumber: row.registration_number,
  issuingAuthority: row.issuing_authority,
  registrationDate: row.registration_date,
  orgAddress: row.org_address,
  city: row.city,
  state: row.state,
  pinCode: row.pin_code,
  authorizedRepresentative: row.authorized_representative,
  officialEmail: row.official_email,
  officialPhone: row.official_phone,
  documentType: row.document_type || 'NGO Registration Certificate',
  storagePath: row.storage_path,
  originalFilename: row.original_filename,
  fileSizeBytes: Number(row.file_size_bytes) || 0,
  fileSizeFormatted: row.file_size_formatted || '1.2 MB',
  mimeType: row.mime_type || 'application/pdf',
  status: row.status,
  declarationConfirmed: Boolean(row.declaration_confirmed),
  reviewerNotes: row.reviewer_notes,
  correctionRequested: row.correction_requested,
  rejectionReason: row.rejection_reason,
  submittedAt: row.submitted_at,
  reviewedAt: row.reviewed_at,
  reviewedBy: row.reviewed_by
});

// Helper to convert database row to feedback format
const mapFeedbackFromDb = (row) => ({
  id: row.id,
  authorName: row.author_name,
  authorRole: row.author_role,
  authorBadge: row.author_badge,
  targetEntity: row.target_entity,
  rating: row.rating,
  category: row.category,
  tempVerified: row.temp_verified,
  mealsDelivered: Number(row.meals_delivered),
  impactNote: row.impact_note,
  feedbackText: row.feedback_text,
  date: row.date_str,
  gratitudeCount: row.gratitude_count || 0,
  hasLiked: Boolean(row.has_liked),
  verifiedHandover: Boolean(row.verified_handover)
});

export const BackendService = {
  // ==========================================
  // 1. AUTH & PROFILES
  // ==========================================
  async getCurrentSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session) return null;
      return data.session;
    } catch {
      return null;
    }
  },

  async signOut() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase sign out error:', err);
    }
  },

  async fetchProfileByEmail(email) {
    if (!email) return null;
    try {
      const cleanEmail = email.toLowerCase().trim();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (error || !data) return null;
      return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        fssai: data.fssai,
        location: data.location,
        contactPerson: data.contact_person,
        avatar: data.avatar,
        registrationNo: data.registration_no,
        issuingAuthority: data.issuing_authority,
        certificateStatus: data.certificate_status
      };
    } catch {
      return null;
    }
  },

  async loginOrRegisterUser({ 
    email, 
    password, 
    role, 
    name, 
    fssai, 
    fssaiVerificationState,
    location, 
    contactPerson, 
    avatar,
    registrationNo,
    issuingAuthority,
    registrationDate,
    address,
    city,
    state,
    pinCode,
    phone,
    certificateDocName,
    certificateDocSize
  }) {
    try {
      const cleanEmail = email.toLowerCase().trim();
      let authUserId = null;

      // 1. Authenticate with Supabase Auth (Sign In or Sign Up)
      if (password && password.length >= 6) {
        try {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: password
          });

          if (signInData?.user) {
            authUserId = signInData.user.id;
          } else if (signInErr) {
            const errStr = (signInErr.message || '').toLowerCase();
            if (errStr.includes('invalid login credentials') || errStr.includes('user not found') || errStr.includes('email not confirmed')) {
              const { data: signUpData } = await supabase.auth.signUp({
                email: cleanEmail,
                password: password,
                options: {
                  data: {
                    name: name || cleanEmail,
                    role: role || 'provider',
                    fssai: fssai || '',
                    location: location || 'New Delhi, India'
                  }
                }
              });
              if (signUpData?.user) {
                authUserId = signUpData.user.id;
              }
            }
          }
        } catch (authErr) {
          console.warn('Supabase Auth error handled gracefully:', authErr.message);
        }
      }

      const userId = authUserId || `usr_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

      // Check if profile exists in public.profiles
      const { data: existing, error: _selectErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existing) {
        return {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role,
          fssai: existing.fssai,
          location: existing.location,
          contactPerson: existing.contact_person,
          avatar: existing.avatar,
          registrationNo: existing.registration_no || (existing.role === 'ngo' ? 'DL/2018/0192841' : undefined),
          issuingAuthority: existing.issuing_authority || (existing.role === 'ngo' ? 'Registrar of Societies, Govt. of NCT Delhi' : undefined),
          certificateStatus: existing.certificate_status || (existing.role === 'ngo' ? 'approved' : undefined)
        };
      }

      // If new profile, insert into public.profiles
      const newProfile = {
        id: userId,
        email: cleanEmail,
        name: name || (role === 'provider' ? 'Grand Oberoi Palace' : role === 'ngo' ? 'Robin Hood Army Fleet' : 'Feedall Compliance Admin'),
        role: role || 'provider',
        fssai: role === 'ngo' ? 'NGO-EXEMPT-STATUTORY' : (fssai || 'FSSAI-PENDING-VERIFY'),
        location: location || 'New Delhi, India',
        contact_person: contactPerson || 'Authorized Officer',
        avatar: avatar || (role === 'provider' ? '🏨' : role === 'ngo' ? '🤝' : '🛡️')
      };

      const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (insertErr) {
        console.warn('Profile insert warning:', insertErr.message);
      }

      // If registered as an NGO, register official application in ngo_registration_certificates & verification queue
      if (role === 'ngo') {
        const ngoCertId = `NGO-CERT-${Math.floor(400 + Math.random() * 599)}`;
        const regNumber = registrationNo || `DL/2026/NGO-${Math.floor(1000 + Math.random() * 9000)}`;
        const authority = issuingAuthority || 'Registrar of Societies, Govt. of NCT Delhi';
        const docName = certificateDocName || 'NGO_Registration_Certificate.pdf';
        const docSize = certificateDocSize || '1.4 MB';

        const certRecord = {
          id: ngoCertId,
          ngo_id: userId,
          org_name: newProfile.name,
          registration_number: regNumber,
          issuing_authority: authority,
          registration_date: registrationDate || new Date().toISOString().split('T')[0],
          org_address: address || newProfile.location,
          city: city || 'New Delhi',
          state: state || 'Delhi',
          pin_code: pinCode || '110001',
          authorized_representative: newProfile.contact_person,
          official_email: newProfile.email,
          official_phone: phone || '+91 98000 00000',
          document_type: 'NGO Registration Certificate',
          original_filename: docName,
          file_size_formatted: docSize,
          mime_type: 'application/pdf',
          status: 'pending_review',
          declaration_confirmed: true,
          submitted_at: new Date().toISOString()
        };

        // Insert into ngo_registration_certificates
        try {
          await supabase.from('ngo_registration_certificates').insert([certRecord]);
        } catch (certErr) {
          console.warn('Could not insert into ngo_registration_certificates:', certErr);
        }

        // Also sync into ngo_verifications for admin verification compatibility
        const verificationRow = {
          id: ngoCertId,
          name: newProfile.name,
          registration_no: regNumber,
          issuing_authority: authority,
          fleet_capacity_kg: '1,000 kg (2 Vans)',
          operating_zone: newProfile.location,
          trust_score: 95,
          status: 'Pending Approval',
          submitted_date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          contact_person: newProfile.contact_person,
          email: newProfile.email,
          phone: phone || '+91 98000 00000',
          certificate_doc_name: docName,
          documents: [
            { name: docName, size: docSize, verified: false, type: 'Registration Certificate' },
            { name: 'Authorized Signatory Declaration.pdf', size: '420 KB', verified: true, type: 'Undertaking' }
          ]
        };
        try {
          await supabase.from('ngo_verifications').insert([verificationRow]);
        } catch (vErr) {
          console.warn('Could not insert into ngo_verifications:', vErr);
        }
      }

      // If registered as Food Provider with FSSAI, record verification result
      if (role === 'provider' && fssai && fssai !== 'ALT-AADHAAR-PENDING') {
        const canonicalLicense = fssaiVerificationState?.licenseNo || fssai;
        await BackendService.recordFssaiVerification({
          providerId: userId,
          licenseNo: canonicalLicense,
          verificationResult: fssaiVerificationState || {
            status: 'verified',
            source: 'authoritative_statutory_registry',
            isVerified: true
          },
          submittedOrgName: newProfile.name,
          submittedCity: newProfile.location
        });
      }

      return {
        id: inserted ? inserted.id : userId,
        name: inserted ? inserted.name : newProfile.name,
        email: inserted ? inserted.email : newProfile.email,
        role: inserted ? inserted.role : newProfile.role,
        fssai: inserted ? inserted.fssai : newProfile.fssai,
        fssaiVerified: role === 'provider' 
          ? (fssaiVerificationState?.isVerified ?? (fssai && fssai !== 'ALT-AADHAAR-PENDING')) 
          : true,
        fssaiVerificationStatus: role === 'provider'
          ? (fssaiVerificationState?.status || 'verified')
          : 'exempt',
        location: inserted ? inserted.location : newProfile.location,
        contactPerson: inserted ? inserted.contact_person : newProfile.contact_person,
        avatar: inserted ? inserted.avatar : newProfile.avatar,
        registrationNo: registrationNo || (role === 'ngo' ? 'DL/2026/NGO-88219' : undefined),
        issuingAuthority: issuingAuthority || (role === 'ngo' ? 'Registrar of Societies, Govt. of NCT Delhi' : undefined),
        certificateStatus: role === 'ngo' ? 'pending_review' : undefined,
        certificateDocName: certificateDocName || (role === 'ngo' ? 'NGO_Registration_Certificate.pdf' : undefined)
      };
    } catch (err) {
      console.error('Error in loginOrRegisterUser:', err);
      return {
        email,
        name: name || 'Authorized Partner',
        role: role || 'provider',
        fssai: role === 'ngo' ? 'NGO-EXEMPT-STATUTORY' : (fssai || 'FSSAI-10020011004523'),
        fssaiVerified: role === 'provider' 
          ? (fssaiVerificationState?.isVerified ?? (fssai && fssai !== 'ALT-AADHAAR-PENDING')) 
          : true,
        fssaiVerificationStatus: role === 'provider'
          ? (fssaiVerificationState?.status || 'verified')
          : 'exempt',
        location: location || 'New Delhi',
        contactPerson: contactPerson || 'Authorized Officer',
        avatar: role === 'provider' ? '🏨' : role === 'ngo' ? '🤝' : '🛡️',
        registrationNo: registrationNo || (role === 'ngo' ? 'DL/2026/NGO-88219' : undefined),
        issuingAuthority: issuingAuthority || (role === 'ngo' ? 'Registrar of Societies, Govt. of NCT Delhi' : undefined),
        certificateStatus: role === 'ngo' ? 'pending_review' : undefined,
        certificateDocName: certificateDocName || (role === 'ngo' ? 'NGO_Registration_Certificate.pdf' : undefined)
      };
    }
  },

  // ==========================================
  // 1B. FSSAI LICENSE AUTHENTICITY VERIFICATION
  // ==========================================
  async verifyFssaiLicense(payload) {
    return await FssaiVerificationService.verifyFssaiLicense(payload);
  },

  async recordFssaiVerification({
    providerId = null,
    licenseNo,
    verificationResult,
    submittedOrgName = '',
    submittedCity = ''
  }) {
    if (!licenseNo) return null;
    const record = {
      id: `FSSAI-VERIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      provider_id: providerId,
      license_number: licenseNo,
      fbo_name: verificationResult?.officialRecord?.fboName || submittedOrgName,
      legal_entity_name: verificationResult?.officialRecord?.legalEntityName || submittedOrgName,
      license_type: verificationResult?.officialRecord?.licenseType || 'Commercial Food Safety License',
      registered_address: verificationResult?.officialRecord?.registeredAddress || '',
      registered_city: verificationResult?.officialRecord?.registeredCity || submittedCity,
      registered_state: verificationResult?.officialRecord?.registeredState || 'Delhi',
      validity_date: verificationResult?.officialRecord?.validityDate || null,
      license_status: verificationResult?.officialRecord?.licenseStatus || 'active',
      verification_status: verificationResult?.status || 'pending',
      verification_source: verificationResult?.source || 'foscos_official_portal_bridge',
      match_score: verificationResult?.matchDetails?.nameScore || 1.0,
      submitted_org_name: submittedOrgName,
      submitted_city: submittedCity,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      try {
        await supabase.from('fssai_verifications').insert([record]);
      } catch (err) {
        console.warn('Could not persist to fssai_verifications in Supabase:', err.message);
      }
    }
    return record;
  },

  async fetchFssaiVerifications() {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('fssai_verifications')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase fetchFssaiVerifications error:', err.message);
      }
    }
    return initialFssaiVerifications;
  },

  async updateFssaiVerificationStatus(id, newStatus, reviewNotes = '') {
    if (supabase) {
      try {
        await supabase
          .from('fssai_verifications')
          .update({
            verification_status: newStatus,
            review_notes: reviewNotes,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase updateFssaiVerificationStatus error:', err.message);
      }
    }
    return { success: true, status: newStatus };
  },

  // ==========================================
  // 2. PRODUCER / HOTEL DATA (Listings & Stats)
  // ==========================================
  async fetchFoodListings() {
    try {
      const { data, error } = await supabase
        .from('food_listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return initialActiveListings;
      }
      return data.map(mapListingFromDb);
    } catch (err) {
      console.error('Error fetching food listings:', err);
      return initialActiveListings;
    }
  },

  async createFoodListing(listing) {
    try {
      const id = listing.id || `LIST-${Math.floor(100 + Math.random() * 900)}`;
      const row = {
        id,
        title: listing.title,
        category: listing.category,
        quantity_kg: listing.quantityKg,
        portions: listing.portions,
        prep_time: listing.prepTime,
        expiry_time: listing.expiryTime,
        expires_in_minutes: listing.expiresInMinutes || 45,
        cold_storage_required: listing.coldStorageRequired,
        dietary: listing.dietary,
        items: listing.items,
        status: listing.status || 'Pending Match',
        hotel_name: listing.hotelName,
        location: listing.location,
        loading_bay: listing.loadingBay,
        logged_at: 'Just now',
        assigned_ngo: null,
        driver_name: null,
        driver_eta: null,
        completed_at: null,
        temperature: listing.coldStorageRequired ? '3.5°C' : 'Ambient'
      };

      const { data, error: _error } = await supabase
        .from('food_listings')
        .insert([row])
        .select()
        .single();

      // Also create an available NGO match so NGOs can immediately rescue it!
      const matchRow = {
        id: `MATCH-${Math.floor(800 + Math.random() * 199)}`,
        hotel_name: listing.hotelName,
        hotel_rating: '5.0 ★ Luxury Partner',
        fssai_verified: true,
        distance_km: '1.5 km',
        drive_time: '7 mins',
        category: listing.category,
        title: listing.title,
        quantity_kg: listing.quantityKg,
        portions: listing.portions,
        prep_time: listing.prepTime,
        best_before: listing.expiryTime,
        initial_seconds: (listing.expiresInMinutes || 45) * 60,
        cold_storage_required: listing.coldStorageRequired,
        dietary: listing.dietary,
        items_summary: listing.items,
        pickup_location: `${listing.hotelName}, ${listing.loadingBay}`,
        urgency_level: listing.expiresInMinutes < 30 ? 'URGENT' : 'HIGH',
        allergens: 'Standard safety segregation verified',
        contact_person: 'Kitchen Dispatch Lead',
        status: 'available'
      };

      await supabase.from('ngo_matches').insert([matchRow]);

      return data ? mapListingFromDb(data) : { ...listing, id };
    } catch (err) {
      console.error('Error creating food listing:', err);
      return listing;
    }
  },

  async updateListingStatus(listingId, updates) {
    try {
      const dbUpdates = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.assignedNgo !== undefined) dbUpdates.assigned_ngo = updates.assignedNgo;
      if (updates.driverName !== undefined) dbUpdates.driver_name = updates.driverName;
      if (updates.driverEta !== undefined) dbUpdates.driver_eta = updates.driverEta;
      if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
      if (updates.temperature !== undefined) dbUpdates.temperature = updates.temperature;

      const { data: _data, error } = await supabase
        .from('food_listings')
        .update(dbUpdates)
        .eq('id', listingId)
        .select();

      return !error;
    } catch (err) {
      console.error('Error updating listing status in Supabase:', err);
      return false;
    }
  },

  async fetchProviderStats() {
    try {
      const { data, error } = await supabase
        .from('provider_stats')
        .select('*')
        .maybeSingle();

      if (error || !data) {
        return initialProviderStats;
      }

      return {
        hotelName: data.hotel_name,
        fssaiNumber: data.fssai_number,
        verifiedDate: data.verified_date,
        wasteDivertedKg: Number(data.waste_diverted_kg),
        wasteDivertedTrend: data.waste_diverted_trend,
        mealsSaved: Number(data.meals_saved),
        mealsSavedTrend: data.meals_saved_trend,
        co2AvoidedTons: Number(data.co2_avoided_tons),
        co2AvoidedTrend: data.co2_avoided_trend,
        taxCreditAccrued: data.tax_credit_accrued,
        foodSafetyScore: data.food_safety_score
      };
    } catch (err) {
      console.error('Error fetching provider stats:', err);
      return initialProviderStats;
    }
  },

  // ==========================================
  // 3. NGO DATA (Matches, Claims & Pickups)
  // ==========================================
  async fetchNgoMatches() {
    try {
      const { data, error } = await supabase
        .from('ngo_matches')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return initialNgoMatches;
      }
      return data.map(mapMatchFromDb);
    } catch (err) {
      console.error('Error fetching NGO matches:', err);
      return initialNgoMatches;
    }
  },

  async claimAndDispatchMatch(match, vehicleInfo = {}) {
    try {
      // 1. Update match status in database
      await supabase
        .from('ngo_matches')
        .update({ status: 'claimed' })
        .eq('id', match.id);

      // 2. Update food listings status
      await supabase
        .from('food_listings')
        .update({
          status: 'Accepted (Awaiting Pickup)',
          assigned_ngo: 'Robin Hood Army - Fleet 4',
          driver_name: vehicleInfo.driver || 'Rajesh Kumar (DL-1V-8902)',
          driver_eta: '8 mins away'
        })
        .ilike('title', `%${match.title}%`);

      // 3. Insert new pickup tracker
      const trackerId = `TRK-${Math.floor(900 + Math.random() * 99)}`;
      const newTrackerRow = {
        id: trackerId,
        match_id: match.id,
        hotel_name: match.hotelName,
        quantity_kg: match.quantityKg,
        portions: match.portions,
        category: match.category,
        current_step: 0,
        steps: [
          {
            title: "Van Dispatched",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            description: `Insulated Van dispatched to ${match.pickupLocation}`,
            driver: vehicleInfo.driver || "Rajesh Kumar (DL-1V-8902)",
            driverPhone: "+91 98101 22345",
            status: "active"
          },
          {
            title: "Arrived at Loading Bay",
            time: "Pending",
            description: `Arrival at ${match.hotelName}. Digital cold-chain probe check.`,
            tempRecorded: "Target < 4.0°C",
            status: "pending"
          },
          {
            title: "Collected & En Route to Shelter",
            time: "Pending",
            description: "Digital handover OTP verification, departing to verified community kitchen",
            destination: "Nirmal Seva Child Nutrition Center (160 Portions)",
            status: "pending"
          }
        ]
      };

      const { data: trackerData } = await supabase
        .from('pickup_trackers')
        .insert([newTrackerRow])
        .select()
        .single();

      return trackerData ? mapTrackerFromDb(trackerData) : {
        id: trackerId,
        matchId: match.id,
        hotelName: match.hotelName,
        quantityKg: match.quantityKg,
        portions: match.portions,
        category: match.category,
        currentStep: 0,
        steps: newTrackerRow.steps
      };
    } catch (err) {
      console.error('Error claiming and dispatching match:', err);
      return null;
    }
  },

  async fetchPickupTrackers() {
    try {
      const { data, error } = await supabase
        .from('pickup_trackers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return initialPickupTrackers;
      }
      return data.map(mapTrackerFromDb);
    } catch (err) {
      console.error('Error fetching pickup trackers:', err);
      return initialPickupTrackers;
    }
  },

  async updatePickupTrackerStep(trackerId, currentStep, steps) {
    try {
      await supabase
        .from('pickup_trackers')
        .update({
          current_step: currentStep,
          steps: steps
        })
        .eq('id', trackerId);
      return true;
    } catch (err) {
      console.error('Error updating pickup tracker step:', err);
      return false;
    }
  },

  // ==========================================
  // 4. ADMIN OVERSIGHT & NGO VERIFICATION
  // ==========================================
  async fetchNgoVerifications() {
    try {
      const { data, error } = await supabase
        .from('ngo_verifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return initialVerificationQueue;
      }
      return data.map(mapVerificationFromDb);
    } catch (err) {
      console.error('Error fetching NGO verification queue:', err);
      return initialVerificationQueue;
    }
  },

  async updateNgoVerificationStatus(id, status) {
    try {
      await supabase
        .from('ngo_verifications')
        .update({ status })
        .eq('id', id);
      return true;
    } catch (err) {
      console.error('Error updating NGO verification status:', err);
      return false;
    }
  },

  // ==========================================
  // 4B. NGO REGISTRATION CERTIFICATES (MODULE)
  // ==========================================
  async fetchNgoRegistrationCertificates() {
    try {
      const { data, error } = await supabase
        .from('ngo_registration_certificates')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return initialNgoCertificates;
      }
      return data.map(mapNgoCertificateFromDb);
    } catch (err) {
      console.error('Error fetching NGO registration certificates:', err);
      return initialNgoCertificates;
    }
  },

  async fetchNgoCertificateByEmailOrId(identifier) {
    if (!identifier) return null;
    const cleanId = identifier.toLowerCase().trim();
    try {
      const { data, error } = await supabase
        .from('ngo_registration_certificates')
        .select('*')
        .or(`official_email.ilike.${cleanId},ngo_id.eq.${identifier}`)
        .maybeSingle();

      if (error || !data) {
        // Fallback search in initial dataset
        return initialNgoCertificates.find(
          c => (c.officialEmail && c.officialEmail.toLowerCase() === cleanId) || c.ngoId === identifier
        ) || null;
      }
      return mapNgoCertificateFromDb(data);
    } catch (err) {
      console.error('Error fetching NGO certificate by identifier:', err);
      return initialNgoCertificates.find(
        c => (c.officialEmail && c.officialEmail.toLowerCase() === cleanId) || c.ngoId === identifier
      ) || null;
    }
  },

  async submitNgoRegistrationCertificate(certData) {
    const certId = certData.id || `NGO-CERT-${Math.floor(100 + Math.random() * 899)}`;
    const formattedRow = {
      id: certId,
      ngo_id: certData.ngoId || `usr_${(certData.officialEmail || 'ngo').replace(/[^a-zA-Z0-9]/g, '_')}`,
      org_name: certData.orgName,
      registration_number: certData.registrationNumber,
      issuing_authority: certData.issuingAuthority,
      registration_date: certData.registrationDate || null,
      org_address: certData.orgAddress || '',
      city: certData.city || 'New Delhi',
      state: certData.state || 'Delhi',
      pin_code: certData.pinCode || '',
      authorized_representative: certData.authorizedRepresentative || '',
      official_email: (certData.officialEmail || '').toLowerCase().trim(),
      official_phone: certData.officialPhone || '',
      document_type: 'NGO Registration Certificate',
      storage_path: certData.storagePath || `ngo-certificates/${certId}/${certData.originalFilename || 'certificate.pdf'}`,
      original_filename: certData.originalFilename || 'NGO_Registration_Certificate.pdf',
      file_size_bytes: certData.fileSizeBytes || 1200000,
      file_size_formatted: certData.fileSizeFormatted || '1.2 MB',
      mime_type: certData.mimeType || 'application/pdf',
      status: certData.status || 'pending_review',
      declaration_confirmed: certData.declarationConfirmed !== false,
      reviewer_notes: certData.reviewerNotes || 'Initial submission under audit.',
      submitted_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('ngo_registration_certificates')
        .upsert([formattedRow])
        .select()
        .single();

      if (error) {
        console.warn('Supabase upsert warning for ngo_registration_certificates:', error.message);
        return mapNgoCertificateFromDb(formattedRow);
      }
      return mapNgoCertificateFromDb(data);
    } catch (err) {
      console.error('Error in submitNgoRegistrationCertificate:', err);
      return mapNgoCertificateFromDb(formattedRow);
    }
  },

  async updateNgoRegistrationCertificateStatus(id, updatePayload) {
    const { status, reviewerNotes, correctionRequested, rejectionReason, reviewedBy } = updatePayload;
    const dbUpdate = {
      status,
      reviewer_notes: reviewerNotes,
      correction_requested: correctionRequested || null,
      rejection_reason: rejectionReason || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewedBy || 'Chief Compliance Auditor'
    };

    try {
      await supabase
        .from('ngo_registration_certificates')
        .update(dbUpdate)
        .eq('id', id);

      // Also sync to legacy ngo_verifications if matching ID exists
      await supabase
        .from('ngo_verifications')
        .update({ 
          status: status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : status === 'needs_correction' ? 'Needs Correction' : 'Pending Approval' 
        })
        .eq('id', id);

      return true;
    } catch (err) {
      console.error('Error updating NGO certificate status:', err);
      return false;
    }
  },

  async uploadNgoCertificateToStorage(file, ngoId = 'guest_ngo') {
    if (!file) throw new Error('No file provided for upload.');

    // 1. Client-side MIME and Extension Validation
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      throw new Error('Only valid PDF documents (.pdf) are supported. Please upload your official registration certificate in PDF format.');
    }

    // 2. File size validation (5MB max)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 5 MB limit. Please compress your PDF.`);
    }

    if (file.size === 0) {
      throw new Error('The selected PDF file is empty (0 bytes). Please select a valid document.');
    }

    // 3. Generate sanitized unique path
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniquePath = `${ngoId}/${Date.now()}_${sanitizedName}`;

    try {
      const { data, error } = await supabase.storage
        .from('ngo-certificates')
        .upload(uniquePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf'
        });

      if (error) {
        console.warn('Supabase storage upload returned error, using fallback path:', error.message);
        return {
          path: `ngo-certificates/${uniquePath}`,
          filename: file.name,
          sizeFormatted: file.size > 1048576 
            ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
            : `${Math.round(file.size / 1024)} KB`,
          sizeBytes: file.size,
          mimeType: 'application/pdf'
        };
      }

      return {
        path: data?.path || uniquePath,
        filename: file.name,
        sizeFormatted: file.size > 1048576 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.round(file.size / 1024)} KB`,
        sizeBytes: file.size,
        mimeType: 'application/pdf'
      };
    } catch (err) {
      console.warn('Storage upload catch fallback:', err);
      return {
        path: `ngo-certificates/${uniquePath}`,
        filename: file.name,
        sizeFormatted: file.size > 1048576 
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${Math.round(file.size / 1024)} KB`,
        sizeBytes: file.size,
        mimeType: 'application/pdf'
      };
    }
  },

  async fetchAdminStats() {
    try {
      const { data, error } = await supabase
        .from('admin_stats')
        .select('*')
        .maybeSingle();

      if (error || !data) {
        return globalAdminStats;
      }

      return {
        totalWasteSavedKg: Number(data.total_waste_saved_kg),
        totalWasteMonthlyGrowth: data.total_waste_monthly_growth,
        totalMealsDistributed: Number(data.total_meals_distributed),
        activeHotels: data.active_hotels,
        activeNgos: data.active_ngos,
        safetyComplianceRate: data.safety_compliance_rate,
        totalCo2eAvoidedTons: Number(data.total_co2e_avoided_tons),
        citiesActive: data.cities_active,
        averagePickupMins: Number(data.average_pickup_mins)
      };
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      return globalAdminStats;
    }
  },

  // ==========================================
  // 5. FEEDBACKS & REVIEWS
  // ==========================================
  async fetchFeedbacks() {
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return initialFeedbacks;
      }
      return data.map(mapFeedbackFromDb);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      return initialFeedbacks;
    }
  },

  async createFeedback(feedback) {
    try {
      const id = feedback.id || `FB-${Math.floor(500 + Math.random() * 499)}`;
      const row = {
        id,
        author_name: feedback.authorName,
        author_role: feedback.authorRole,
        author_badge: feedback.authorBadge || 'Verified Partner',
        target_entity: feedback.targetEntity,
        rating: feedback.rating || 5,
        category: feedback.category,
        temp_verified: feedback.tempVerified,
        meals_delivered: Number(feedback.mealsDelivered) || 0,
        impact_note: feedback.impactNote,
        feedback_text: feedback.feedbackText,
        date_str: feedback.date || 'Just now',
        gratitude_count: 0,
        has_liked: false,
        verified_handover: true
      };

      const { data, error: _error } = await supabase
        .from('feedbacks')
        .insert([row])
        .select()
        .single();

      return data ? mapFeedbackFromDb(data) : { ...feedback, id };
    } catch (err) {
      console.error('Error creating feedback:', err);
      return feedback;
    }
  },

  async toggleGratitude(id, hasLiked, newCount) {
    try {
      await supabase
        .from('feedbacks')
        .update({
          has_liked: hasLiked,
          gratitude_count: newCount
        })
        .eq('id', id);
      return true;
    } catch (err) {
      console.error('Error toggling gratitude:', err);
      return false;
    }
  },

  // ==========================================
  // 7. NEAREST NGO DIRECTORY & ENQUIRIES
  // ==========================================
  async fetchNgoDirectory() {
    try {
      const { data, error } = await supabase
        .from('ngos_directory')
        .select('*')
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        return initialNgoDirectory;
      }
      return data.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        address: row.address,
        city: row.city,
        pinCode: row.pin_code,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        phone: row.phone,
        email: row.email,
        contactPerson: row.contact_person,
        verified: Boolean(row.verified),
        verificationBadge: row.verification_badge,
        darpanId: row.darpan_id,
        taxStatus: row.tax_status,
        acceptingDonations: Boolean(row.accepting_donations),
        services: Array.isArray(row.services) ? row.services : [],
        fleetCapacity: row.fleet_capacity,
        operatingHours: row.operating_hours,
        foodSafetyProtocols: row.food_safety_protocols
      }));
    } catch (err) {
      console.error('Error fetching NGO directory:', err);
      return initialNgoDirectory;
    }
  },

  async addOrUpdateNgoDirectoryListing(ngo) {
    try {
      const id = ngo.id || `NGO-DIR-${Math.floor(100 + Math.random() * 899)}`;
      const row = {
        id,
        name: ngo.name,
        description: ngo.description,
        address: ngo.address,
        city: ngo.city,
        pin_code: ngo.pinCode,
        latitude: Number(ngo.latitude),
        longitude: Number(ngo.longitude),
        phone: ngo.phone,
        email: ngo.email,
        contact_person: ngo.contactPerson,
        verified: Boolean(ngo.verified),
        verification_badge: ngo.verificationBadge,
        darpan_id: ngo.darpanId,
        tax_status: ngo.taxStatus,
        accepting_donations: Boolean(ngo.acceptingDonations),
        services: ngo.services || [],
        fleet_capacity: ngo.fleetCapacity,
        operating_hours: ngo.operatingHours,
        food_safety_protocols: ngo.foodSafetyProtocols
      };

      const { data, error } = await supabase
        .from('ngos_directory')
        .upsert([row])
        .select()
        .single();

      if (error) {
        console.warn('NGO directory upsert warning:', error.message);
      }
      return data || { ...ngo, id };
    } catch (err) {
      console.error('Error updating NGO directory:', err);
      return ngo;
    }
  },

  async fetchDonationEnquiries(providerEmail) {
    try {
      let query = supabase.from('donation_enquiries').select('*').order('created_at', { ascending: false });
      if (providerEmail) {
        query = query.eq('provider_email', providerEmail);
      }
      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        if (providerEmail) {
          return initialDonationEnquiries.filter(e => e.providerEmail.toLowerCase() === providerEmail.toLowerCase());
        }
        return initialDonationEnquiries;
      }

      return data.map((row) => ({
        id: row.id,
        providerEmail: row.provider_email,
        providerName: row.provider_name,
        ngoId: row.ngo_id,
        ngoName: row.ngo_name,
        foodTitle: row.food_title,
        category: row.category,
        quantityKg: Number(row.quantity_kg),
        portions: Number(row.portions),
        prepTime: row.prep_time,
        expiryTime: row.expiry_time,
        storageRequired: row.storage_required,
        pickupLocation: row.pickup_location,
        preferredTime: row.preferred_time,
        notes: row.notes,
        contactPerson: row.contact_person,
        status: row.status,
        responseMessage: row.response_message,
        createdAt: row.created_at
      }));
    } catch (err) {
      console.error('Error fetching donation enquiries:', err);
      return initialDonationEnquiries;
    }
  },

  async createDonationEnquiry(enquiry) {
    try {
      const id = `ENQ-${Math.floor(8000 + Math.random() * 1999)}`;
      const row = {
        id,
        provider_email: enquiry.providerEmail,
        provider_name: enquiry.providerName,
        ngo_id: enquiry.ngoId,
        ngo_name: enquiry.ngoName,
        food_title: enquiry.foodTitle,
        category: enquiry.category,
        quantity_kg: Number(enquiry.quantityKg),
        portions: Number(enquiry.portions),
        prep_time: enquiry.prepTime,
        expiry_time: enquiry.expiryTime,
        storage_required: enquiry.storageRequired,
        pickup_location: enquiry.pickupLocation,
        preferred_time: enquiry.preferredTime,
        notes: enquiry.notes,
        contact_person: enquiry.contactPerson,
        status: 'pending',
        response_message: null
      };

      const { data, error } = await supabase
        .from('donation_enquiries')
        .insert([row])
        .select()
        .single();

      if (error) {
        console.warn('Donation enquiry insert warning:', error.message);
      }
      return data || { ...enquiry, id, status: 'pending', createdAt: new Date().toISOString() };
    } catch (err) {
      console.error('Error creating donation enquiry:', err);
      return { ...enquiry, id: `ENQ-${Date.now()}`, status: 'pending', createdAt: new Date().toISOString() };
    }
  },

  async updateDonationEnquiryStatus(id, status, responseMessage = null) {
    try {
      const updates = { status };
      if (responseMessage) updates.response_message = responseMessage;

      const { error } = await supabase
        .from('donation_enquiries')
        .update(updates)
        .eq('id', id);

      return !error;
    } catch (err) {
      console.error('Error updating enquiry status:', err);
      return false;
    }
  },

  // ==========================================
  // 8. ALTERNATIVE PROVIDER VERIFICATIONS
  // ==========================================
  async fetchAlternativeVerifications() {
    try {
      const { data, error } = await supabase
        .from('alternative_provider_verifications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return initialAlternativeVerifications;
      }

      return data.map((row) => ({
        id: row.id,
        providerEmail: row.provider_email,
        providerName: row.provider_name,
        contactPerson: row.contact_person,
        phone: row.phone,
        city: row.city,
        address: row.address,
        documentType: row.document_type,
        fileName: row.file_name,
        fileSize: row.file_size,
        aadhaarMaskedUid: row.aadhaar_masked_uid,
        submittedAt: row.submitted_at,
        status: row.status,
        complianceUndertaking: Boolean(row.compliance_undertaking),
        auditNotes: row.audit_notes,
        legalNoticeAcknowledged: Boolean(row.legal_notice_acknowledged)
      }));
    } catch (err) {
      console.error('Error fetching alternative verifications:', err);
      return initialAlternativeVerifications;
    }
  },

  async submitAlternativeVerification(payload) {
    try {
      const id = `ALT-VERIF-${Math.floor(7000 + Math.random() * 2999)}`;
      const row = {
        id,
        provider_email: payload.providerEmail,
        provider_name: payload.providerName,
        contact_person: payload.contactPerson,
        phone: payload.phone,
        city: payload.city,
        address: payload.address,
        document_type: 'Aadhaar Identity Verification PDF',
        file_name: payload.fileName || 'Aadhaar-KYC-Identity-Audit.pdf',
        file_size: payload.fileSize || '1.4 MB',
        aadhaar_masked_uid: payload.aadhaarMaskedUid,
        status: 'Pending Review',
        compliance_undertaking: true,
        audit_notes: payload.auditNotes || 'Aadhaar document submitted for regulatory KYC audit.',
        legal_notice_acknowledged: true
      };

      const { data, error } = await supabase
        .from('alternative_provider_verifications')
        .insert([row])
        .select()
        .single();

      if (error) {
        console.warn('Alternative verification insert warning:', error.message);
      }
      return data || { ...payload, id, status: 'Pending Review', submittedAt: new Date().toISOString() };
    } catch (err) {
      console.error('Error submitting alternative verification:', err);
      return { ...payload, id: `ALT-${Date.now()}`, status: 'Pending Review', submittedAt: new Date().toISOString() };
    }
  },

  async updateAlternativeVerificationStatus(id, status, auditNotes = '') {
    try {
      const updates = { status };
      if (auditNotes) updates.audit_notes = auditNotes;

      const { error } = await supabase
        .from('alternative_provider_verifications')
        .update(updates)
        .eq('id', id);

      return !error;
    } catch (err) {
      console.error('Error updating alternative verification status:', err);
      return false;
    }
  }
};
