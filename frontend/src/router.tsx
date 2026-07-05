import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
} from "@tanstack/react-router";
import { Shell } from "@/components/layout/Shell";
import { LoginPage } from "@/pages/login";
import { Dashboard } from "@/pages/dashboard";
import { AnalysisIndex } from "@/pages/analysis/index";
import { InvestigationDetailPage } from "@/pages/analysis/[id]";
import { RulesIndex } from "@/pages/rules/index";
import { RuleDetailPage } from "@/pages/rules/[id]";
import { InvestigationsIndex } from "@/pages/investigations/index";
import { NewInvestigationPage } from "@/pages/investigations/new";
import { InvestigationGraphPage } from "@/pages/investigations/[id]";
import { AdminIndex } from "@/pages/admin/index";
import { UsersPage } from "@/pages/admin/users";
import { AuditPage } from "@/pages/admin/audit";

const rootRoute = createRootRoute();

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

/**
 * Pathless layout route that gates everything behind authentication. `beforeLoad`
 * checks the session with a plain fetch to /api/auth/me (bypassing the client.ts 401
 * interceptor so we get a clean router redirect instead of a hard reload). All app
 * pages are children of this route and render inside Shell's <Outlet />.
 *
 * Each child route is declared inline (not via a helper) so TanStack Router can infer
 * literal path types — that inference is what makes <Link>/useParams/useNavigate
 * type-safe across the app.
 */
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: Shell,
  beforeLoad: async ({ location }) => {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/",
  component: Dashboard,
});

const analysisIndexRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/analysis",
  component: AnalysisIndex,
});

const analysisDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/analysis/$id",
  component: InvestigationDetailPage,
});

const rulesIndexRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/rules",
  component: RulesIndex,
});

const ruleDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/rules/$id",
  component: RuleDetailPage,
});

const investigationsIndexRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/investigations",
  component: InvestigationsIndex,
});

const investigationsNewRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/investigations/new",
  component: NewInvestigationPage,
});

const investigationDetailRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/investigations/$id",
  component: InvestigationGraphPage,
});

const adminIndexRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/admin",
  component: AdminIndex,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/admin/users",
  component: UsersPage,
});

const adminAuditRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: "/admin/audit",
  component: AuditPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  protectedRoute.addChildren([
    dashboardRoute,
    analysisIndexRoute,
    analysisDetailRoute,
    rulesIndexRoute,
    ruleDetailRoute,
    investigationsIndexRoute,
    investigationsNewRoute,
    investigationDetailRoute,
    adminIndexRoute,
    adminUsersRoute,
    adminAuditRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
