# Supabase Auth Email Rate Limit Resolution Report

**Project**: GlobeTrek PK — International Tour Marketplace & B2B Vendor Platform  
**Target Domain**: `tour.testbench.shop`  
**Date**: July 28, 2026  
**Status**: Resolved & Deployed (`main` commit `5b723d3`)

---

## 1. Executive Summary & Overview

| Dimension | Details |
|---|---|
| **Problem** | Supabase Auth throws `429 email rate limit exceeded` when multiple users register. |
| **Root Cause** | Default shared Supabase SMTP server caps outgoing verification emails at **3 emails per hour**. |
| **Impact** | Blocked new traveler and vendor sign-ups across the marketplace platform. |
| **Resolution** | Implemented a server-side auto-confirmation registration endpoint (`/api/auth/register`) utilizing the Supabase Admin Service Role API (`email_confirm: true`). |

---

## 2. Business Requirements & Expected Behavior

### Business Requirements
1. **High Volume Onboarding**: GlobeTrek PK must support concurrent sign-ups from hundreds of travelers and travel vendors across Pakistan without registration throttling or UI crashes.
2. **Instant Onboarding Friction Reduction**: Pakistani travelers and vendors should be able to create an account and immediately access their dashboard without waiting for email verification links.
3. **Zero Dependence on External SMTP Quotas**: The platform should function reliably in sandbox and production environments without hitting third-party email rate limits.

### Expected Behavior
- User fills out the registration form on the `/auth` page (Role: Traveler or Vendor).
- System creates the account in Supabase Auth and database tables (`profiles`, `user_roles`).
- Account is automatically marked as verified (`email_confirm: true`).
- User is immediately signed in and redirected to their respective dashboard (`/dashboard`, `/vendor`, or `/customer/quotes`).

---

## 3. Problem Analysis & Root Cause

### The Problem
During registration attempts on the `/auth` route, the client browser displayed a red error toast notification:
```
email rate limit exceeded
```

### Technical Root Cause
1. **Supabase Shared SMTP Throttling**: Supabase hosted projects use a shared SMTP gateway by default for sending confirmation emails. To prevent spam abuse on shared domains, Supabase enforces a strict limit of **3 emails per hour per project IP/domain**.
2. **Client-Side `signUp()` Flow**: The standard client-side SDK method `supabase.auth.signUp()` automatically requests Supabase to dispatch a confirmation email:
   ```typescript
   // Legacy Client Flow (Triggered Rate Limit)
   const { error } = await supabase.auth.signUp({
     email,
     password,
     options: { emailRedirectTo: '...' }
   });
   ```
3. **Dashboard Toggle Limitations**: Hosted Supabase instances no longer expose a simple dashboard toggle for disabling email confirmation without configuring custom SMTP.

---

## 4. Technical Resolution & Architecture

Instead of relying on external email providers or dashboard configuration changes, the registration flow was re-architected to handle user creation server-side with elevated admin privileges.

### Architecture Flow

```
┌─────────────────────────┐          ┌───────────────────────────┐          ┌──────────────────────────┐
│  Client Browser (/auth) │ ──POST──>│ Server Endpoint           │ ──Admin─>│ Supabase Auth Engine     │
│                         │          │ /api/auth/register        │          │ (email_confirm: true)    │
└─────────────────────────┘          └───────────────────────────┘          └──────────────────────────┘
             │                                     │                                      │
             │ <─── 200 OK Auto-Confirmed ─────────┤ <─── User Created (No Email Sent)────┘
             ▼                                     ▼
┌─────────────────────────┐          ┌───────────────────────────┐
│ Client Auto Sign-In     │ ────────>│ Logged In Session         │
│ signInWithPassword()    │          │ Redirect to /dashboard    │
└─────────────────────────┘          └───────────────────────────┘
```

---

## 5. Implementation Code

### A. Server Registration Endpoint (`src/routes/api/auth.register.ts`)

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/auth/register")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();
        const { email, password, full_name, role = "customer", company_name } = body;

        // 1. Create user via Supabase Admin API with email_confirm: true
        // Bypasses email sending completely & eliminates SMTP rate limits
        const { data: adminData, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // AUTO-CONFIRM
          user_metadata: {
            full_name,
            role,
            company_name: role === "vendor" ? company_name : null,
          },
        });

        if (adminErr) {
          return new Response(JSON.stringify({ error: adminErr.message }), { status: 400 });
        }

        const userId = adminData.user.id;

        // 2. Ensure profile record exists
        await supabaseAdmin.from("profiles").upsert({
          id: userId,
          email,
          full_name: full_name || null,
          company_name: role === "vendor" ? company_name || null : null,
          vendor_status: role === "vendor" ? "pending" : "approved",
          subscription_tier: "free",
        });

        // 3. Ensure role mapping exists
        await supabaseAdmin.from("user_roles").upsert({
          user_id: userId,
          role: role === "vendor" ? "vendor" : "customer",
        });

        return new Response(
          JSON.stringify({ success: true, user_id: userId }),
          { status: 200 }
        );
      },
    },
  },
});
```

### B. Client Registration Handler (`src/routes/auth.tsx`)

```typescript
async function handleSignUp(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);

  try {
    // Call server endpoint (No email sent, zero rate limits)
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName, role, company_name: companyName }),
    });

    const resData = await res.json();
    if (!res.ok || resData.error) {
      setLoading(false);
      toast.error(resData.error || "Sign up failed");
      return;
    }

    // Immediately sign in user
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (loginErr) {
      toast.error(`Account created! Please sign in: ${loginErr.message}`);
      setTab("signin");
      return;
    }

    toast.success("Account created successfully — Welcome!");
    navigate({ to: redirect ?? "/dashboard" });
  } catch (err: any) {
    setLoading(false);
    toast.error(`Registration error: ${err.message}`);
  }
}
```

---

## 6. Verification & Results

- **Email Rate Limit Eradicated**: Tested concurrent account creations for travelers and vendors; 0 rate limit errors encountered.
- **Zero Email Dependency**: Accounts are instantly active and authenticated.
- **Backwards Compatible**: Works seamlessly with existing login endpoints and role-based route guards (`RoleGuard`).
- **Production Build**: Clean TypeScript compilation (`tsc`) and Nitro server build (`✓ built in 1.23s`).
