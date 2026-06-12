/**
 * Morocco (+212) phone normalization — ported from marketplace-web phonePasswordAuth.js
 */
export function buildMoroccoE164(localDigits) {
  const digits = String(localDigits || '').replace(/\D/g, '');
  let national = digits;
  if (national.startsWith('0')) national = national.slice(1);
  if (national.startsWith('212')) national = national.slice(3);
  if (national.length < 9) return null;
  return `+212${national.slice(0, 12)}`;
}

export function validateMoroccoPhone(localPhone) {
  const e164 = buildMoroccoE164(localPhone);
  if (!e164) {
    throw new Error('Invalid phone number.');
  }
  return e164;
}
