export interface CitizenData {
  id: string;
  nik: string;
  name: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female';
  address?: string;
  province?: string;
  city?: string;
  district?: string;
  village?: string;
}

export interface IdentityVerificationResult {
  valid: boolean;
  data?: CitizenData;
  message?: string;
}

export interface IdentityProvider {
  verify(nik: string, additionalData?: Record<string, unknown>): Promise<IdentityVerificationResult>;
  getByNik(nik: string): Promise<CitizenData | null>;
}
