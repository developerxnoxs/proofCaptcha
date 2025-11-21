import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { eq, and, gte, lte, desc, isNull, sql } from "drizzle-orm";
import ws from "ws";
import * as schema from "@shared/schema";
import {
  developers,
  apiKeys,
  challenges,
  verifications,
  analytics,
  countryAnalytics,
  chatMessages,
  tickets,
  notifications,
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
  type Ticket,
  type InsertTicket,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { nanoid } from "nanoid";
import type { IStorage } from "./storage";
import { generateKeyPair } from "./crypto-utils";

export class DatabaseStorage implements IStorage {
  private db;

  constructor(databaseUrl: string) {
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString: databaseUrl });
    this.db = drizzle({ client: pool, schema });
  }

  async createDeveloper(insertDeveloper: InsertDeveloper): Promise<Developer> {
    const [developer] = await this.db
      .insert(developers)
      .values(insertDeveloper)
      .returning();
    return developer;
  }

  async getDeveloper(id: string): Promise<Developer | undefined> {
    const [developer] = await this.db
      .select()
      .from(developers)
      .where(eq(developers.id, id))
      .limit(1);
    return developer;
  }

  async getDeveloperByEmail(email: string): Promise<Developer | undefined> {
    const [developer] = await this.db
      .select()
      .from(developers)
      .where(eq(developers.email, email))
      .limit(1);
    return developer;
  }

  async getDeveloperById(id: string): Promise<Developer | undefined> {
    const [developer] = await this.db
      .select()
      .from(developers)
      .where(eq(developers.id, id))
      .limit(1);
    return developer;
  }

  async verifyDeveloperEmail(id: string): Promise<void> {
    await this.db
      .update(developers)
      .set({
        isEmailVerified: true,
        verificationCode: null,
        verificationCodeExpiry: null,
      })
      .where(eq(developers.id, id));
  }

  async updateVerificationCode(id: string, code: string, expiry: Date): Promise<void> {
    await this.db
      .update(developers)
      .set({
        verificationCode: code,
        verificationCodeExpiry: expiry,
      })
      .where(eq(developers.id, id));
  }

  async updateResetPasswordCode(email: string, code: string, expiry: Date): Promise<void> {
    await this.db
      .update(developers)
      .set({
        resetPasswordCode: code,
        resetPasswordCodeExpiry: expiry,
      })
      .where(eq(developers.email, email));
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<boolean> {
    const developer = await this.getDeveloperByEmail(email);
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

    await this.db
      .update(developers)
      .set({
        password: newPassword,
        resetPasswordCode: null,
        resetPasswordCodeExpiry: null,
      })
      .where(eq(developers.email, email));

    return true;
  }

  async updateDeveloperProfile(id: string, updates: Partial<Pick<Developer, 'name' | 'avatar' | 'bio' | 'company' | 'website' | 'location'>>): Promise<Developer | undefined> {
    const [developer] = await this.db
      .update(developers)
      .set(updates)
      .where(eq(developers.id, id))
      .returning();
    return developer;
  }

  async getAllDevelopers(): Promise<Developer[]> {
    return await this.db
      .select()
      .from(developers);
  }

  async updateDeveloperRole(id: string, role: string): Promise<Developer | undefined> {
    const [developer] = await this.db
      .update(developers)
      .set({ role })
      .where(eq(developers.id, id))
      .returning();
    return developer;
  }

  async deleteDeveloper(id: string): Promise<boolean> {
    // First delete all API keys associated with this developer
    await this.db
      .delete(apiKeys)
      .where(eq(apiKeys.developerId, id));

    // Then delete the developer
    const result = await this.db
      .delete(developers)
      .where(eq(developers.id, id))
      .returning();

    return result.length > 0;
  }

  // API Keys
  async createApiKey(insertApiKey: InsertApiKey, customKeys?: { sitekey: string; secretkey: string }): Promise<ApiKey> {
    const { siteKey, secretKey } = customKeys 
      ? { siteKey: customKeys.sitekey, secretKey: customKeys.secretkey }
      : generateKeyPair();

    const [apiKey] = await this.db
      .insert(apiKeys)
      .values({
        developerId: insertApiKey.developerId,
        name: insertApiKey.name,
        sitekey: siteKey,
        secretkey: secretKey,
        domain: insertApiKey.domain || null,
        theme: insertApiKey.theme || 'light',
        isActive: insertApiKey.isActive ?? true,
      })
      .returning();

    return apiKey;
  }

  async getApiKeysByDeveloper(developerId: string): Promise<ApiKey[]> {
    return await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.developerId, developerId));
  }

  async getApiKey(id: string): Promise<ApiKey | undefined> {
    const [apiKey] = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, id))
      .limit(1);

    return apiKey;
  }

  async getApiKeyBySitekey(sitekey: string): Promise<ApiKey | undefined> {
    const [apiKey] = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.sitekey, sitekey))
      .limit(1);

    return apiKey;
  }

  async getApiKeyBySecretkey(secretkey: string): Promise<ApiKey | undefined> {
    const [apiKey] = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.secretkey, secretkey))
      .limit(1);

    return apiKey;
  }

  async getAllApiKeys(): Promise<ApiKey[]> {
    return await this.db.select().from(apiKeys);
  }

  async updateApiKeyStatus(id: string, isActive: boolean): Promise<void> {
    await this.db
      .update(apiKeys)
      .set({ isActive })
      .where(eq(apiKeys.id, id));
  }

  async updateApiKeySettings(id: string, settings: any): Promise<void> {
    await this.db
      .update(apiKeys)
      .set({ settings })
      .where(eq(apiKeys.id, id));
  }

  async deleteApiKey(id: string): Promise<void> {
    await this.db.delete(apiKeys).where(eq(apiKeys.id, id));
  }

  // Challenges
  async createChallenge(insertChallenge: InsertChallenge): Promise<Challenge> {
    const [challenge] = await this.db
      .insert(challenges)
      .values({
        token: insertChallenge.token,
        difficulty: insertChallenge.difficulty ?? 4,
        challengeData: insertChallenge.challengeData,
        type: insertChallenge.type,
        apiKeyId: insertChallenge.apiKeyId || null,
        validatedDomain: insertChallenge.validatedDomain,
        signature: insertChallenge.signature,
        isUsed: insertChallenge.isUsed ?? false,
        expiresAt: insertChallenge.expiresAt,
      })
      .returning();

    return challenge;
  }

  async getChallenge(id: string): Promise<Challenge | undefined> {
    const [challenge] = await this.db
      .select()
      .from(challenges)
      .where(eq(challenges.id, id))
      .limit(1);

    return challenge;
  }

  async getChallengeByToken(token: string): Promise<Challenge | undefined> {
    const [challenge] = await this.db
      .select()
      .from(challenges)
      .where(eq(challenges.token, token))
      .limit(1);

    return challenge;
  }

  async markChallengeAsUsed(id: string): Promise<boolean> {
    const result = await this.db
      .update(challenges)
      .set({ isUsed: true })
      .where(and(eq(challenges.id, id), eq(challenges.isUsed, false)))
      .returning({ id: challenges.id });
    
    return result.length > 0;
  }

  async getAllChallenges(): Promise<Challenge[]> {
    return await this.db.select().from(challenges);
  }

  async deleteChallenge(id: string): Promise<void> {
    const hasVerifications = await this.db
      .select({ id: verifications.id })
      .from(verifications)
      .where(eq(verifications.challengeId, id))
      .limit(1);
    
    if (hasVerifications.length === 0) {
      await this.db.delete(challenges).where(eq(challenges.id, id));
    }
  }

  // Verifications
  async createVerification(insertVerification: InsertVerification): Promise<Verification> {
    const [verification] = await this.db
      .insert(verifications)
      .values({
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
      })
      .returning();

    return verification;
  }

  async getVerificationsByApiKey(apiKeyId: string, limit: number = 100): Promise<Verification[]> {
    return await this.db
      .select()
      .from(verifications)
      .where(eq(verifications.apiKeyId, apiKeyId))
      .orderBy(desc(verifications.createdAt))
      .limit(limit);
  }

  async getRecentVerifications(limit: number = 100): Promise<Verification[]> {
    return await this.db
      .select()
      .from(verifications)
      .orderBy(desc(verifications.createdAt))
      .limit(limit);
  }

  async deleteVerification(id: string): Promise<void> {
    await this.db
      .delete(verifications)
      .where(eq(verifications.id, id));
  }

  // Analytics
  async createOrUpdateAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    // Build the where condition to properly handle null apiKeyId
    const apiKeyCondition = insertAnalytics.apiKeyId 
      ? eq(analytics.apiKeyId, insertAnalytics.apiKeyId)
      : isNull(analytics.apiKeyId);
    
    const [existing] = await this.db
      .select()
      .from(analytics)
      .where(
        and(
          apiKeyCondition,
          eq(analytics.date, insertAnalytics.date)
        )
      )
      .limit(1);

    if (existing) {
      const [updated] = await this.db
        .update(analytics)
        .set({
          totalChallenges: insertAnalytics.totalChallenges,
          successfulVerifications: insertAnalytics.successfulVerifications,
          failedVerifications: insertAnalytics.failedVerifications,
          averageTimeToSolve: insertAnalytics.averageTimeToSolve,
          uniqueIps: insertAnalytics.uniqueIps,
        })
        .where(eq(analytics.id, existing.id))
        .returning();

      return updated;
    }

    const [newAnalytics] = await this.db
      .insert(analytics)
      .values({
        apiKeyId: insertAnalytics.apiKeyId || null,
        date: insertAnalytics.date,
        totalChallenges: insertAnalytics.totalChallenges ?? 0,
        successfulVerifications: insertAnalytics.successfulVerifications ?? 0,
        failedVerifications: insertAnalytics.failedVerifications ?? 0,
        averageTimeToSolve: insertAnalytics.averageTimeToSolve || null,
        uniqueIps: insertAnalytics.uniqueIps ?? 0,
      })
      .returning();

    return newAnalytics;
  }

  async getAnalyticsByApiKey(
    apiKeyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Analytics[]> {
    const conditions = [eq(analytics.apiKeyId, apiKeyId)];

    if (startDate) {
      conditions.push(gte(analytics.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(analytics.date, endDate));
    }

    return await this.db
      .select()
      .from(analytics)
      .where(and(...conditions));
  }

  async getAnalyticsByDateRange(startDate: Date, endDate: Date): Promise<Analytics[]> {
    return await this.db
      .select()
      .from(analytics)
      .where(and(gte(analytics.date, startDate), lte(analytics.date, endDate)));
  }

  /**
   * Update analytics aggregates for today based on actual verification data
   * This should be called after each verification
   */
  async updateDailyAnalytics(apiKeyId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all verifications for today for this API key
    const todayVerifications = await this.db
      .select()
      .from(verifications)
      .where(
        and(
          eq(verifications.apiKeyId, apiKeyId),
          gte(verifications.createdAt, today),
          sql`${verifications.createdAt} < ${tomorrow}`
        )
      );

    // Get all challenges created today for this API key
    const todayChallenges = await this.db
      .select({ id: challenges.id })
      .from(challenges)
      .where(
        and(
          eq(challenges.apiKeyId, apiKeyId),
          gte(challenges.createdAt, today),
          sql`${challenges.createdAt} < ${tomorrow}`
        )
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

  /**
   * Update country analytics aggregates for today based on actual verification data
   * This should be called after each verification
   */
  async updateDailyCountryAnalytics(apiKeyId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all verifications for today for this API key
    const todayVerifications = await this.db
      .select()
      .from(verifications)
      .where(
        and(
          eq(verifications.apiKeyId, apiKeyId),
          gte(verifications.createdAt, today),
          sql`${verifications.createdAt} < ${tomorrow}`
        )
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
      const successfulVerifications = data.verifications.filter((v: any) => v.success).length;
      const failedVerifications = data.verifications.filter((v: any) => !v.success).length;
      
      // Calculate average time to solve (only from successful verifications)
      const successfulWithTime = data.verifications.filter((v: any) => v.success && v.timeToSolve !== null);
      const averageTimeToSolve = successfulWithTime.length > 0
        ? Math.round(successfulWithTime.reduce((sum: number, v: any) => sum + (v.timeToSolve || 0), 0) / successfulWithTime.length)
        : null;
      
      // Count unique IPs
      const uniqueIpsSet = new Set(data.verifications.map((v: any) => v.ipAddress).filter((ip: any) => ip !== null));
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

  // Country Analytics
  async createOrUpdateCountryAnalytics(insertCountryAnalytics: InsertCountryAnalytics): Promise<CountryAnalytics> {
    const existing = await this.db
      .select()
      .from(countryAnalytics)
      .where(
        and(
          eq(countryAnalytics.apiKeyId, insertCountryAnalytics.apiKeyId || ''),
          eq(countryAnalytics.country, insertCountryAnalytics.country),
          sql`DATE(${countryAnalytics.date}) = DATE(${insertCountryAnalytics.date})`
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await this.db
        .update(countryAnalytics)
        .set({
          totalVerifications: insertCountryAnalytics.totalVerifications,
          successfulVerifications: insertCountryAnalytics.successfulVerifications,
          failedVerifications: insertCountryAnalytics.failedVerifications,
          averageTimeToSolve: insertCountryAnalytics.averageTimeToSolve,
          uniqueIps: insertCountryAnalytics.uniqueIps,
        })
        .where(eq(countryAnalytics.id, existing[0].id))
        .returning();

      return updated;
    }

    const [newCountryAnalytics] = await this.db
      .insert(countryAnalytics)
      .values({
        apiKeyId: insertCountryAnalytics.apiKeyId,
        country: insertCountryAnalytics.country,
        countryName: insertCountryAnalytics.countryName,
        date: insertCountryAnalytics.date,
        totalVerifications: insertCountryAnalytics.totalVerifications ?? 0,
        successfulVerifications: insertCountryAnalytics.successfulVerifications ?? 0,
        failedVerifications: insertCountryAnalytics.failedVerifications ?? 0,
        averageTimeToSolve: insertCountryAnalytics.averageTimeToSolve || null,
        uniqueIps: insertCountryAnalytics.uniqueIps ?? 0,
      })
      .returning();

    return newCountryAnalytics;
  }

  async getCountryAnalyticsByApiKey(
    apiKeyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CountryAnalytics[]> {
    const conditions = [eq(countryAnalytics.apiKeyId, apiKeyId)];

    if (startDate) {
      conditions.push(gte(countryAnalytics.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(countryAnalytics.date, endDate));
    }

    return await this.db
      .select()
      .from(countryAnalytics)
      .where(and(...conditions))
      .orderBy(desc(countryAnalytics.totalVerifications));
  }

  async getCountryAnalyticsSummary(apiKeyId?: string, limit: number = 20): Promise<CountryAnalytics[]> {
    let query = this.db
      .select({
        id: sql`MAX(${countryAnalytics.id})`.as('id'),
        apiKeyId: countryAnalytics.apiKeyId,
        country: countryAnalytics.country,
        countryName: sql`MAX(${countryAnalytics.countryName})`.as('countryName'),
        date: sql`MAX(${countryAnalytics.date})`.as('date'),
        totalVerifications: sql<number>`SUM(${countryAnalytics.totalVerifications})`.as('totalVerifications'),
        successfulVerifications: sql<number>`SUM(${countryAnalytics.successfulVerifications})`.as('successfulVerifications'),
        failedVerifications: sql<number>`SUM(${countryAnalytics.failedVerifications})`.as('failedVerifications'),
        averageTimeToSolve: sql<number>`AVG(${countryAnalytics.averageTimeToSolve})`.as('averageTimeToSolve'),
        uniqueIps: sql<number>`SUM(${countryAnalytics.uniqueIps})`.as('uniqueIps'),
      })
      .from(countryAnalytics)
      .groupBy(countryAnalytics.country, countryAnalytics.apiKeyId);

    if (apiKeyId) {
      query = query.where(eq(countryAnalytics.apiKeyId, apiKeyId)) as any;
    }

    const results = await query
      .orderBy(desc(sql`SUM(${countryAnalytics.totalVerifications})`))
      .limit(limit);

    return results as CountryAnalytics[];
  }

  // Chat Messages
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [chatMessage] = await this.db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return chatMessage;
  }

  async getChatMessages(limit: number = 100, offset: number = 0): Promise<ChatMessage[]> {
    return await this.db
      .select()
      .from(chatMessages)
      .orderBy(chatMessages.createdAt)
      .limit(limit)
      .offset(offset);
  }

  async deleteChatMessage(id: string, developerId: string): Promise<boolean> {
    const result = await this.db
      .delete(chatMessages)
      .where(and(
        eq(chatMessages.id, id),
        eq(chatMessages.developerId, developerId)
      ))
      .returning();
    
    return result.length > 0;
  }

  // Tickets
  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const [ticket] = await this.db
      .insert(tickets)
      .values(insertTicket)
      .returning();
    return ticket;
  }

  async getTicket(id: string): Promise<Ticket | undefined> {
    const [ticket] = await this.db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id))
      .limit(1);
    return ticket;
  }

  async getTicketsByDeveloper(developerId: string): Promise<Ticket[]> {
    return await this.db
      .select()
      .from(tickets)
      .where(eq(tickets.developerId, developerId))
      .orderBy(desc(tickets.createdAt));
  }

  async getAllTickets(): Promise<Ticket[]> {
    return await this.db
      .select()
      .from(tickets)
      .orderBy(desc(tickets.createdAt));
  }

  async updateTicketStatus(id: string, status: string): Promise<void> {
    await this.db
      .update(tickets)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(tickets.id, id));
  }

  async updateTicketResponse(id: string, response: string, respondedBy: string): Promise<void> {
    await this.db
      .update(tickets)
      .set({ 
        response,
        respondedBy,
        respondedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(tickets.id, id));
  }

  async deleteTicket(id: string): Promise<boolean> {
    const result = await this.db
      .delete(tickets)
      .where(eq(tickets.id, id))
      .returning();
    
    return result.length > 0;
  }

  // Notifications
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await this.db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);
    return notification;
  }

  async getNotificationsByDeveloper(developerId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    const conditions = [eq(notifications.developerId, developerId)];
    
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }
    
    return await this.db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(developerId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.developerId, developerId),
        eq(notifications.isRead, false)
      ));
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await this.db
      .delete(notifications)
      .where(eq(notifications.id, id))
      .returning();
    
    return result.length > 0;
  }

  async getUnreadNotificationCount(developerId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.developerId, developerId),
        eq(notifications.isRead, false)
      ));
    
    return Number(result[0]?.count || 0);
  }
}
