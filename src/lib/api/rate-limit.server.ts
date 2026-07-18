// Rate-limit helper — calls the SQL rl_check_for function with service role
// so a per-user sliding-window bucket is enforced atomically inside Postgres.
// Returns { allowed: true } or a ready-made 429 Response.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type RlOk = { allowed: true };
export type RlErr = { allowed: false; response: Response };

export async function requireRateLimit(
  userId: string,
  bucket: string,
  limit: number,
  windowMinutes: number,
): Promise<RlOk | RlErr> {
  try {
    const { data, error } = await supabaseAdmin.rpc("rl_check_for", {
      _user: userId,
      _bucket: bucket,
      _limit: limit,
      _window_minutes: windowMinutes,
    });
    if (error) {
      // Fail-open on infrastructure error so a broken limiter never blocks the app,
      // but log so operators can see it in server logs.
      console.error("[rate-limit] rl_check_for error:", error.message);
      return { allowed: true };
    }
    if (data === false) {
      await supabaseAdmin.from("audit_log").insert({
        user_id: userId,
        event: "security.rate_limit_exceeded",
        detail: { bucket, limit, window_minutes: windowMinutes },
      });
      return {
        allowed: false,
        response: new Response(
          JSON.stringify({
            success: false,
            error: `Rate limit exceeded for ${bucket}. Try again in a few minutes.`,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(windowMinutes * 60),
            },
          },
        ),
      };
    }
    return { allowed: true };
  } catch (err) {
    console.error("[rate-limit] exception:", err);
    return { allowed: true };
  }
}
