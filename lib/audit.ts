import { prisma } from "./prisma";

/**
 * Log a system action for the audit trail.
 * @param action The name of the action (e.g., "USER_SIGNUP", "PRICING_UPDATE")
 * @param userId Optional ID of the user who performed the action (or subject)
 * @param details Optional JSON object with more context
 */
export async function logAction(
  action: string,
  userId?: string,
  details?: any,
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        details: details || {},
      },
    });
  } catch (error) {
    console.error(`Failed to log action ${action}:`, error);
    // We don't throw here to avoid breaking the main flow if logging fails
  }
}
