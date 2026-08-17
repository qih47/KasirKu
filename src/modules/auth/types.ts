export type UserRole = "OWNER" | "ADMIN_CABANG" | "KASIR" | "SUPER_ADMIN";

export interface SessionUser {
  id: string;
  tenantId: string;
  outletId: string | null;
  role: UserRole;
  name: string;
  email: string;
}
