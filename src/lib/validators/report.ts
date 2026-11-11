import { z } from "zod";

const categories = ["Infrastruktur", "Dugaan korupsi", "Lingkungan"] as const;
const subcategories: Record<(typeof categories)[number], string[]> = {
  Infrastruktur: [
    "Jalan rusak",
    "Jembatan rusak",
    "Lampu jalan",
    "Fasilitas umum",
    "Lainnya",
  ],
  "Dugaan korupsi": [
    "Penyalahgunaan anggaran",
    "Pungutan liar",
    "Penyalahgunaan wewenang",
    "Lainnya",
  ],
  Lingkungan: [
    "Sampah menumpuk",
    "Pencemaran",
    "Saluran tersumbat",
    "Kerusakan ruang hijau",
    "Lainnya",
  ],
};

export const locationSchema = z.object({
  province: z.string().trim().min(1).max(100),
  city: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(2_000),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const reportSubmissionSchema = z
  .object({
    category: z.enum(categories),
    subcategory: z.string().trim().min(1).max(100),
    title: z.string().trim().min(1).max(100),
    description: z.string().trim().min(50).max(10_000),
    location: locationSchema,
    name: z.string().trim().min(1).max(80),
    isPublic: z.boolean(),
    showIdentity: z.boolean(),
    attachments: z.array(z.string().trim().min(1).max(255)).max(5),
  })
  .strict()
  .refine(
    (values) => subcategories[values.category].includes(values.subcategory),
    {
      path: ["subcategory"],
      message: "Subkategori tidak sesuai dengan kategori laporan.",
    },
  );

export type ReportSubmissionInput = z.infer<typeof reportSubmissionSchema>;
export type LocationInput = z.infer<typeof locationSchema>;