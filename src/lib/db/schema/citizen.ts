import { index, integer, pgTable, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { auditColumns, tenants, users } from "./foundation";

export const citizenProfiles = pgTable(
  "citizen_profiles",
  {
    id: uuid("id").primaryKey().notNull(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    nik: varchar("nik", { length: 32 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 32 }),
    address: varchar("address", { length: 500 }),
    ktpAttachmentPublicId: varchar("ktp_attachment_public_id", { length: 255 }),
    ktpAttachmentUrl: varchar("ktp_attachment_url", { length: 500 }),
    selfieAttachmentPublicId: varchar("selfie_attachment_public_id", { length: 255 }),
    selfieAttachmentUrl: varchar("selfie_attachment_url", { length: 500 }),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    ...auditColumns,
  },
  (t) => ({
    tenantIdx: index("citizen_profiles_tenant_id_idx").on(t.tenantId),
    userUniq: uniqueIndex("citizen_profiles_tenant_user_idx").on(t.tenantId, t.userId),
    nikIdx: uniqueIndex("citizen_profiles_nik_idx").on(t.nik),
  }),
);

export const citizenAttachments = pgTable(
  "citizen_attachments",
  {
    id: uuid("id").primaryKey().notNull(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    citizenProfileId: uuid("citizen_profile_id")
      .references(() => citizenProfiles.id, { onDelete: "cascade" })
      .notNull(),
    cloudinaryPublicId: varchar("cloudinary_public_id", { length: 255 }).notNull(),
    cloudinarySecureUrl: varchar("cloudinary_secure_url", { length: 500 }).notNull(),
    resourceType: varchar("resource_type", { length: 50 }).notNull().default("image"),
    attachmentType: varchar("attachment_type", { length: 32 }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }),
    size: integer("size"),
    ...auditColumns,
  },
  (t) => ({
    tenantIdx: index("citizen_attachments_tenant_id_idx").on(t.tenantId),
    profileIdx: index("citizen_attachments_citizen_profile_id_idx").on(t.citizenProfileId),
    profileTypeUniq: uniqueIndex("citizen_attachments_profile_type_idx").on(
      t.citizenProfileId,
      t.attachmentType,
    ),
    publicIdUniq: uniqueIndex("citizen_attachments_public_id_idx").on(
      t.cloudinaryPublicId,
    ),
  }),
);
