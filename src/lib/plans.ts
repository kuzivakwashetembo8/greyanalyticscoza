export const PLAN_UPLOAD_LIMITS: Record<string, number> = {
  free: 5,
  pilot: 25,
  paid: 100,
};

export function effectiveUploadLimit(plan: string | null | undefined, configuredLimit: number | null | undefined): number {
  const planLimit = PLAN_UPLOAD_LIMITS[plan ?? "free"] ?? PLAN_UPLOAD_LIMITS.free;
  const configured = Number.isFinite(configuredLimit) ? Math.max(1, Number(configuredLimit)) : planLimit;
  return Math.min(planLimit, configured);
}
