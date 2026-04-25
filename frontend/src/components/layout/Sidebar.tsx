import { Link } from "@tanstack/react-router";
import { useMe, useLogout } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", to: "/" },
  { label: "Analysis", to: "/analysis" },
  { label: "Rules", to: "/rules" },
  { label: "Investigations", to: "/investigations" },
];

const ADMIN_NAV = [{ label: "Admin", to: "/admin" }];

export function Sidebar() {
  const { data: me } = useMe();
  const logout = useLogout();

  return (
    <aside className="flex w-56 flex-col border-r bg-muted/40">
      <div className="flex h-14 items-center border-b px-4 font-semibold">GNAT</div>
      <nav className="flex-1 space-y-1 p-2">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            )}
            activeProps={{ className: "bg-accent text-accent-foreground font-medium" }}
          >
            {item.label}
          </Link>
        ))}
        {me?.role === "admin" &&
          ADMIN_NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "bg-accent text-accent-foreground font-medium" }}
            >
              {item.label}
            </Link>
          ))}
      </nav>
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">{me?.username}</p>
        <p className="text-xs text-muted-foreground">{me?.role}</p>
        <button
          onClick={() => logout.mutate()}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
