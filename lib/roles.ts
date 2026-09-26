// Roles stored on the User model (see models/user.model.ts).
export const ROLES = { ADMIN: "admin", USER: "user" } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const isAdmin = (role?: string | null) =>
  role?.toLowerCase() === ROLES.ADMIN;
