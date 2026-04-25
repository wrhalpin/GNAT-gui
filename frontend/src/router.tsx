import { createRouter, createRootRoute, createRoute, redirect } from "@tanstack/react-router";
import { Shell } from "@/components/layout/Shell";
import { LoginPage } from "@/pages/login";

const rootRoute = createRootRoute();

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => import("@/pages/login").then((m) => m.Route.component!()),
});

const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: Shell,
  beforeLoad: async ({ context }: { context: { isAuthenticated: boolean } }) => {
    if (!context.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/",
  component: () => import("@/pages/dashboard").then((m) => m.Route.component!()),
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedRoute.addChildren([dashboardRoute]),
]);

export const router = createRouter({ routeTree });
