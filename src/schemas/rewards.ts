import { z } from 'zod';

export const incrementUserStatsBodySchema = z
  .object({
    xp: z.number().int().min(0).max(1_000_000).default(0),
    coins: z.number().int().min(0).max(1_000_000).default(0),
  })
  .refine((value) => value.xp > 0 || value.coins > 0, {
    message: 'At least one of xp or coins must be greater than zero.',
  });

export type IncrementUserStatsBody = z.infer<typeof incrementUserStatsBodySchema>;
