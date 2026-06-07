import { Navigate, Outlet } from "react-router-dom";
import { BottomNav } from "@/components/medmate/BottomNav";
import { LoadingCard } from "@/components/medmate/LoadingCard";
import { useAuth } from "@/lib/auth";

export function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto min-h-screen max-w-lg px-4 py-8">
        <LoadingCard label="Loading your account…" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 pb-28 pt-6">
      <Outlet />
      <BottomNav />
    </div>
  );
}
