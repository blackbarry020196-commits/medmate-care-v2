import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { LoadingCard } from "@/components/medmate/LoadingCard";
import { useAuth } from "@/lib/auth";

export function GuestRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <LoadingCard />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
