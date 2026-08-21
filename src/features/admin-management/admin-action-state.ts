export type AdminManagementFieldErrors = Record<string, string[] | undefined>;

export type AdminManagementActionState = {
  status: "idle" | "success" | "error";
  message: string | null;
  fieldErrors: AdminManagementFieldErrors;
  adminId: string | null;
};

export const initialAdminManagementActionState: AdminManagementActionState = {
  status: "idle",
  message: null,
  fieldErrors: {},
  adminId: null,
};
