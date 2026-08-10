import fs from "fs";
import path from "path";

// Parse .env file manually to load environment variables
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      content.split("\n").forEach((line) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || "";
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      });
    }
  } catch (e) {
    console.error("Error loading .env file:", e);
  }
}

loadEnv();

async function run() {
  const apiKey = process.env.AGENTROUTER_API_KEY || "sk-hm8WQnMOXrQ1UsVjQhQYpqzzINjCGmc26bD5SkH7IdCmxX1N";
  const endpoint = "https://agentrouter.org/v1/chat/completions";

  const ua = "Kilo-Code/5.7.0";
  console.log(`Testing with User-Agent: "${ua}"...`);
  
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": ua
      },
      body: JSON.stringify({
        model: "claude-opus-5",
        messages: [{ role: "user", content: "Reply with 'Hello'" }],
        max_tokens: 10
      })
    });

    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response: ${text.substring(0, 300)}`);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
