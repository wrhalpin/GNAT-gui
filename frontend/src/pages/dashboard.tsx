import { useMe } from "@/lib/auth";

export function Dashboard() {
  const { data: me } = useMe();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome back, {me?.username}. Select a module from the sidebar to get started.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {["Analysis", "Rules", "Investigations"].map((m) => (
          <div key={m} className="rounded-lg border p-4 shadow-sm">
            <h2 className="font-medium">{m}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {m === "Analysis" && "Manage investigations and hypotheses"}
              {m === "Rules" && "Author and test detection rules"}
              {m === "Investigations" && "Build and explore evidence graphs"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
