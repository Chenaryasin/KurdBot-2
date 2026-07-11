export function isValidIraqPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  
  // 1. Convert Arabic/Persian numbers to English
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let clean = phone.trim().replace(/\s+/g, '');
  for (let i = 0; i < 10; i++) {
    clean = clean.split(arabicNumbers[i]).join(i.toString())
                 .split(persianNumbers[i]).join(i.toString());
  }

  // 2. Validate using regex
  // Matches:
  // - 07(5|7|8|9)0-9{8} (11 digits starting with 075, 077, 078, 079)
  // - +9647(5|7|8|9)0-9{8} (starts with +9647, followed by 9 digits)
  // - 009647(5|7|8|9)0-9{8} (starts with 009647, followed by 9 digits)
  // - 7(5|7|8|9)0-9{8} (10 digits starting with 7)
  const regex = /^(?:\+964|00964|0)?7[5789]\d{8}$/;
  return regex.test(clean);
}
