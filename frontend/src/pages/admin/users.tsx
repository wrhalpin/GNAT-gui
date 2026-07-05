import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";

interface UserRow {
  user_id: string;
  username: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const ROLES = ["viewer", "analyst", "senior_analyst", "admin"];

export function UsersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<UserRow[]>({
    queryKey: ["admin", "users"],
    queryFn: () => api.get("/api/admin/users"),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const createUser = useMutation({
    mutationFn: (body: { username: string; password: string; role: string }) =>
      api.post("/api/admin/users", body),
    onSuccess: invalidate,
  });

  const updateUser = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      api.patch(`/api/admin/users/${id}`, patch),
    onSuccess: invalidate,
  });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("analyst");
  const [error, setError] = useState<string | null>(null);

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createUser.mutateAsync({ username, password, role });
      setUsername("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>

      <form onSubmit={addUser} className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
          minLength={3}
          className="rounded border px-3 py-1.5 text-sm"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 12)"
          required
          minLength={12}
          className="rounded border px-3 py-1.5 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded border px-2 py-1.5 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={createUser.isPending}
          className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
        >
          {createUser.isPending ? "Creating..." : "Create User"}
        </button>
        {error && <p className="w-full text-sm text-destructive">{error}</p>}
      </form>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-2 font-medium">Username</th>
            <th className="pb-2 font-medium">Role</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Created</th>
            <th className="pb-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {(data ?? []).map((u) => (
            <tr key={u.user_id}>
              <td className="py-2">{u.username}</td>
              <td className="py-2">
                <select
                  value={u.role}
                  onChange={(e) =>
                    updateUser.mutate({ id: u.user_id, patch: { role: e.target.value } })
                  }
                  className="rounded border px-2 py-1 text-sm"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-2">
                <span className={u.is_active ? "text-green-700" : "text-muted-foreground"}>
                  {u.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="py-2">{new Date(u.created_at).toLocaleDateString()}</td>
              <td className="py-2">
                <button
                  onClick={() =>
                    updateUser.mutate({ id: u.user_id, patch: { is_active: !u.is_active } })
                  }
                  className="rounded border px-2 py-1 text-xs hover:bg-accent"
                >
                  {u.is_active ? "Deactivate" : "Reactivate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
