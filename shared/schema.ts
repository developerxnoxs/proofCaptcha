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
  role: text("role").notNull().default('developer'), // 'founder' atau 'developer'
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

// Tickets table - support tickets dari developer
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  developerId: varchar("developer_id").references(() => developers.id).notNull(),
  developerName: text("developer_name").notNull(),
  developerEmail: text("developer_email").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'bug', 'feature', 'question', 'other'
  priority: text("priority").notNull().default('medium'), // 'low', 'medium', 'high', 'urgent'
  status: text("status").notNull().default('open'), // 'open', 'in_progress', 'resolved', 'closed'
  response: text("response"), // respons dari founder
  respondedBy: varchar("responded_by").references(() => developers.id), // ID founder yang merespons
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Notifications table - notifikasi untuk developer
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  developerId: varchar("developer_id").references(() => developers.id).notNull(), // penerima notifikasi
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default('info'), // 'info', 'warning', 'success', 'error'
  isRead: boolean("is_read").notNull().default(false),
  relatedTicketId: varchar("related_ticket_id").references(() => tickets.id), // optional: link ke ticket terkait
  sentBy: varchar("sent_by").references(() => developers.id), // ID founder yang mengirim (optional)
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

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
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

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

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
  antiVpn: z.boolean().default(true), // Detect and block VPN/Proxy traffic
  
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
  
  // PHASE 0: Advanced ML/Bot Scoring Configuration
  mlScoringConfig: z.object({
    // Enable ML-based scoring
    enabled: z.boolean().default(true),
    
    // Feature weights (must sum to 1.0 for proper normalization)
    automationWeight: z.number().min(0).max(1).default(0.25),
    behavioralWeight: z.number().min(0).max(1).default(0.20),
    fingerprintWeight: z.number().min(0).max(1).default(0.15),
    reputationWeight: z.number().min(0).max(1).default(0.15),
    anomalyWeight: z.number().min(0).max(1).default(0.15),
    temporalWeight: z.number().min(0).max(1).default(0.10),
    
    // Risk thresholds
    thresholds: z.object({
      low: z.number().min(0).max(100).default(20),
      medium: z.number().min(0).max(100).default(40),
      high: z.number().min(0).max(100).default(65),
      critical: z.number().min(0).max(100).default(85),
    }).default({
      low: 20,
      medium: 40,
      high: 65,
      critical: 85,
    }),
    
    // Sensitivity level
    sensitivity: z.enum(['low', 'medium', 'high', 'paranoid']).default('medium'),
    
    // Ensemble learning
    useEnsemble: z.boolean().default(true),
    
    // Adaptive learning (future feature)
    adaptiveLearning: z.boolean().default(false),
  }).default({
    enabled: true,
    automationWeight: 0.25,
    behavioralWeight: 0.20,
    fingerprintWeight: 0.15,
    reputationWeight: 0.15,
    anomalyWeight: 0.15,
    temporalWeight: 0.10,
    thresholds: {
      low: 20,
      medium: 40,
      high: 65,
      critical: 85,
    },
    sensitivity: 'medium',
    useEnsemble: true,
    adaptiveLearning: false,
  }),
  
  // PHASE 1: Widget Customization Settings (UI/UX Control)
  widgetCustomization: z.object({
    // Language control
    autoDetectLanguage: z.boolean().default(true),
    defaultLanguage: z.enum(['en', 'id']).default('en'),
    
    // Branding
    showBranding: z.boolean().default(true),
    customLogoUrl: z.string().nullable().default(null),
    customBrandText: z.string().nullable().default(null),
    
    // Theme
    allowThemeSwitch: z.boolean().default(false),
    forceTheme: z.enum(['light', 'dark', 'auto']).default('auto'),
    
    // Size
    widgetSize: z.enum(['compact', 'normal', 'large']).default('normal'),
    customWidth: z.number().nullable().default(null),
    
    // Animation
    disableAnimations: z.boolean().default(false),
    animationSpeed: z.enum(['slow', 'normal', 'fast']).default('normal'),
  }).default({
    autoDetectLanguage: true,
    defaultLanguage: 'en',
    showBranding: true,
    customLogoUrl: null,
    customBrandText: null,
    allowThemeSwitch: false,
    forceTheme: 'auto',
    widgetSize: 'normal',
    customWidth: null,
    disableAnimations: false,
    animationSpeed: 'normal',
  }),
  
  // PHASE 2: User Feedback Control (Custom Messages)
  userFeedback: z.object({
    // Error messages
    customErrorMessages: z.object({
      timeout: z.string().nullable().default(null),
      expired: z.string().nullable().default(null),
      failed: z.string().nullable().default(null),
      blocked: z.string().nullable().default(null),
      countryBlocked: z.string().nullable().default(null),
    }).default({
      timeout: null,
      expired: null,
      failed: null,
      blocked: null,
      countryBlocked: null,
    }),
    
    // Success
    customSuccessMessage: z.string().nullable().default(null),
    showComputationCount: z.boolean().default(true),
    
    // Loading
    customLoadingMessage: z.string().nullable().default(null),
    showProgressBar: z.boolean().default(false),
    
    // Audio feedback
    enableSoundEffects: z.boolean().default(false),
    successSoundUrl: z.string().nullable().default(null),
    errorSoundUrl: z.string().nullable().default(null),
  }).default({
    customErrorMessages: {
      timeout: null,
      expired: null,
      failed: null,
      blocked: null,
      countryBlocked: null,
    },
    customSuccessMessage: null,
    showComputationCount: true,
    customLoadingMessage: null,
    showProgressBar: false,
    enableSoundEffects: false,
    successSoundUrl: null,
    errorSoundUrl: null,
  }),
  
  // PHASE 3: Challenge Behavior Control (Challenge Settings)
  challengeBehavior: z.object({
    // Auto-retry
    autoRetryOnFail: z.boolean().default(true),
    maxAutoRetries: z.number().min(0).max(5).default(3),
    retryDelayMs: z.number().min(200).max(3000).default(800),
    
    // Challenge selection
    challengeSelectionMode: z.enum(['random', 'sequential', 'risk-based']).default('risk-based'),
    preferredChallengeType: z.enum(['grid', 'jigsaw', 'gesture', 'upside_down', 'audio']).nullable().default(null),
    
    // Difficulty progression
    enableDifficultyProgression: z.boolean().default(true),
    maxDifficultyLevel: z.number().min(1).max(10).default(7),
    
    // Skip for trusted users
    allowSkipForTrustedFingerprints: z.boolean().default(false),
    trustThresholdDays: z.number().min(1).max(365).default(30),
  }).default({
    autoRetryOnFail: true,
    maxAutoRetries: 3,
    retryDelayMs: 800,
    challengeSelectionMode: 'risk-based',
    preferredChallengeType: null,
    enableDifficultyProgression: true,
    maxDifficultyLevel: 7,
    allowSkipForTrustedFingerprints: false,
    trustThresholdDays: 30,
  }),
  
  // PHASE 4: Performance & Optimization (Performance Settings)
  performance: z.object({
    // Preloading
    preloadChallenges: z.boolean().default(false),
    prefetchAssets: z.boolean().default(true),
    
    // Caching
    cacheValidTokens: z.boolean().default(false),
    tokenCacheDurationMs: z.number().min(60000).max(900000).default(300000),
    
    // Network
    enableCompression: z.boolean().default(true),
    useCDN: z.boolean().default(false),
    cdnUrl: z.string().nullable().default(null),
    
    // Workers
    maxWorkerThreads: z.number().min(1).max(8).default(4),
    workerFallbackEnabled: z.boolean().default(true),
  }).default({
    preloadChallenges: false,
    prefetchAssets: true,
    cacheValidTokens: false,
    tokenCacheDurationMs: 300000,
    enableCompression: true,
    useCDN: false,
    cdnUrl: null,
    maxWorkerThreads: 4,
    workerFallbackEnabled: true,
  }),
  
  // PHASE 5: Privacy & Accessibility (Privacy & Compliance)
  privacy: z.object({
    // GDPR
    enableGDPRMode: z.boolean().default(false),
    requireExplicitConsent: z.boolean().default(false),
    
    // Data retention
    anonymizeFingerprints: z.boolean().default(false),
    deleteDataAfterDays: z.number().min(7).max(365).default(90),
    
    // Links
    showPrivacyLink: z.boolean().default(true),
    customPrivacyUrl: z.string().nullable().default(null),
    customTermsUrl: z.string().nullable().default(null),
    
    // Minimal mode
    minimalDataMode: z.boolean().default(false),
  }).default({
    enableGDPRMode: false,
    requireExplicitConsent: false,
    anonymizeFingerprints: false,
    deleteDataAfterDays: 90,
    showPrivacyLink: true,
    customPrivacyUrl: null,
    customTermsUrl: null,
    minimalDataMode: false,
  }),
  
  accessibility: z.object({
    // Screen reader
    enableAriaLabels: z.boolean().default(true),
    
    // Keyboard
    enableKeyboardNavigation: z.boolean().default(true),
    
    // Visual
    enableHighContrastMode: z.boolean().default(false),
    
    // Alternative challenges
    alwaysShowAudioChallenge: z.boolean().default(false),
    enableTextBasedChallenge: z.boolean().default(false),
  }).default({
    enableAriaLabels: true,
    enableKeyboardNavigation: true,
    enableHighContrastMode: false,
    alwaysShowAudioChallenge: false,
    enableTextBasedChallenge: false,
  }),
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
  antiVpn: true,
  blockedIps: [],
  blockedCountries: [],
  proofOfWorkDifficulty: 4,
  rateLimitWindowMs: 60000,
  rateLimitMaxRequests: 30,
  challengeTimeoutMs: 60000,
  tokenExpiryMs: 60000,
  enabledChallengeTypes: ['grid', 'jigsaw', 'gesture', 'upside_down', 'audio'],
  
  // Phase 0: ML Scoring defaults
  mlScoringConfig: {
    enabled: true,
    automationWeight: 0.25,
    behavioralWeight: 0.20,
    fingerprintWeight: 0.15,
    reputationWeight: 0.15,
    anomalyWeight: 0.15,
    temporalWeight: 0.10,
    thresholds: {
      low: 20,
      medium: 40,
      high: 65,
      critical: 85,
    },
    sensitivity: 'medium',
    useEnsemble: true,
    adaptiveLearning: false,
  },
  
  // Phase 1: Widget Customization defaults
  widgetCustomization: {
    autoDetectLanguage: true,
    defaultLanguage: 'en',
    showBranding: true,
    customLogoUrl: null,
    customBrandText: null,
    allowThemeSwitch: false,
    forceTheme: 'auto',
    widgetSize: 'normal',
    customWidth: null,
    disableAnimations: false,
    animationSpeed: 'normal',
  },
  
  // Phase 2: User Feedback defaults
  userFeedback: {
    customErrorMessages: {
      timeout: null,
      expired: null,
      failed: null,
      blocked: null,
      countryBlocked: null,
    },
    customSuccessMessage: null,
    showComputationCount: true,
    customLoadingMessage: null,
    showProgressBar: false,
    enableSoundEffects: false,
    successSoundUrl: null,
    errorSoundUrl: null,
  },
  
  // Phase 3: Challenge Behavior defaults
  challengeBehavior: {
    autoRetryOnFail: true,
    maxAutoRetries: 3,
    retryDelayMs: 800,
    challengeSelectionMode: 'risk-based',
    preferredChallengeType: null,
    enableDifficultyProgression: true,
    maxDifficultyLevel: 7,
    allowSkipForTrustedFingerprints: false,
    trustThresholdDays: 30,
  },
  
  // Phase 4: Performance defaults
  performance: {
    preloadChallenges: false,
    prefetchAssets: true,
    cacheValidTokens: false,
    tokenCacheDurationMs: 300000,
    enableCompression: true,
    useCDN: false,
    cdnUrl: null,
    maxWorkerThreads: 4,
    workerFallbackEnabled: true,
  },
  
  // Phase 5: Privacy defaults
  privacy: {
    enableGDPRMode: false,
    requireExplicitConsent: false,
    anonymizeFingerprints: false,
    deleteDataAfterDays: 90,
    showPrivacyLink: true,
    customPrivacyUrl: null,
    customTermsUrl: null,
    minimalDataMode: false,
  },
  
  accessibility: {
    enableAriaLabels: true,
    enableKeyboardNavigation: true,
    enableHighContrastMode: false,
    alwaysShowAudioChallenge: false,
    enableTextBasedChallenge: false,
  },
};
