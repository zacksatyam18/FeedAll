-- ====================================================================
-- FEEDALL: NGO REGISTRATION CERTIFICATE MODULE
-- PostgreSQL Schema, Row Level Security (RLS) & Storage Policies
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. NGO REGISTRATION CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.ngo_registration_certificates (
  id TEXT PRIMARY KEY DEFAULT ('NGO-CERT-' || substr(md5(random()::text), 1, 8)),
  ngo_id TEXT NOT NULL,
  org_name TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  issuing_authority TEXT NOT NULL,
  registration_date DATE,
  org_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Delhi',
  pin_code TEXT NOT NULL,
  authorized_representative TEXT NOT NULL,
  official_email TEXT NOT NULL,
  official_phone TEXT NOT NULL,
  
  -- Document Metadata
  document_type TEXT NOT NULL DEFAULT 'NGO Registration Certificate',
  storage_path TEXT,
  original_filename TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  file_size_formatted TEXT NOT NULL DEFAULT '1.2 MB',
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  
  -- Review Lifecycle & Audit
  status TEXT NOT NULL DEFAULT 'pending_review' 
    CHECK (status IN ('not_submitted', 'pending_review', 'needs_correction', 'approved', 'rejected')),
  declaration_confirmed BOOLEAN NOT NULL DEFAULT true,
  reviewer_notes TEXT,
  correction_requested TEXT,
  rejection_reason TEXT,
  
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_ngo_cert_ngo_id ON public.ngo_registration_certificates (ngo_id);
CREATE INDEX IF NOT EXISTS idx_ngo_cert_status ON public.ngo_registration_certificates (status);
CREATE INDEX IF NOT EXISTS idx_ngo_cert_reg_num ON public.ngo_registration_certificates (registration_number);
CREATE INDEX IF NOT EXISTS idx_ngo_cert_submitted ON public.ngo_registration_certificates (submitted_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_ngo_cert_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ngo_cert_timestamp ON public.ngo_registration_certificates;
CREATE TRIGGER trg_ngo_cert_timestamp
  BEFORE UPDATE ON public.ngo_registration_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_ngo_cert_timestamp();

-- 3. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.ngo_registration_certificates ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated NGOs can read only their own certificates
DROP POLICY IF EXISTS "NGOs can view own certificates" ON public.ngo_registration_certificates;
CREATE POLICY "NGOs can view own certificates"
  ON public.ngo_registration_certificates
  FOR SELECT
  TO authenticated
  USING (
    official_email = auth.jwt() ->> 'email' 
    OR ngo_id = auth.uid()::text
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Policy 2: Public read for verified directory lookups (restricted columns via view or basic info)
DROP POLICY IF EXISTS "Public can view approved certificate basic info" ON public.ngo_registration_certificates;
CREATE POLICY "Public can view approved certificate basic info"
  ON public.ngo_registration_certificates
  FOR SELECT
  TO anon
  USING (status = 'approved');

-- Policy 3: Authenticated NGOs can insert their own certificate (cannot set status to 'approved')
DROP POLICY IF EXISTS "NGOs can submit own certificate" ON public.ngo_registration_certificates;
CREATE POLICY "NGOs can submit own certificate"
  ON public.ngo_registration_certificates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    status IN ('pending_review', 'not_submitted')
    AND declaration_confirmed = true
  );

-- Policy 4: NGOs can re-upload when correction is requested or replace pending review
DROP POLICY IF EXISTS "NGOs can update own certificate on correction" ON public.ngo_registration_certificates;
CREATE POLICY "NGOs can update own certificate on correction"
  ON public.ngo_registration_certificates
  FOR UPDATE
  TO authenticated
  USING (
    official_email = auth.jwt() ->> 'email' 
    OR ngo_id = auth.uid()::text
  )
  WITH CHECK (
    -- Cannot self-approve
    status IN ('pending_review', 'not_submitted')
  );

-- Policy 5: Compliance Administrators have full review authority
DROP POLICY IF EXISTS "Admins have full oversight on certificates" ON public.ngo_registration_certificates;
CREATE POLICY "Admins have full oversight on certificates"
  ON public.ngo_registration_certificates
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') LIKE '%@feedall.org'
  );

-- 4. SUPABASE STORAGE BUCKET CONFIGURATION
-- Dedicated private bucket for organization legal documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ngo-certificates', 
  'ngo-certificates', 
  false, 
  5242880, -- 5 MB in bytes
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf'];

-- Storage RLS: NGOs can upload to their own folder
CREATE POLICY "NGOs can upload certificates to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ngo-certificates'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: NGOs can view only their own uploaded certificate
CREATE POLICY "NGOs can view own certificate files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'ngo-certificates'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
  );

