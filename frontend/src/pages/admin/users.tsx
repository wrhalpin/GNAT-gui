import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/client";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

interface UserRow {
  user_id: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

function UsersPage() {
  const { data, isLoading } = useQuery<UserRow[]>({
    queryKey: ["admin", "users"],
    queryFn: () => api.get("/api/admin/users"),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Users</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">Username</th>
            <th className="pb-2 font-medium">Role</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {(data ?? []).map((u) => (
            <tr key={u.user_id}>
              <td className="py-2">{u.username}</td>
              <td className="py-2">{u.role}</td>
              <td className="py-2">{u.is_active ? "Active" : "Inactive"}</td>
              <td className="py-2">{new Date(u.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
