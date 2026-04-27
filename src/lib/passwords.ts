import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const SCRYPT_KEY_LENGTH = 64;

export class PasswordService {
  public async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derivedKey = (await scrypt(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;

    return `scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
  }

  public async verifyPassword(password: string, passwordHash: string | null): Promise<boolean> {
    if (!passwordHash) {
      return false;
    }

    const [algorithm, saltHex, hashHex] = passwordHash.split('$');

    if (algorithm !== 'scrypt' || !saltHex || !hashHex) {
      return false;
    }

    const salt = Buffer.from(saltHex, 'hex');
    const expectedHash = Buffer.from(hashHex, 'hex');
    const derivedKey = (await scrypt(password, salt, expectedHash.length)) as Buffer;

    return timingSafeEqual(derivedKey, expectedHash);
  }
}
