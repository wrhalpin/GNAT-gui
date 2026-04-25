import { useMe } from "@/lib/auth";

export function usePermission(permission: string): boolean {
  const { data } = useMe();
  return data?.permissions.includes(permission) ?? false;
}

export function useHasAnyPermission(permissions: string[]): boolean {
  const { data } = useMe();
  if (!data) return false;
  return permissions.some((p) => data.permissions.includes(p));
}
