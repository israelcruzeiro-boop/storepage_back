export interface IdentifierLookup {
  companyId: string | null;
  emailCandidates: readonly string[];
  cpfDigits: string | null;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeSlug(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeCpf(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, '') ?? '';
  return digits.length === 11 ? digits : null;
}

export function buildIdentifierLookup(identifier: string, companyId: string | null = null): IdentifierLookup {
  const normalized = identifier.trim().toLowerCase();
  const emailCandidates = new Set<string>();
  const cpfDigits = normalizeCpf(normalized);

  if (normalized.includes('@')) {
    emailCandidates.add(normalized);
  } else {
    emailCandidates.add(`${normalized}@storepage.com`);
  }

  if (cpfDigits) {
    emailCandidates.add(`${cpfDigits}@storepage.com`);
  }

  return {
    companyId,
    emailCandidates: [...emailCandidates],
    cpfDigits,
  };
}
