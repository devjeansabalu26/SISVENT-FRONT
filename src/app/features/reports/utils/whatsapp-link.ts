const CALLING_CODES: Readonly<Record<string, string>> = {
  PE: '51', CO: '57', AR: '54', CL: '56', BR: '55', MX: '52', EC: '593', BO: '591', UY: '598', PY: '595', VE: '58',
};

export function whatsappNumber(phone: string | null | undefined, countryCode: string): string | null {
  if (!phone) return null;
  const international = phone.trim().startsWith('+');
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return null;
  if (international) return digits;
  const code = CALLING_CODES[countryCode.toUpperCase()] ?? '';
  if (code && digits.startsWith(code) && digits.length > 10) return digits;
  return code + digits.replace(/^0+/, '');
}

export function whatsappLink(phone: string | null | undefined, countryCode: string, message: string): string | null {
  const number = whatsappNumber(phone, countryCode);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}

export function comebackMessage(customerName: string, companyName: string): string {
  const firstName = customerName.trim().split(/\s+/)[0] ?? '';
  return `Hola ${firstName}, te saludamos de ${companyName}. Hace tiempo no te vemos por la tienda y te extrañamos. `
    + 'Esta semana tenemos novedades para ti, ¡te esperamos!';
}
