import { hashCapability } from "./store.ts";
import type { SqlPool } from "./store.ts";

export async function rateLimit(pool: SqlPool, bucket: string, maximum: number, windowMs = 60 * 60 * 1000): Promise<void> {
  const connection = await pool.connect();
  try {
    const now = new Date(), cutoff = new Date(now.getTime() - windowMs);
    const result = await connection.query<{ requests: number }>(
      `INSERT INTO cultureloop_rate_limits(bucket_key,window_start,requests) VALUES($1,$2,1)
       ON CONFLICT(bucket_key) DO UPDATE SET
       requests=CASE WHEN cultureloop_rate_limits.window_start <= $3 THEN 1 ELSE cultureloop_rate_limits.requests+1 END,
       window_start=CASE WHEN cultureloop_rate_limits.window_start <= $3 THEN $2 ELSE cultureloop_rate_limits.window_start END
       RETURNING requests`, [hashCapability(bucket), now, cutoff]);
    if (!result.rows[0] || result.rows[0].requests > maximum) throw new Error("Request limit reached; try again after the current window.");
  } finally { connection.release(); }
}
