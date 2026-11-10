import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { auditColumns, tenants, users } from "./foundation";
import { jobPositionTypeEnum } from "./enums";

export const jobPositions = pgTable(
  "job_positions",
  {
    id: uuid("id").primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: jobPositionTypeEnum("position_type"),
    ...auditColumns,
  },
  (table) => ({
    nameIdx: uniqueIndex("job_positions_name_idx").on(table.name),
  }),
);

export const asnProfiles = pgTable(
  "asn_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    nip: varchar("nip", { length: 32 }),
    opdName: varchar("opd_name", { length: 255 }),
    unitName: varchar("unit_name", { length: 255 }),
    positionId: uuid("position_id").references(() => jobPositions.id, {
      onDelete: "set null",
    }),
    ...auditColumns,
  },
  (table) => ({
    tenantIdx: index("asn_profiles_tenant_id_idx").on(table.tenantId),
    opdIdx: index("asn_profiles_opd_name_idx").on(table.opdName),
    positionIdx: index("asn_profiles_position_id_idx").on(table.positionId),
  }),
);

export const asnRegistrationDetails = pgTable(
  "asn_registration_details",
  {
    id: uuid("id").primaryKey().notNull(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    birthPlace: varchar("birth_place", { length: 255 }).notNull(),
    birthDate: date("birth_date", { mode: "string" }).notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    employmentStatus: varchar("employment_status", { length: 16 }).notNull(),
    employeeNumber: varchar("employee_number", { length: 32 }).notNull(),
    rankGrade: varchar("rank_grade", { length: 100 }).notNull(),
    appointmentDate: date("appointment_date", { mode: "string" }),
    agencyType: varchar("agency_type", { length: 32 }).notNull(),
    provinceTask: varchar("province_task", { length: 255 }),
    regencyTask: varchar("regency_task", { length: 255 }),
    field: varchar("field", { length: 255 }).notNull(),
    officeAddress: varchar("office_address", { length: 500 }).notNull(),
    officialEmail: varchar("official_email", { length: 255 }),
    officePhone: varchar("office_phone", { length: 32 }),
    ktpAddress: varchar("ktp_address", { length: 500 }).notNull(),
    ktpRt: varchar("ktp_rt", { length: 3 }).notNull(),
    ktpRw: varchar("ktp_rw", { length: 3 }).notNull(),
    ktpPostalCode: varchar("ktp_postal_code", { length: 5 }).notNull(),
    ktpProvince: varchar("ktp_province", { length: 255 }).notNull(),
    ktpRegency: varchar("ktp_regency", { length: 255 }).notNull(),
    ktpDistrict: varchar("ktp_district", { length: 255 }).notNull(),
    ktpVillage: varchar("ktp_village", { length: 255 }).notNull(),
    domicileSameAsKtp: boolean("domicile_same_as_ktp").notNull(),
    domicileAddress: varchar("domicile_address", { length: 500 }).notNull(),
    domicileRt: varchar("domicile_rt", { length: 3 }).notNull(),
    domicileRw: varchar("domicile_rw", { length: 3 }).notNull(),
    domicilePostalCode: varchar("domicile_postal_code", { length: 5 }).notNull(),
    domicileProvince: varchar("domicile_province", { length: 255 }).notNull(),
    domicileRegency: varchar("domicile_regency", { length: 255 }).notNull(),
    domicileDistrict: varchar("domicile_district", { length: 255 }).notNull(),
    domicileVillage: varchar("domicile_village", { length: 255 }).notNull(),
    ...auditColumns,
  },
  (table) => ({
    tenantIdx: index("asn_registration_details_tenant_id_idx").on(table.tenantId),
    userUniq: uniqueIndex("asn_registration_details_user_id_idx").on(table.userId),
  }),
);

export const asnRegistrationAttachments = pgTable(
  "asn_registration_attachments",
  {
    id: uuid("id").primaryKey().notNull(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    registrationId: uuid("registration_id")
      .references(() => asnRegistrationDetails.id, { onDelete: "cascade" })
      .notNull(),
    cloudinaryPublicId: varchar("cloudinary_public_id", { length: 255 })
      .notNull()
      .unique(),
    cloudinarySecureUrl: varchar("cloudinary_secure_url", { length: 500 }).notNull(),
    resourceType: varchar("resource_type", { length: 50 }).notNull().default("image"),
    attachmentType: varchar("attachment_type", { length: 32 }).notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }),
    size: integer("size"),
    ...auditColumns,
  },
  (table) => ({
    tenantIdx: index("asn_registration_attachments_tenant_id_idx").on(table.tenantId),
    registrationIdx: index("asn_registration_attachments_registration_id_idx").on(
      table.registrationId,
    ),
    registrationTypeUniq: uniqueIndex(
      "asn_registration_attachments_registration_type_idx",
    ).on(table.registrationId, table.attachmentType),
  }),
);