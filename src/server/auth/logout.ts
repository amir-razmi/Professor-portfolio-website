export type AuthSignOut = (options: { redirectTo: string }) => Promise<unknown>;

export async function performLogout(signOutImplementation: AuthSignOut): Promise<void> {
  await signOutImplementation({ redirectTo: "/login" });
}
