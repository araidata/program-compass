export const roles = ["admin", "editor", "viewer"] as const;
export type Role = (typeof roles)[number];
export type Permission = "read" | "write" | "administer";

export function permits(role: string, permission: Permission): boolean {
  if (role === "admin") return true;
  if (role === "editor") return permission === "read" || permission === "write";
  return role === "viewer" && permission === "read";
}
