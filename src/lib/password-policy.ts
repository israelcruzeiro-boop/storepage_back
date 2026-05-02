import { AppError } from './errors.js';

export const TEMPORARY_INITIAL_PASSWORD = '123456';

export function isTemporaryInitialPassword(password: string): boolean {
  return password === TEMPORARY_INITIAL_PASSWORD;
}

export function assertNewPasswordAllowed(password: string): void {
  if (isTemporaryInitialPassword(password)) {
    throw new AppError(
      400,
      'PASSWORD_POLICY_VIOLATION',
      'New password must be different from the temporary first-access password.',
    );
  }
}
