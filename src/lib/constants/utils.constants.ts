export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const SOCKET_EVENTS = {
  INVENTORY_UPDATE: "inventory_update",
  RESERVATION_UPDATE: "reservation_update",
  PURCHASE_UPDATE: "purchase_update",
  NEW_DROP: "new_drop",
} as const;
