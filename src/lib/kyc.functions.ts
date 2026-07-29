import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface KYCFieldConfig {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  enabled: boolean;
  description?: string;
}

export interface KYCTemplateSettings {
  fields: KYCFieldConfig[];
  instructions: string;
  auto_approval_enabled: boolean;
}

const DEFAULT_KYC_TEMPLATE: KYCTemplateSettings = {
  instructions: "Please submit your official business registration and tax documents to complete agency verification on GlobeTrek PK.",
  auto_approval_enabled: false,
  fields: [
    {
      id: "company_name",
      label: "Agency / Business Legal Name",
      placeholder: "e.g. Skylark Travels & Tours (Pvt) Ltd",
      required: true,
      enabled: true,
      description: "Registered trade name of your travel desk.",
    },
    {
      id: "phone",
      label: "Mobile / WhatsApp Contact",
      placeholder: "e.g. +92 300 1234567",
      required: true,
      enabled: true,
      description: "Direct mobile number for WhatsApp booking alerts.",
    },
    {
      id: "dts_license",
      label: "DTS License No. / Registration",
      placeholder: "e.g. DTS-LHR-9410",
      required: true,
      enabled: true,
      description: "Department of Tourist Services license number.",
    },
    {
      id: "ntn_number",
      label: "FBR Tax ID / NTN Number",
      placeholder: "e.g. NTN-8941029-7",
      required: true,
      enabled: true,
      description: "Federal Board of Revenue 7-digit tax number.",
    },
    {
      id: "cnic_number",
      label: "Business Owner CNIC Number",
      placeholder: "e.g. 35202-1234567-1",
      required: true,
      enabled: true,
      description: "13-digit national identity card number of proprietor.",
    },
    {
      id: "city",
      label: "Primary Operating City",
      placeholder: "e.g. Lahore, Karachi, Islamabad",
      required: true,
      enabled: true,
      description: "City where main physical office is located.",
    },
    {
      id: "office_address",
      label: "Physical Office Address",
      placeholder: "e.g. Suite 402, Main Boulevard, Gulberg III, Lahore",
      required: true,
      enabled: true,
      description: "Complete street address of agency office.",
    },
    {
      id: "bank_iban",
      label: "Bank IBAN / Account Title",
      placeholder: "e.g. PK36 HABB 0001 2345 6789 0102",
      required: false,
      enabled: true,
      description: "Account details for vendor payout settlements.",
    },
  ],
};

export const getKYCTemplateSettings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from("payment_gateway_settings")
      .select("settings")
      .eq("provider", "kyc_template_settings")
      .maybeSingle();

    if (error) {
      console.error("[getKYCTemplateSettings Error]:", error);
      return DEFAULT_KYC_TEMPLATE;
    }

    if (!data?.settings) {
      return DEFAULT_KYC_TEMPLATE;
    }

    const parsed = typeof data.settings === "string" ? JSON.parse(data.settings) : data.settings;
    return (parsed as KYCTemplateSettings) || DEFAULT_KYC_TEMPLATE;
  } catch (err) {
    console.error("[getKYCTemplateSettings Exception]:", err);
    return DEFAULT_KYC_TEMPLATE;
  }
});

export const saveKYCTemplateSettings = createServerFn({ method: "POST" })
  .validator((data: KYCTemplateSettings) => data)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("payment_gateway_settings").upsert({
      provider: "kyc_template_settings",
      is_enabled: true,
      settings: JSON.stringify(data),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[saveKYCTemplateSettings Error]:", error);
      throw new Error(error.message);
    }

    return { success: true };
  });

export const submitVendorKYC = createServerFn({ method: "POST" })
  .validator((data: { userId: string; profileUpdates: Record<string, any> }) => data)
  .handler(async ({ data }) => {
    const { userId, profileUpdates } = data;
    if (!userId) throw new Error("Vendor user ID is required");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        ...profileUpdates,
        vendor_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("[submitVendorKYC Error]:", error);
      throw new Error(error.message);
    }

    return { success: true };
  });
