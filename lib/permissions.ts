import { Role } from "@/src/generated/enums";
import { User } from "@/lib/types";

export enum Permission {
  MANAGE_AGENTS = "MANAGE_AGENTS",
  VIEW_DASHBOARD = "VIEW_DASHBOARD",
  APPROVE_REQUESTS_SMALL = "APPROVE_REQUESTS_SMALL", // < 50k
  APPROVE_REQUESTS_LARGE = "APPROVE_REQUESTS_LARGE", // > 50k
  RECORD_TRANSACTION = "RECORD_TRANSACTION",
  VIEW_FINANCIALS = "VIEW_FINANCIALS",
  RECONCILE = "RECONCILE",
  AUDIT_READ = "AUDIT_READ",
  GIVE_CASH = "GIVE_CASH",
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: Object.values(Permission), // Full access
  [Role.MANAGER]: [
    Permission.MANAGE_AGENTS,
    Permission.VIEW_DASHBOARD,
    Permission.APPROVE_REQUESTS_SMALL,
    Permission.RECORD_TRANSACTION,
    Permission.VIEW_FINANCIALS,
  ],
  [Role.ACCOUNTANT]: [
    Permission.RECORD_TRANSACTION,
    Permission.VIEW_FINANCIALS,
    Permission.RECONCILE,
  ],
  [Role.AUDITOR]: [
    Permission.AUDIT_READ,
    Permission.VIEW_FINANCIALS,
  ],
  [Role.FINANCE_OFFICER]: [
    Permission.APPROVE_REQUESTS_LARGE,
    Permission.GIVE_CASH,
    Permission.VIEW_FINANCIALS,
  ],
  [Role.AGENT]: [], // Agents have basic access handled by UI context
  [Role.SUPERADMIN]: Object.values(Permission),
  [Role.SUPPORT]: [Permission.VIEW_DASHBOARD, Permission.AUDIT_READ],
};

export function hasPermission(user: User, permission: Permission): boolean {
  // Owner always has permission
  if (user.role === Role.OWNER) return true;

  const userPermissions = ROLE_PERMISSIONS[user.role as Role] || [];
  return userPermissions.includes(permission);
}
