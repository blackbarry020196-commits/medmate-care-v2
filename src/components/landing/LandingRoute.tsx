import { Navigate } from "react-router-dom";
import { LoadingCard } from "@/components/medmate/LoadingCard";
import { useAuth } from "@/lib/auth";
import LandingPage from "@/pages/Landing";

export function LandingRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <LoadingCard />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}
