export const ADMIN_ROLE = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
} as const;

export type AdminRoleValue = (typeof ADMIN_ROLE)[keyof typeof ADMIN_ROLE];

export const ADMIN_ROLE_LABELS: Record<AdminRoleValue, string> = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  EDITOR: "EDITOR",
};

export const ADMIN_ACCOUNT_STATUS = {
  INVITED: "INVITED",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  DISABLED: "DISABLED",
} as const;

export type AdminAccountStatusValue =
  (typeof ADMIN_ACCOUNT_STATUS)[keyof typeof ADMIN_ACCOUNT_STATUS];

export const ADMIN_ACCOUNT_STATUS_LABELS: Record<AdminAccountStatusValue, string> = {
  INVITED: "دعوت‌شده",
  ACTIVE: "فعال",
  SUSPENDED: "معلق",
  DISABLED: "غیرفعال",
};

export const ADMIN_ROLE_OPTIONS = [
  ADMIN_ROLE.SUPER_ADMIN,
  ADMIN_ROLE.ADMIN,
  ADMIN_ROLE.EDITOR,
] as const;

export const ADMIN_STATUS_OPTIONS = [
  ADMIN_ACCOUNT_STATUS.INVITED,
  ADMIN_ACCOUNT_STATUS.ACTIVE,
  ADMIN_ACCOUNT_STATUS.SUSPENDED,
  ADMIN_ACCOUNT_STATUS.DISABLED,
] as const;
