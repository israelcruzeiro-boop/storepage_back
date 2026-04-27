import { AppError } from '../lib/errors.js';
import type { AuthenticatedActor } from '../modules/auth/contracts/auth.types.js';
import type {
  IncrementUserStatsResult,
  LegacyRpcRepository,
} from '../repositories/contracts/legacy-rpc.repository.js';

export interface IncrementUserStatsCommand {
  xpToAdd: number;
  coinsToAdd: number;
}

/**
 * Wraps the legacy `increment_user_stats` RPC behind an HTTP-friendly service.
 *
 * Authorization rule: the actor can only increment its own stats. Admin or
 * system flows that need to award XP to other users should go through a
 * dedicated admin endpoint, not this one.
 */
export class UserRewardsService {
  public constructor(private readonly legacyRpc: LegacyRpcRepository) {}

  public async incrementSelfStats(
    actor: AuthenticatedActor,
    command: IncrementUserStatsCommand,
  ): Promise<IncrementUserStatsResult> {
    if (!Number.isFinite(command.xpToAdd) || !Number.isFinite(command.coinsToAdd)) {
      throw new AppError(400, 'BAD_REQUEST', 'XP and coins must be finite numbers.');
    }

    if (command.xpToAdd === 0 && command.coinsToAdd === 0) {
      // Mirror the legacy frontend behaviour: noop when nothing changes.
      return { userId: actor.userId, xpTotal: null, coinsTotal: null };
    }

    return this.legacyRpc.incrementUserStats({
      userId: actor.userId,
      xpToAdd: command.xpToAdd,
      coinsToAdd: command.coinsToAdd,
    });
  }
}
