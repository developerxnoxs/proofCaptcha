import {
  type Developer,
  type InsertDeveloper,
  type ApiKey,
  type InsertApiKey,
  type Challenge,
  type InsertChallenge,
  type Verification,
  type InsertVerification,
  type Analytics,
  type InsertAnalytics,
  type CountryAnalytics,
  type InsertCountryAnalytics,
  type ChatMessage,
  type InsertChatMessage,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { nanoid } from "nanoid";
import { generateKeyPair } from "./crypto-utils";

export interface IStorage {
  // Developers
  createDeveloper(developer: InsertDeveloper): Promise<Developer>;
  getDeveloper(id: string): Promise<Developer | undefined>;
  getDeveloperById(id: string): Promise<Developer | undefined>;
  getDeveloperByEmail(email: string): Promise<Developer | undefined>;
  getAllDevelopers(): Promise<Developer[]>;
  verifyDeveloperEmail(id: string): Promise<void>;
  updateVerificationCode(id: string, code: string, expiry: Date): Promise<void>;
  updateResetPasswordCode(email: string, code: string, expiry: Date): Promise<void>;
  resetPassword(email: string, code: string, newPassword: string): Promise<boolean>;
  updateDeveloperProfile(id: string, updates: Partial<Pick<Developer, 'name' | 'avatar' | 'bio' | 'company' | 'website' | 'location'>>): Promise<Developer | undefined>;
  updateDeveloperRole(id: string, role: string): Promise<Developer | undefined>;
  deleteDeveloper(id: string): Promise<boolean>;

  // API Keys
  createApiKey(apiKey: InsertApiKey, customKeys?: { sitekey: string; secretkey: string }): Promise<ApiKey>;
  getApiKey(id: string): Promise<ApiKey | undefined>;
  getApiKeyBySitekey(sitekey: string): Promise<ApiKey | undefined>;
  getApiKeyBySecretkey(secretkey: string): Promise<ApiKey | undefined>;
  getAllApiKeys(): Promise<ApiKey[]>;
  getApiKeysByDeveloper(developerId: string): Promise<ApiKey[]>;
  updateApiKeyStatus(id: string, isActive: boolean): Promise<void>;
  updateApiKeySettings(id: string, settings: any): Promise<void>;
  deleteApiKey(id: string): Promise<void>;

  // Challenges
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  getChallenge(id: string): Promise<Challenge | undefined>;
  getChallengeByToken(token: string): Promise<Challenge | undefined>;
  markChallengeAsUsed(id: string): Promise<boolean>;
  getAllChallenges(): Promise<Challenge[]>;
  deleteChallenge(id: string): Promise<void>;

  // Verifications
  createVerification(verification: InsertVerification): Promise<Verification>;
  getVerificationsByApiKey(apiKeyId: string, limit?: number): Promise<Verification[]>;
  getRecentVerifications(limit?: number): Promise<Verification[]>;
  deleteVerification(id: string): Promise<void>;

  // Analytics
  createOrUpdateAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  getAnalyticsByApiKey(apiKeyId: string, startDate?: Date, endDate?: Date): Promise<Analytics[]>;
  getAnalyticsByDateRange(startDate: Date, endDate: Date): Promise<Analytics[]>;
  updateDailyAnalytics(apiKeyId: string): Promise<void>;
  
  // Country Analytics
  createOrUpdateCountryAnalytics(analytics: InsertCountryAnalytics): Promise<CountryAnalytics>;
  getCountryAnalyticsByApiKey(apiKeyId: string, startDate?: Date, endDate?: Date): Promise<CountryAnalytics[]>;
  getCountryAnalyticsSummary(apiKeyId?: string, limit?: number): Promise<CountryAnalytics[]>;
  updateDailyCountryAnalytics(apiKeyId: string): Promise<void>;

  // Chat Messages
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(limit?: number, offset?: number): Promise<ChatMessage[]>;
  deleteChatMessage(id: string, developerId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private developers: Map<string, Developer>;
  private apiKeys: Map<string, ApiKey>;
  private challenges: Map<string, Challenge>;
  private verifications: Map<string, Verification>;
  private analytics: Map<string, Analytics>;
  private countryAnalytics: Map<string, CountryAnalytics>;
  private chatMessages: Map<string, ChatMessage>;

  constructor() {
    this.developers = new Map();
    this.apiKeys = new Map();
    this.challenges = new Map();
    this.verifications = new Map();
    this.analytics = new Map();
    this.countryAnalytics = new Map();
    this.chatMessages = new Map();
  }

  async createDeveloper(insertDeveloper: InsertDeveloper): Promise<Developer> {
    const id = randomUUID();
    const avatarOptions = [
      "/avatars/avatar-1.png",
      "/avatars/avatar-2.png",
      "/avatars/avatar-3.png",
      "/avatars/avatar-4.png",
      "/avatars/avatar-5.png",
      "/avatars/avatar-6.png",
      "/avatars/avatar-7.png",
      "/avatars/avatar-8.png",
      "/avatars/avatar-9.png",
      "/avatars/avatar-10.png"
    ];
    const randomAvatar = avatarOptions[Math.floor(Math.random() * avatarOptions.length)];
    
    const developer: Developer = {
      id,
      email: insertDeveloper.email,
      password: insertDeveloper.password,
      name: insertDeveloper.name,
      role: insertDeveloper.role ?? 'developer',
      avatar: insertDeveloper.avatar ?? randomAvatar,
      bio: insertDeveloper.bio ?? null,
      company: insertDeveloper.company ?? null,
      website: insertDeveloper.website ?? null,
      location: insertDeveloper.location ?? null,
      isEmailVerified: insertDeveloper.isEmailVerified ?? false,
      verificationCode: insertDeveloper.verificationCode ?? null,
      verificationCodeExpiry: insertDeveloper.verificationCodeExpiry ?? null,
      resetPasswordCode: null,
      resetPasswordCodeExpiry: null,
      createdAt: new Date(),
    };
    this.developers.set(id, developer);
    return developer;
  }

  async getDeveloper(id: string): Promise<Developer | undefined> {
    return this.developers.get(id);
  }

  async getDeveloperById(id: string): Promise<Developer | undefined> {
    return this.developers.get(id);
  }

  async getDeveloperByEmail(email: string): Promise<Developer | undefined> {
    return Array.from(this.developers.values()).find((dev) => dev.email === email);
  }

  async verifyDeveloperEmail(id: string): Promise<void> {
    const developer = this.developers.get(id);
    if (developer) {
      developer.isEmailVerified = true;
      developer.verificationCode = null;
      developer.verificationCodeExpiry = null;
      this.developers.set(id, developer);
    }
  }

  async updateVerificationCode(id: string, code: string, expiry: Date): Promise<void> {
    const developer = this.developers.get(id);
    if (developer) {
      developer.verificationCode = code;
      developer.verificationCodeExpiry = expiry;
      this.developers.set(id, developer);
    }
  }

  async updateResetPasswordCode(email: string, code: string, expiry: Date): Promise<void> {
    const developer = Array.from(this.developers.values()).find(dev => dev.email === email);
    if (developer) {
      developer.resetPasswordCode = code;
      developer.resetPasswordCodeExpiry = expiry;
      this.developers.set(developer.id, developer);
    }
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<boolean> {
    const developer = Array.from(this.developers.values()).find(dev => dev.email === email);
    if (!developer) {
      return false;
    }

    if (!developer.resetPasswordCode || !developer.resetPasswordCodeExpiry) {
      return false;
    }

    if (new Date() > developer.resetPasswordCodeExpiry) {
      return false;
    }

    if (developer.resetPasswordCode !== code) {
      return false;
    }

    developer.password = newPassword;
    developer.resetPasswordCode = null;
    developer.resetPasswordCodeExpiry = null;
    this.developers.set(developer.id, developer);
    return true;
  }

  async updateDeveloperProfile(id: string, updates: Partial<Pick<Developer, 'name' | 'avatar' | 'bio' | 'company' | 'website' | 'location'>>): Promise<Developer | undefined> {
    const developer = this.developers.get(id);
    if (!developer) {
      return undefined;
    }

    if (updates.name !== undefined) developer.name = updates.name;
    if (updates.avatar !== undefined) developer.avatar = updates.avatar;
    if (updates.bio !== undefined) developer.bio = updates.bio;
    if (updates.company !== undefined) developer.company = updates.company;
    if (updates.website !== undefined) developer.website = updates.website;
    if (updates.location !== undefined) developer.location = updates.location;

    this.developers.set(id, developer);
    return developer;
  }

  async getAllDevelopers(): Promise<Developer[]> {
    return Array.from(this.developers.values());
  }

  async updateDeveloperRole(id: string, role: string): Promise<Developer | undefined> {
    const developer = this.developers.get(id);
    if (!developer) {
      return undefined;
    }

    developer.role = role;
    this.developers.set(id, developer);
    return developer;
  }

  async deleteDeveloper(id: string): Promise<boolean> {
    const developer = this.developers.get(id);
    if (!developer) {
      return false;
    }

    // Delete all API keys associated with this developer
    const apiKeys = await this.getApiKeysByDeveloper(id);
    for (const apiKey of apiKeys) {
      await this.deleteApiKey(apiKey.id);
    }

    // Delete developer
    this.developers.delete(id);
    return true;
  }

  // API Keys
  async createApiKey(insertApiKey: InsertApiKey, customKeys?: { sitekey: string; secretkey: string }): Promise<ApiKey> {
    const id = randomUUID();
    const { siteKey, secretKey } = customKeys 
      ? { siteKey: customKeys.sitekey, secretKey: customKeys.secretkey }
      : generateKeyPair();
    const apiKey: ApiKey = {
      id,
      developerId: insertApiKey.developerId,
      name: insertApiKey.name,
      sitekey: siteKey,
      secretkey: secretKey,
      domain: insertApiKey.domain || null,
      theme: insertApiKey.theme || 'light',
      settings: null,
      isActive: insertApiKey.isActive ?? true,
      createdAt: new Date(),
    };
    this.apiKeys.set(id, apiKey);
    return apiKey;
  }

  async getApiKey(id: string): Promise<ApiKey | undefined> {
    return this.apiKeys.get(id);
  }

  async getApiKeyBySitekey(sitekey: string): Promise<ApiKey | undefined> {
    return Array.from(this.apiKeys.values()).find((key) => key.sitekey === sitekey);
  }

  async getApiKeyBySecretkey(secretkey: string): Promise<ApiKey | undefined> {
    return Array.from(this.apiKeys.values()).find((key) => key.secretkey === secretkey);
  }

  async getAllApiKeys(): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values());
  }

  async getApiKeysByDeveloper(developerId: string): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values()).filter((key) => key.developerId === developerId);
  }

  async updateApiKeyStatus(id: string, isActive: boolean): Promise<void> {
    const apiKey = this.apiKeys.get(id);
    if (apiKey) {
      apiKey.isActive = isActive;
      this.apiKeys.set(id, apiKey);
    }
  }

  async updateApiKeySettings(id: string, settings: any): Promise<void> {
    const apiKey = this.apiKeys.get(id);
    if (apiKey) {
      apiKey.settings = settings;
      this.apiKeys.set(id, apiKey);
    }
  }

  async deleteApiKey(id: string): Promise<void> {
    this.apiKeys.delete(id);
  }

  // Challenges
  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const id = randomUUID();
    const challenge: Challenge = {
      id,
      token: insertChallenge.token,
      difficulty: insertChallenge.difficulty ?? 4,
      challengeData: insertChallenge.challengeData,
      type: insertChallenge.type,
      apiKeyId: insertChallenge.apiKeyId || null,
      validatedDomain: insertChallenge.validatedDomain,
      signature: insertChallenge.signature,
      sessionFingerprint: insertChallenge.sessionFingerprint || null,
      isUsed: insertChallenge.isUsed ?? false,
      createdAt: new Date(),
      expiresAt: insertChallenge.expiresAt,
    };
    this.challenges.set(id, challenge);
    return challenge;
  }

  async getChallenge(id: string): Promise<Challenge | undefined> {
    return this.challenges.get(id);
  }

  async getChallengeByToken(token: string): Promise<Challenge | undefined> {
    return Array.from(this.challenges.values()).find((c) => c.token === token);
  }

  async markChallengeAsUsed(id: string): Promise<boolean> {
    const challenge = this.challenges.get(id);
    if (challenge && !challenge.isUsed) {
      challenge.isUsed = true;
      this.challenges.set(id, challenge);
      return true;
    }
    return false;
  }

  async getAllChallenges(): Promise<Challenge[]> {
    return Array.from(this.challenges.values());
  }

  async deleteChallenge(id: string): Promise<void> {
    this.challenges.delete(id);
  }

  // Verifications
  async createVerification(insertVerification: InsertVerification): Promise<Verification> {
    const id = randomUUID();
    const verification: Verification = {
      id,
      challengeId: insertVerification.challengeId || null,
      apiKeyId: insertVerification.apiKeyId || null,
      success: insertVerification.success,
      ipAddress: insertVerification.ipAddress || null,
      userAgent: insertVerification.userAgent || null,
      country: insertVerification.country || null,
      countryName: insertVerification.countryName || null,
      region: insertVerification.region || null,
      city: insertVerification.city || null,
      latitude: insertVerification.latitude || null,
      longitude: insertVerification.longitude || null,
      timezone: insertVerification.timezone || null,
      timeToSolve: insertVerification.timeToSolve || null,
      attemptData: insertVerification.attemptData || null,
      createdAt: new Date(),
    };
    this.verifications.set(id, verification);
    return verification;
  }

  async getVerificationsByApiKey(apiKeyId: string, limit: number = 100): Promise<Verification[]> {
    return Array.from(this.verifications.values())
      .filter((v) => v.apiKeyId === apiKeyId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getRecentVerifications(limit: number = 100): Promise<Verification[]> {
    return Array.from(this.verifications.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async deleteVerification(id: string): Promise<void> {
    this.verifications.delete(id);
  }

  // Analytics
  async createOrUpdateAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const existing = Array.from(this.analytics.values()).find(
      (a) =>
        a.apiKeyId === insertAnalytics.apiKeyId &&
        a.date.toDateString() === insertAnalytics.date.toDateString()
    );

    if (existing) {
      Object.assign(existing, insertAnalytics);
      this.analytics.set(existing.id, existing);
      return existing;
    }

    const id = randomUUID();
    const analytics: Analytics = {
      id,
      apiKeyId: insertAnalytics.apiKeyId || null,
      date: insertAnalytics.date,
      totalChallenges: insertAnalytics.totalChallenges ?? 0,
      successfulVerifications: insertAnalytics.successfulVerifications ?? 0,
      failedVerifications: insertAnalytics.failedVerifications ?? 0,
      averageTimeToSolve: insertAnalytics.averageTimeToSolve || null,
      uniqueIps: insertAnalytics.uniqueIps ?? 0,
    };
    this.analytics.set(id, analytics);
    return analytics;
  }

  async getAnalyticsByApiKey(
    apiKeyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Analytics[]> {
    let results = Array.from(this.analytics.values()).filter((a) => a.apiKeyId === apiKeyId);

    if (startDate) {
      results = results.filter((a) => a.date >= startDate);
    }
    if (endDate) {
      results = results.filter((a) => a.date <= endDate);
    }

    return results.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getAnalyticsByDateRange(startDate: Date, endDate: Date): Promise<Analytics[]> {
    return Array.from(this.analytics.values())
      .filter((a) => a.date >= startDate && a.date <= endDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async updateDailyAnalytics(apiKeyId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all verifications for today for this API key
    const todayVerifications = Array.from(this.verifications.values()).filter(
      v => v.apiKeyId === apiKeyId && 
      v.createdAt >= today && 
      v.createdAt < tomorrow
    );

    // Get all challenges created today for this API key
    const todayChallenges = Array.from(this.challenges.values()).filter(
      c => c.apiKeyId === apiKeyId && 
      c.createdAt >= today && 
      c.createdAt < tomorrow
    );

    // Calculate aggregates
    const totalChallenges = todayChallenges.length;
    const successfulVerifications = todayVerifications.filter(v => v.success).length;
    const failedVerifications = todayVerifications.filter(v => !v.success).length;
    
    // Calculate average time to solve (only from successful verifications)
    const successfulWithTime = todayVerifications.filter(v => v.success && v.timeToSolve !== null);
    const averageTimeToSolve = successfulWithTime.length > 0
      ? Math.round(successfulWithTime.reduce((sum, v) => sum + (v.timeToSolve || 0), 0) / successfulWithTime.length)
      : null;
    
    // Count unique IPs
    const uniqueIpsSet = new Set(todayVerifications.map(v => v.ipAddress).filter(ip => ip !== null));
    const uniqueIps = uniqueIpsSet.size;

    // Update or create analytics record
    await this.createOrUpdateAnalytics({
      apiKeyId,
      date: today,
      totalChallenges,
      successfulVerifications,
      failedVerifications,
      averageTimeToSolve,
      uniqueIps,
    });

    console.log(`[ANALYTICS] Updated daily analytics for ${apiKeyId}: ${successfulVerifications}/${totalChallenges} successful, ${uniqueIps} unique IPs, avg ${averageTimeToSolve}ms`);
  }

  // Country Analytics
  async createOrUpdateCountryAnalytics(insertCountryAnalytics: InsertCountryAnalytics): Promise<CountryAnalytics> {
    const existing = Array.from(this.countryAnalytics.values()).find(
      (a) =>
        a.apiKeyId === insertCountryAnalytics.apiKeyId &&
        a.country === insertCountryAnalytics.country &&
        a.date.toDateString() === insertCountryAnalytics.date.toDateString()
    );

    if (existing) {
      Object.assign(existing, insertCountryAnalytics);
      this.countryAnalytics.set(existing.id, existing);
      return existing;
    }

    const id = randomUUID();
    const countryAnalytics: CountryAnalytics = {
      id,
      apiKeyId: insertCountryAnalytics.apiKeyId || null,
      country: insertCountryAnalytics.country,
      countryName: insertCountryAnalytics.countryName,
      date: insertCountryAnalytics.date,
      totalVerifications: insertCountryAnalytics.totalVerifications ?? 0,
      successfulVerifications: insertCountryAnalytics.successfulVerifications ?? 0,
      failedVerifications: insertCountryAnalytics.failedVerifications ?? 0,
      averageTimeToSolve: insertCountryAnalytics.averageTimeToSolve || null,
      uniqueIps: insertCountryAnalytics.uniqueIps ?? 0,
    };
    this.countryAnalytics.set(id, countryAnalytics);
    return countryAnalytics;
  }

  async getCountryAnalyticsByApiKey(
    apiKeyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CountryAnalytics[]> {
    let results = Array.from(this.countryAnalytics.values()).filter((a) => a.apiKeyId === apiKeyId);

    if (startDate) {
      results = results.filter((a) => a.date >= startDate);
    }
    if (endDate) {
      results = results.filter((a) => a.date <= endDate);
    }

    return results.sort((a, b) => b.totalVerifications - a.totalVerifications);
  }

  async getCountryAnalyticsSummary(apiKeyId?: string, limit: number = 20): Promise<CountryAnalytics[]> {
    let results = Array.from(this.countryAnalytics.values());

    if (apiKeyId) {
      results = results.filter((a) => a.apiKeyId === apiKeyId);
    }

    const countryMap = new Map<string, CountryAnalytics>();
    
    results.forEach(analytics => {
      const existing = countryMap.get(analytics.country);
      if (existing) {
        existing.totalVerifications += analytics.totalVerifications;
        existing.successfulVerifications += analytics.successfulVerifications;
        existing.failedVerifications += analytics.failedVerifications;
        existing.uniqueIps += analytics.uniqueIps;
        
        const totalTime = (existing.averageTimeToSolve || 0) + (analytics.averageTimeToSolve || 0);
        existing.averageTimeToSolve = Math.round(totalTime / 2);
      } else {
        countryMap.set(analytics.country, { ...analytics });
      }
    });

    return Array.from(countryMap.values())
      .sort((a, b) => b.totalVerifications - a.totalVerifications)
      .slice(0, limit);
  }

  async updateDailyCountryAnalytics(apiKeyId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all verifications for today for this API key
    const todayVerifications = Array.from(this.verifications.values()).filter(
      v => v.apiKeyId === apiKeyId && 
      v.createdAt >= today && 
      v.createdAt < tomorrow
    );

    // Group verifications by country
    const countriesMap = new Map<string, {
      country: string;
      countryName: string;
      verifications: typeof todayVerifications;
    }>();

    for (const verification of todayVerifications) {
      const country = verification.country || 'Unknown';
      const countryName = verification.countryName || 'Unknown';
      
      if (!countriesMap.has(country)) {
        countriesMap.set(country, {
          country,
          countryName,
          verifications: [],
        });
      }
      countriesMap.get(country)!.verifications.push(verification);
    }

    // Update analytics for each country
    for (const [country, data] of Array.from(countriesMap)) {
      const totalVerifications = data.verifications.length;
      const successfulVerifications = data.verifications.filter(v => v.success).length;
      const failedVerifications = data.verifications.filter(v => !v.success).length;
      
      // Calculate average time to solve (only from successful verifications)
      const successfulWithTime = data.verifications.filter(v => v.success && v.timeToSolve !== null);
      const averageTimeToSolve = successfulWithTime.length > 0
        ? Math.round(successfulWithTime.reduce((sum, v) => sum + (v.timeToSolve || 0), 0) / successfulWithTime.length)
        : null;
      
      // Count unique IPs
      const uniqueIpsSet = new Set(data.verifications.map(v => v.ipAddress).filter(ip => ip !== null));
      const uniqueIps = uniqueIpsSet.size;

      // Update or create country analytics record
      await this.createOrUpdateCountryAnalytics({
        apiKeyId,
        country: data.country,
        countryName: data.countryName,
        date: today,
        totalVerifications,
        successfulVerifications,
        failedVerifications,
        averageTimeToSolve,
        uniqueIps,
      });

      console.log(`[ANALYTICS] Updated country analytics for ${apiKeyId} - ${data.countryName} (${data.country}): ${successfulVerifications}/${totalVerifications} successful, ${uniqueIps} unique IPs`);
    }
  }

  // Chat Messages
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const chatMessage: ChatMessage = {
      id,
      developerId: insertMessage.developerId,
      developerName: insertMessage.developerName,
      developerEmail: insertMessage.developerEmail,
      developerAvatar: insertMessage.developerAvatar ?? null,
      content: insertMessage.content ?? '',
      mediaUrl: insertMessage.mediaUrl ?? null,
      mediaType: insertMessage.mediaType ?? null,
      mediaName: insertMessage.mediaName ?? null,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, chatMessage);
    return chatMessage;
  }

  async getChatMessages(limit: number = 100, offset: number = 0): Promise<ChatMessage[]> {
    const allMessages = Array.from(this.chatMessages.values())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    return allMessages.slice(offset, offset + limit);
  }

  async deleteChatMessage(id: string, developerId: string): Promise<boolean> {
    const message = this.chatMessages.get(id);
    if (!message) {
      return false;
    }
    
    // Only allow the message author to delete it
    if (message.developerId !== developerId) {
      return false;
    }
    
    this.chatMessages.delete(id);
    return true;
  }
}

import { DatabaseStorage } from "./db-storage";

let storageInstance: IStorage | null = null;
let storageInitialized = false;

async function initializeStorage(): Promise<IStorage> {
  if (!process.env.DATABASE_URL) {
    console.log('[STORAGE] No DATABASE_URL configured, using in-memory storage (MemStorage)');
    return new MemStorage();
  }

  console.log('[STORAGE] DATABASE_URL configured, attempting database connection...');
  const dbStorage = new DatabaseStorage(process.env.DATABASE_URL);
  await dbStorage.getAllApiKeys();
  console.log('[STORAGE] Database connection successful, using DatabaseStorage');
  return dbStorage;
}

export async function getStorage(migrationsSuccessful = false): Promise<IStorage> {
  if (storageInstance && !migrationsSuccessful) {
    return storageInstance;
  }
  
  if (migrationsSuccessful && process.env.DATABASE_URL) {
    console.log('[STORAGE] Reinitializing storage after successful migrations...');
    const dbStorage = new DatabaseStorage(process.env.DATABASE_URL);
    await dbStorage.getAllApiKeys();
    console.log('[STORAGE] Using DatabaseStorage (migrations successful)');
    storageInstance = dbStorage;
    storageInitialized = true;
    return dbStorage;
  }
  
  if (!storageInitialized) {
    console.log('[STORAGE] First-time initialization...');
    try {
      storageInstance = await initializeStorage();
      storageInitialized = true;
    } catch (err: any) {
      console.error('[STORAGE] Failed to initialize storage:', err);
      if (process.env.DATABASE_URL) {
        console.error('[STORAGE] DATABASE_URL is configured but connection failed!');
        console.error('[STORAGE] Please check your database configuration or run migrations.');
        console.error('[STORAGE] Error details:', err?.message || err);
        console.error('[STORAGE] Application cannot continue without database connection.');
        throw err;
      } else {
        console.log('[STORAGE] No DATABASE_URL configured, falling back to MemStorage');
        storageInstance = new MemStorage();
        storageInitialized = true;
      }
    }
  }
  
  return storageInstance!;
}

export const storage = new Proxy({} as IStorage, {
  get(_target, prop) {
    if (!storageInstance) {
      throw new Error('Storage not initialized. Make sure to await storage initialization before using it.');
    }
    return (storageInstance as any)[prop];
  }
});
