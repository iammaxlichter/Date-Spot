export function sanitizeOneToTenInput(text: string): string {
  const cleaned = text.replace(/[^0-9]/g, "");

  if (cleaned === "") return "";

  const num = parseInt(cleaned, 10);

  if (num >= 1 && num <= 10) {
    return num.toString();
  }

  return "";
}
