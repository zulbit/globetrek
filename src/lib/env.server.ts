import fs from "node:fs";
import path from "node:path";

export function loadEnv() {
  if (typeof window !== "undefined") return; // Skip on client
  
  // Only load if key environment variables are missing (e.g., SAFEPAY_SECRET_KEY)
  if (process.env.SAFEPAY_SECRET_KEY) return;

  try {
    const cwd = process.cwd();
    const envPath = path.join(cwd, ".env");
    if (!fs.existsSync(envPath)) {
      console.warn("[ENV] .env file not found at:", envPath);
      return;
    }

    const envContent = fs.readFileSync(envPath, "utf8");
    const lines = envContent.split(/\r?\n/);

    for (const line of lines) {
      // Ignore comments and empty lines
      if (line.trim().startsWith("#") || !line.includes("=")) continue;
      
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || "";
        
        // Remove surrounding quotes if any
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.slice(1, -1);
        }
        
        val = val.trim();
        if (!process.env[key]) {
          process.env[key] = val;
          // Also set VITE_ prefixed variables just in case
          if (key.startsWith("VITE_")) {
            const nonPrefixed = key.substring(5);
            if (!process.env[nonPrefixed]) {
              process.env[nonPrefixed] = val;
            }
          } else {
            const prefixed = `VITE_${key}`;
            if (!process.env[prefixed]) {
              process.env[prefixed] = val;
            }
          }
        }
      }
    }
    console.log("[ENV] Successfully loaded environment variables from .env file into process.env");
  } catch (err) {
    console.error("[ENV] Failed to load .env file:", err);
  }
}

// Auto-execute
loadEnv();