-- 5. INITIAL SEED RECORDS (Realistic Indian Registered NGOs)
INSERT INTO public.ngo_registration_certificates (
  id,
  ngo_id,
  org_name,
  registration_number,
  issuing_authority,
  registration_date,
  org_address,
  city,
  state,
  pin_code,
  authorized_representative,
  official_email,
  official_phone,
  document_type,
  storage_path,
  original_filename,
  file_size_bytes,
  file_size_formatted,
  mime_type,
  status,
  declaration_confirmed,
  reviewer_notes,
  submitted_at,
  reviewed_at,
  reviewed_by
)
VALUES
  (
    'NGO-CERT-001',
    'usr_dispatch_robinhoodarmy_com',
    'Robin Hood Army Educational & Charitable Trust',
    'DL/2018/0192841',
    'Registrar of Societies, Govt. of NCT Delhi',
    '2018-04-12',
    '14 Barakhamba Road, Connaught Place',
    'New Delhi',
    'Delhi',
    '110001',
    'Mohit Verma (Fleet Lead)',
    'dispatch@robinhoodarmy.com',
    '+91 11 2341 5500',
    'NGO Registration Certificate',
    'ngo-certificates/usr_dispatch_robinhoodarmy_com/RHA_Registration_Certificate_2018.pdf',
    'RHA_Trust_Registration_Certificate_Delhi.pdf',
    1450000,
    '1.4 MB',
    'application/pdf',
    'approved',
    true,
    'Valid Society Registration Certificate under Societies Registration Act XXI of 1860. Verified with Delhi e-District registry.',
    now() - INTERVAL '10 days',
    now() - INTERVAL '9 days',
    'Dr. Sunita Varma (Chief Auditor)'
  ),
  (
    'NGO-CERT-002',
    'usr_contact_akshayaseva_org',
    'Akshaya Seva Food Foundation',
    'MH/2021/0089244',
    'Office of the Charity Commissioner, Mumbai',
    '2021-08-20',
    'Plot 42, Dadar West Industrial Estate',
    'Mumbai',
    'Maharashtra',
    '400028',
    'Dr. Arvind Mehta',
    'contact@akshayaseva.org',
    '+91 98201 11223',
    'NGO Registration Certificate',
    'ngo-certificates/usr_contact_akshayaseva_org/Akshaya_Seva_Trust_Deed_Certificate.pdf',
    'Akshaya_Seva_Bombay_Public_Trust_Cert.pdf',
    1280000,
    '1.2 MB',
    'application/pdf',
    'pending_review',
    true,
    'Initial submission received. Awaiting cross-audit with Maharashtra Charity Commissioner portal.',
    now() - INTERVAL '1 day',
    NULL,
    NULL
  ),
  (
    'NGO-CERT-003',
    'usr_priyanka_surplusangels_org',
    'Surplus Angels Welfare Society',
    'DL/2023/0145290',
    'Sub-Divisional Magistrate (HQ), South Delhi',
    '2023-02-15',
    'B-12, Saket Community Center',
    'New Delhi',
    'Delhi',
    '110017',
    'Ms. Priyanka Sen',
    'priyanka@surplusangels.org',
    '+91 99100 44556',
    'NGO Registration Certificate',
    'ngo-certificates/usr_priyanka_surplusangels_org/Surplus_Angels_Registration_Cert.pdf',
    'Surplus_Angels_Welfare_Society_Reg_Certificate.pdf',
    980000,
    '980 KB',
    'application/pdf',
    'needs_correction',
    true,
    'Page 2 seal is blurred. Please provide a high-resolution scan showing the registrar signature and seal clearly.',
    now() - INTERVAL '2 days',
    now() - INTERVAL '1 day',
    'Dr. Sunita Varma (Chief Auditor)'
  ),
  (
    'NGO-CERT-004',
    'usr_rescue_annapoorna_blr_org',
    'Bangalore Annapoorna Collective Trust',
    'KA/2020/0034188',
    'Department of Registration, Karnataka',
    '2020-11-10',
    '88 Indiranagar 100ft Road',
    'Bengaluru',
    'Karnataka',
    '560038',
    'Venkatesh Rao',
    'rescue@annapoorna-blr.org',
    '+91 98450 77889',
    'NGO Registration Certificate',
    'ngo-certificates/usr_rescue_annapoorna_blr_org/Annapoorna_Registration_Certificate.pdf',
    'Annapoorna_Collective_Trust_Certificate.pdf',
    2100000,
    '2.1 MB',
    'application/pdf',
    'pending_review',
    true,
    'Document uploaded. Pending physical address cross-verification.',
    now() - INTERVAL '3 days',
    NULL,
    NULL
  )
ON CONFLICT (id) DO NOTHING;
