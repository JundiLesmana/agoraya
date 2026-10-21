import { z } from 'zod';

export const otpRequestSchema = z.object({
  identifier: z.string().min(1).max(255),
});

export const otpVerifySchema = z.object({
  identifier: z.string().min(1).max(255),
  code: z.string().length(6).regex(/^\d{6}$/),
});

export type OtpRequest = z.infer<typeof otpRequestSchema>;
export type OtpVerify = z.infer<typeof otpVerifySchema>;
