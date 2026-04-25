import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminIndex,
});

function AdminIndex() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <div className="grid gap-3 md:grid-cols-2">
        <Link to="/admin/users" className="rounded-lg border p-4 hover:bg-accent">
          <h2 className="font-medium">Users</h2>
          <p className="text-sm text-muted-foreground">Manage user accounts and roles</p>
        </Link>
        <Link to="/admin/audit" className="rounded-lg border p-4 hover:bg-accent">
          <h2 className="font-medium">Audit Log</h2>
          <p className="text-sm text-muted-foreground">View all system activity</p>
        </Link>
      </div>
    </div>
  );
}
