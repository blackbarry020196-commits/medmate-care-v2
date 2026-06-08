import { Navigate, Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "@/components/medmate/BottomNav";
import { LoadingCard } from "@/components/medmate/LoadingCard";
import { useAuth } from "@/lib/auth";
import { useProfile } from "@/hooks/use-profile";

const familyHome = "/dashboard/family";

function isPatientRoute(pathname: string) {
  if (pathname === familyHome) return false;
  if (pathname.startsWith("/dashboard/scan")) return true;
  if (pathname === "/dashboard") return true;
  return pathname.startsWith("/medications") || pathname.startsWith("/reminders");
}

export function AppLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const profileQ = useProfile();

  if (loading || profileQ.isLoading) {
    return (
      <div className="mx-auto min-h-screen max-w-lg px-4 py-8">
        <LoadingCard label="Loading your account…" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const role = profileQ.data?.role ?? "patient";

  if (role === "family" && isPatientRoute(location.pathname)) {
    return <Navigate to={familyHome} replace />;
  }

  if (role === "patient" && location.pathname.startsWith("/dashboard/family")) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 pb-28 pt-6">
      <Outlet />
      <BottomNav role={role} />
    </div>
  );
}
