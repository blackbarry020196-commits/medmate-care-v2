import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/medmate/AppLayout";
import { GuestRoute } from "@/components/medmate/GuestRoute";
import { AuthProvider } from "@/lib/auth";
import DashboardPage from "@/pages/Dashboard";
import LoginPage from "@/pages/Login";
import MedicationsPage from "@/pages/Medications";
import ProfilePage from "@/pages/Profile";
import RemindersPage from "@/pages/Reminders";
import FamilyDashboardPage from "@/pages/FamilyDashboard";
import InvitePage from "@/pages/Invite";
import ScanPrescriptionPage from "@/pages/ScanPrescription";
import SignupPage from "@/pages/Signup";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <GuestRoute>
                  <SignupPage />
                </GuestRoute>
              }
            />
            <Route path="/invite" element={<InvitePage />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/family" element={<FamilyDashboardPage />} />
              <Route path="/medications" element={<MedicationsPage />} />
              <Route path="/dashboard/scan" element={<ScanPrescriptionPage />} />
              <Route path="/reminders" element={<RemindersPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
