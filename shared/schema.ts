import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Developers table - untuk autentikasi developer
export const developers = pgTable("developers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // hashed password
  name: text("name").notNull(),
  avatar: text("avatar").default("/avatars/avatar-1.png"), // path ke avatar atau URL
  bio: text("bio"), // bio singkat developer
  company: text("company"), // nama perusahaan (optional)
  website: text("website"), // website developer (optional)
  location: text("location"), // lokasi developer (optional)
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  verificationCode: text("verification_code"),
  verificationCodeExpiry: timestamp("verification_code_expiry"),
  resetPasswordCode: text("reset_password_code"),
  resetPasswordCodeExpiry: timestamp("reset_password_code_expiry"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// API Keys table - untuk autentikasi aplikasi yang menggunakan CAPTCHA
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  developerId: varchar("developer_id").references(() => developers.id).notNull(),
  name: text("name").notNull(), // nama aplikasi/website
  sitekey: text("sitekey").notNull().unique(),
  secretkey: text("secretkey").notNull().unique(),
  domain: text("domain"), // domain yang diizinkan (optional)
  theme: text("theme").notNull().default('light'), // tema captcha: light, dark, auto
  settings: jsonb("settings"), // konfigurasi keamanan dan desain per API key
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Challenges table - menyimpan challenge yang di-generate
export const challenges = pgTable("challenges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull().unique(), // JWT token untuk challenge
  difficulty: integer("difficulty").notNull().default(4), // level kesulitan proof-of-work
  challengeData: jsonb("challenge_data").notNull(), // data challenge (nonce, target, dll)
  type: text("type").notNull(), // 'grid', 'jigsaw', 'gesture', 'upside_down', atau 'audio'
  apiKeyId: varchar("api_key_id").references(() => apiKeys.id),
  validatedDomain: text("validated_domain").notNull(), // domain yang tervalidasi saat challenge dibuat
  signature: text("signature").notNull(), // HMAC signature untuk mencegah replay attack
  sessionFingerprint: varchar("session_fingerprint", { length: 64 }), // session fingerprint untuk binding
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Verifications table - log semua verifikasi attempt
export const verifications = pgTable("verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id").references(() => challenges.id),
  apiKeyId: varchar("api_key_id").references(() => apiKeys.id),
  success: boolean("success").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  country: text("country"), // kode negara ISO (e.g., "US", "ID")
  countryName: text("country_name"), // nama lengkap negara
  region: text("region"), // region/state
  city: text("city"), // nama kota
  latitude: text("latitude"), // koordinat latitude
  longitude: text("longitude"), // koordinat longitude
  timezone: text("timezone"), // timezone
  timeToSolve: integer("time_to_solve"), // dalam milidetik
  attemptData: jsonb("attempt_data"), // data tambahan untuk analytics
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Analytics agregat - untuk dashboard performa
export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  apiKeyId: varchar("api_key_id").references(() => apiKeys.id),
  date: timestamp("date").notNull(),
  totalChallenges: integer("total_challenges").notNull().default(0),
  successfulVerifications: integer("successful_verifications").notNull().default(0),
  failedVerifications: integer("failed_verifications").notNull().default(0),
  averageTimeToSolve: integer("average_time_to_solve"), // dalam milidetik
  uniqueIps: integer("unique_ips").notNull().default(0),
});

// Country Analytics - analytics per negara
export const countryAnalytics = pgTable("country_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  apiKeyId: varchar("api_key_id").references(() => apiKeys.id),
  country: text("country").notNull(), // kode negara ISO
  countryName: text("country_name").notNull(), // nama lengkap negara
  date: timestamp("date").notNull(),
  totalVerifications: integer("total_verifications").notNull().default(0),
  successfulVerifications: integer("successful_verifications").notNull().default(0),
  failedVerifications: integer("failed_verifications").notNull().default(0),
  averageTimeToSolve: integer("average_time_to_solve"), // dalam milidetik
  uniqueIps: integer("unique_ips").notNull().default(0),
});

