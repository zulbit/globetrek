import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { openRouterModel } from "@/integrations/openrouter/openrouter.server";

export type AskGuideAIInput = {
  question: string;
};

export const askVendorGuideAIServer = createServerFn({ method: "POST" })
  .validator((data: AskGuideAIInput) => data)
  .handler(async ({ data }) => {
    if (!data.question || data.question.trim().length === 0) {
      throw new Error("Question text cannot be empty.");
    }

    const model = openRouterModel();

    const systemPrompt = `You are the official GlobeTrek PK AI Partner Assistant.
Your job is to answer questions from tour operators, travel agents, visa consultants, insurance brokers, and ticketing desks regarding GlobeTrek PK marketplace operations.

Core Marketplace Rules to Reference:
1. Vendor Onboarding & KYC: Requires CNIC/Passport, DTS/NTN business license, bank IBAN for SafePay payouts. Verification takes 24-48 hours.
2. Custom Lead Bidding: Admin verifies traveler budget first. Each custom tour lead has a Max 3 Vendor Unlock Limit. Unlocking costs ₨ 5,000 via SafePay.
3. Quotation & WhatsApp: Unlocked vendors submit online proposals. Submitting a quote sends an instant WhatsApp alert to the traveler with a comparison link.
4. Subscription Tiers: Starter (standard listing) and Pro (priority placement, verified Gold badge, unlimited direct inquiries).
5. AI Tools: GlobeTrek provides built-in AI Tour Itinerary Generator and Bilingual (English & Roman Urdu) AI Concierge.

Formatting Rules:
- Keep responses professional, clear, and encouraging.
- Structure your answer with a bold **Heading** first, followed by a bulleted **Detail** breakdown.
- If asked in Roman Urdu, respond in Roman Urdu. Otherwise respond in English.`;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: data.question,
    });

    return { answer: text };
  });

export type GenerateDemoAIInput = {
  destination: string;
  duration_days: number;
};

export const generateEnterpriseDemoAIServer = createServerFn({ method: "POST" })
  .validator((data: GenerateDemoAIInput) => data)
  .handler(async ({ data }) => {
    const model = openRouterModel();

    const systemPrompt = `You are GlobeTrek PK's AI Tour Itinerary Generator.
Generate a structured, thrilling tour itinerary summary for a given destination and duration.

Format strictly as Markdown:
### [Destination] [Duration]-Day Premium Itinerary

**Package Highlights**: [3-4 bullet points]

#### Day-by-Day Experience:
- **Day 1: Arrival & Orientation** - [Brief detail]
- **Day 2: Core Excursions & Sightseeing** - [Brief detail]
- ... (for duration)

**Recommended Traveler Budget**: Rs 150,000 - Rs 350,000 PKR per person.`;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: `Generate a ${data.duration_days}-day itinerary for ${data.destination}.`,
    });

    return { itinerary: text };
  });
