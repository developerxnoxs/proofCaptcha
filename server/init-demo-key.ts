import { storage } from "./storage";
import bcrypt from "bcryptjs";

const DEMO_PUBLIC_KEY = "pk_ab6c4ac2c8976668e6d92fe401386cae18df4c9b4f5193cb140266f6d9546f1c";
const DEMO_PRIVATE_KEY = "sk_demo_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f";

export async function ensureDemoApiKey(): Promise<void> {
  try {
    const demoEmail = "demo@proofcaptcha.local";
    
    let demoDeveloper = await storage.getDeveloperByEmail(demoEmail);
    
    if (!demoDeveloper) {
      console.log("[DEMO KEY] Creating demo developer account...");
      const hashedPassword = await bcrypt.hash("demo-password-not-for-login", 10);
      demoDeveloper = await storage.createDeveloper({
        email: demoEmail,
        password: hashedPassword,
        name: "Demo Application",
      });
      console.log("[DEMO KEY] Demo developer created");
    }
    
    const existingKeys = await storage.getApiKeysByDeveloper(demoDeveloper.id);
    let demoKey = existingKeys.find(k => k.sitekey === DEMO_PUBLIC_KEY);
    
    if (!demoKey) {
      const oldKeys = existingKeys.filter(k => k.name === "Demo Application");
      for (const oldKey of oldKeys) {
        console.log("[DEMO KEY] Removing old demo API key:", oldKey.sitekey);
        await storage.deleteApiKey(oldKey.id);
      }
      
      const existingDemoKey = await storage.getApiKeyBySitekey(DEMO_PUBLIC_KEY);
      if (existingDemoKey) {
        console.log("[DEMO KEY] Demo key with correct sitekey already exists (from another developer)");
        console.log("[DEMO KEY] Deleting it to recreate under demo developer");
        await storage.deleteApiKey(existingDemoKey.id);
      }
      
      console.log("[DEMO KEY] Creating demo API key with custom sitekey...");
      const apiKey = await storage.createApiKey({
        developerId: demoDeveloper.id,
        name: "Demo Application",
        domain: "*",
        isActive: true,
      }, {
        sitekey: DEMO_PUBLIC_KEY,
        secretkey: DEMO_PRIVATE_KEY,
      });
      console.log("[DEMO KEY] Demo API key created:", apiKey.sitekey);
    } else {
      console.log("[DEMO KEY] Demo API key already exists:", demoKey.sitekey);
    }
  } catch (error) {
    console.error("[DEMO KEY] Error ensuring demo API key:", error);
  }
}