// Chat Messages table - public chat antar developer (plain text, WSS for transport security)
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  developerId: varchar("developer_id").references(() => developers.id).notNull(),
  developerName: text("developer_name").notNull(), // nama pengirim untuk tampilan
  developerEmail: text("developer_email").notNull(), // email pengirim untuk identifikasi
  developerAvatar: text("developer_avatar"), // avatar pengirim untuk tampilan
  content: text("content").notNull().default(''), // konten pesan (can be empty if media present)
  mediaUrl: text("media_url"), // URL untuk media attachment (gambar, file)
  mediaType: text("media_type"), // type media: 'image', 'pdf', 'document', dll
  mediaName: text("media_name"), // nama file asli
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertDeveloperSchema = createInsertSchema(developers).omit({
  id: true,
  createdAt: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  sitekey: true,
  secretkey: true,
  createdAt: true,
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
});

export const insertVerificationSchema = createInsertSchema(verifications).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
});

export const insertCountryAnalyticsSchema = createInsertSchema(countryAnalytics).omit({
  id: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertDeveloper = z.infer<typeof insertDeveloperSchema>;
export type Developer = typeof developers.$inferSelect;

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challenges.$inferSelect;

export type InsertVerification = z.infer<typeof insertVerificationSchema>;
export type Verification = typeof verifications.$inferSelect;

export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Analytics = typeof analytics.$inferSelect;

export type InsertCountryAnalytics = z.infer<typeof insertCountryAnalyticsSchema>;
export type CountryAnalytics = typeof countryAnalytics.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Security Settings Schema and Types
// IMPORTANT: This schema contains CONFIGURABLE security features only
// 
// The following security features are ALWAYS ENFORCED server-side and CANNOT be disabled:
// - Domain Validation: Always validates requests against allowed domains
// - End-to-End Encryption: Always active via EncryptionManager (progressive enhancement)
// 
// These core security features are not included in this schema because they are
// fundamental protections that must never be turned off.
export const securitySettingsSchema = z.object({
  // Security Features (Configurable)
  antiDebugger: z.boolean().default(true),
  advancedFingerprinting: z.boolean().default(true),
  sessionBinding: z.boolean().default(true),
  csrfProtection: z.boolean().default(true),
  ipRateLimiting: z.boolean().default(true),
  automationDetection: z.boolean().default(true),
  behavioralAnalysis: z.boolean().default(true),
  riskAdaptiveDifficulty: z.boolean().default(true),
  
  // IP and Country Blocking
  blockedIps: z.array(z.string()).default([]), // Array of blocked IP addresses (CIDR notation supported)
  blockedCountries: z.array(z.string()).default([]), // Array of blocked country codes (ISO 3166-1 alpha-2)
  
  // Proof of Work
  proofOfWorkDifficulty: z.number().min(1).max(10).default(4),
  
  // Rate Limiting Configuration
  rateLimitWindowMs: z.number().min(1000).max(3600000).default(60000), // 1s to 1h
  rateLimitMaxRequests: z.number().min(1).max(1000).default(30),
  
  // Timeouts
  challengeTimeoutMs: z.number().min(10000).max(300000).default(60000), // 10s to 5min
  tokenExpiryMs: z.number().min(30000).max(600000).default(60000), // 30s to 10min
  
  // Challenge Types
  enabledChallengeTypes: z.array(z.enum(['grid', 'jigsaw', 'gesture', 'upside_down', 'audio'])).default(['grid', 'jigsaw', 'gesture', 'upside_down', 'audio']),
});

export type SecuritySettings = z.infer<typeof securitySettingsSchema>;

// Default security settings - semua fitur enabled
export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  antiDebugger: true,
  advancedFingerprinting: true,
  sessionBinding: true,
  csrfProtection: true,
  ipRateLimiting: true,
  automationDetection: true,
  behavioralAnalysis: true,
  riskAdaptiveDifficulty: true,
  blockedIps: [],
  blockedCountries: [],
  proofOfWorkDifficulty: 4,
  rateLimitWindowMs: 60000,
  rateLimitMaxRequests: 30,
  challengeTimeoutMs: 60000,
  tokenExpiryMs: 60000,
  enabledChallengeTypes: ['grid', 'jigsaw', 'gesture', 'upside_down', 'audio'],
};
