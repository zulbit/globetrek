export function formatAndLimitPhone(val: string): string {
  const trimmed = val.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  let formatted = hasPlus ? "+" + digits : digits;

  // Auto-prefix local Pakistani mobile format (e.g. 03001234567 -> +923001234567)
  if (!hasPlus && formatted.startsWith("03")) {
    formatted = "+92" + formatted.slice(1);
  } else if (!hasPlus && formatted.startsWith("92")) {
    formatted = "+" + formatted;
  } else if (!hasPlus && formatted.startsWith("3")) {
    formatted = "+92" + formatted;
  }

  // Enforce strict 13 character limit
  if (formatted.length > 13) {
    formatted = formatted.slice(0, 13);
  }

  return formatted;
}

export function validatePhone(phone: string): { isValid: boolean; formatted: string; error?: string } {
  const formatted = formatAndLimitPhone(phone);

  if (!formatted) {
    return { isValid: false, formatted, error: "Please enter your phone number" };
  }

  if (formatted.length < 13) {
    return {
      isValid: false,
      formatted,
      error: `Phone number must be 13 characters (currently ${formatted.length}/13). Please enter a valid number (e.g. +923001234567 or 03001234567)`,
    };
  }

  if (!/^\+923\d{9}$/.test(formatted)) {
    return {
      isValid: false,
      formatted,
      error: "Please enter a valid 13-character Pakistani mobile number starting with +923 (e.g. +923001234567)",
    };
  }

  return { isValid: true, formatted };
}
