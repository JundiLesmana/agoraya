CREATE TABLE asn_registration_details (
  id UUID PRIMARY KEY NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  birth_place VARCHAR(255) NOT NULL,
  birth_date DATE NOT NULL,
  phone VARCHAR(32) NOT NULL,
  employment_status VARCHAR(16) NOT NULL
    CHECK (employment_status IN ('PNS', 'PPPK')),
  employee_number VARCHAR(32) NOT NULL,
  rank_grade VARCHAR(100) NOT NULL,
  appointment_date DATE,
  agency_type VARCHAR(32) NOT NULL
    CHECK (agency_type IN ('Instansi daerah', 'Instansi pusat')),
  province_task VARCHAR(255),
  regency_task VARCHAR(255),
  field VARCHAR(255) NOT NULL,
  office_address VARCHAR(500) NOT NULL,
  official_email VARCHAR(255),
  office_phone VARCHAR(32),
  ktp_address VARCHAR(500) NOT NULL,
  ktp_rt VARCHAR(3) NOT NULL,
  ktp_rw VARCHAR(3) NOT NULL,
  ktp_postal_code VARCHAR(5) NOT NULL,
  ktp_province VARCHAR(255) NOT NULL,
  ktp_regency VARCHAR(255) NOT NULL,
  ktp_district VARCHAR(255) NOT NULL,
  ktp_village VARCHAR(255) NOT NULL,
  domicile_same_as_ktp BOOLEAN NOT NULL,
  domicile_address VARCHAR(500) NOT NULL,
  domicile_rt VARCHAR(3) NOT NULL,
  domicile_rw VARCHAR(3) NOT NULL,
  domicile_postal_code VARCHAR(5) NOT NULL,
  domicile_province VARCHAR(255) NOT NULL,
  domicile_regency VARCHAR(255) NOT NULL,
  domicile_district VARCHAR(255) NOT NULL,
  domicile_village VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX asn_registration_details_user_id_idx
  ON asn_registration_details(user_id);
CREATE INDEX asn_registration_details_tenant_id_idx
  ON asn_registration_details(tenant_id);

CREATE TABLE asn_registration_attachments (
  id UUID PRIMARY KEY NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL
    REFERENCES asn_registration_details(id) ON DELETE CASCADE,
  cloudinary_public_id VARCHAR(255) NOT NULL UNIQUE,
  cloudinary_secure_url VARCHAR(500) NOT NULL,
  resource_type VARCHAR(50) NOT NULL DEFAULT 'image',
  attachment_type VARCHAR(32) NOT NULL
    CHECK (attachment_type IN ('ktp', 'appointment_letter', 'employee_id', 'selfie')),
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX asn_registration_attachments_tenant_id_idx
  ON asn_registration_attachments(tenant_id);
CREATE INDEX asn_registration_attachments_registration_id_idx
  ON asn_registration_attachments(registration_id);
CREATE UNIQUE INDEX asn_registration_attachments_registration_type_idx
  ON asn_registration_attachments(registration_id, attachment_type);