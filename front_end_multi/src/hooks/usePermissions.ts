import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";

export function usePermissions() {
  const { user } = useAuth();

  const { data: permissions = {} } = useQuery({
    queryKey: ["role-permissions", user?.role],
    queryFn: () => (user?.role ? api.getRolePermissions(user.role) : Promise.resolve({})),
    enabled: !!user?.role && user.role !== "admin",
    staleTime: 5 * 60 * 1000,
  });

  const hasPermission = (key: string): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return permissions[key] === true;
  };

  return { hasPermission, permissions };
}
