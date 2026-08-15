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
      label: "Official WhatsApp Number",
      placeholder: "e.g. +92 300 1234567",
      required: true,
      enabled: true,
      description: "Direct WhatsApp number for instant booking alerts & traveler communication.",
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

export interface VendorKYCRecord {
  isSubmitted: boolean;
  status: "not_submitted" | "submitted" | "approved" | "rejected";
  submittedAt?: string | null;
  registeredAt?: string | null;
  fields: Record<string, string>;
}

export const submitVendorKYC = createServerFn({ method: "POST" })
  .validator((data: { userId: string; profileUpdates: Record<string, any> }) => data)
  .handler(async ({ data }) => {
    const { userId, profileUpdates } = data;
    if (!userId) throw new Error("Vendor user ID is required");

    // 1. Strictly filter only valid columns present in profiles table schema
    const standardUpdates: Record<string, any> = {
      vendor_status: "pending",
      updated_at: new Date().toISOString(),
    };

    if (profileUpdates.company_name !== undefined) standardUpdates.company_name = profileUpdates.company_name;
    if (profileUpdates.city !== undefined) standardUpdates.city = profileUpdates.city;
    if (profileUpdates.full_name !== undefined) standardUpdates.full_name = profileUpdates.full_name;

    // Update standard profile fields (only valid columns)
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .update(standardUpdates)
      .eq("id", userId);

    if (profileErr) {
      console.error("[submitVendorKYC Profile Update Error]:", profileErr);
      throw new Error(profileErr.message);
    }

    // Update phone in Auth user_metadata if provided
    if (profileUpdates.phone) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { phone: profileUpdates.phone },
        });
      } catch (err) {
        console.warn("[submitVendorKYC Phone Metadata Error]:", err);
      }
    }

    // 2. Store full dynamic KYC payload in payment_gateway_settings with is_submitted: true
    const kycPayload = {
      userId,
      is_submitted: true,
      status: "submitted",
      submittedAt: new Date().toISOString(),
      fields: profileUpdates,
    };

    const { error: kycErr } = await supabaseAdmin
      .from("payment_gateway_settings")
      .upsert({
        provider: `vendor_kyc_${userId}`,
        is_enabled: true,
        settings: JSON.stringify(kycPayload),
        updated_at: new Date().toISOString(),
      });

    if (kycErr) {
      console.error("[submitVendorKYC Storage Error]:", kycErr);
    }

    return { success: true };
  });

export const getVendorKYCDetails = createServerFn({ method: "POST" })
  .validator((data: { userId: string }) => data)
  .handler(async ({ data }): Promise<VendorKYCRecord | null> => {
    try {
      const { data: record } = await supabaseAdmin
        .from("payment_gateway_settings")
        .select("settings")
        .eq("provider", `vendor_kyc_${data.userId}`)
        .maybeSingle();

      if (!record?.settings) return null;
      const parsed = typeof record.settings === "string" ? JSON.parse(record.settings) : record.settings;
      if (!parsed) return null;

      const fields = (parsed.fields || {}) as Record<string, string>;
      
      // Determine if actually submitted:
      // Either explicit is_submitted flag is true OR vendor has provided critical registration identifiers like DTS, NTN or CNIC
      const hasMeaningfulDocs = Boolean(
        fields.dts_license?.trim() ||
        fields.ntn_number?.trim() ||
        fields.cnic_number?.trim() ||
        fields.office_address?.trim()
      );

      const isSubmitted = parsed.is_submitted === true || (parsed.is_submitted !== false && hasMeaningfulDocs);
      const status: "not_submitted" | "submitted" | "approved" | "rejected" = 
        parsed.status || (isSubmitted ? "submitted" : "not_submitted");

      return {
        isSubmitted,
        status,
        submittedAt: parsed.submittedAt || null,
        registeredAt: parsed.registeredAt || null,
        fields,
      };
    } catch (err) {
      console.error("[getVendorKYCDetails Exception]:", err);
      return null;
    }
  });
