-- Persist citizen registration profiles and their identity attachments.
CREATE TABLE citizen_profiles (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nik VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(32),
  address VARCHAR(500),
  ktp_attachment_public_id VARCHAR(255),
  ktp_attachment_url VARCHAR(500),
  selfie_attachment_public_id VARCHAR(255),
  selfie_attachment_url VARCHAR(500),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX citizen_profiles_tenant_id_idx ON citizen_profiles(tenant_id);
CREATE UNIQUE INDEX citizen_profiles_tenant_user_idx
  ON citizen_profiles(tenant_id, user_id);
CREATE UNIQUE INDEX citizen_profiles_nik_idx ON citizen_profiles(nik);

CREATE TABLE citizen_attachments (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  citizen_profile_id UUID NOT NULL
    REFERENCES citizen_profiles(id) ON DELETE CASCADE,
  cloudinary_public_id VARCHAR(255) NOT NULL UNIQUE,
  cloudinary_secure_url VARCHAR(500) NOT NULL,
  resource_type VARCHAR(50) NOT NULL DEFAULT 'image',
  attachment_type VARCHAR(32) NOT NULL
    CHECK (attachment_type IN ('ktp', 'selfie')),
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX citizen_attachments_tenant_id_idx
  ON citizen_attachments(tenant_id);
CREATE INDEX citizen_attachments_citizen_profile_id_idx
  ON citizen_attachments(citizen_profile_id);
CREATE UNIQUE INDEX citizen_attachments_public_id_idx
  ON citizen_attachments(cloudinary_public_id);
CREATE UNIQUE INDEX citizen_attachments_profile_type_idx
  ON citizen_attachments(citizen_profile_id, attachment_type);
