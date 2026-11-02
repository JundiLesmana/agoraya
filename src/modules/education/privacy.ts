const NIK_PATTERN = /(?<!\d)\d{16}(?!\d)/;
const NISN_PATTERN = /(?<!\d)\d{10}(?!\d)/;

export function containsSensitiveIdentifier(value: string): boolean {
  return NIK_PATTERN.test(value) || NISN_PATTERN.test(value);
}

export function validateEducationFreeText(input: {
  kebutuhan: string;
  catatan: string;
}): boolean {
  return (
    !containsSensitiveIdentifier(input.kebutuhan) &&
    !containsSensitiveIdentifier(input.catatan)
  );
}
