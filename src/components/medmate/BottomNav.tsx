import { NavLink } from "react-router-dom";
import { Bell, Heart, Home, Pill, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/integrations/supabase/types";

const patientLinks = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/medications", label: "Meds", icon: Pill },
  { to: "/reminders", label: "Reminders", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const familyLinks = [
  { to: "/dashboard/family", label: "Home", icon: Home },
  { to: "/dashboard/family", label: "Family", icon: Heart },
  { to: "/profile", label: "Profile", icon: User },
] as const;

type BottomNavProps = {
  role: UserRole;
};

export function BottomNav({ role }: BottomNavProps) {
  const links = role === "family" ? familyLinks : patientLinks;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-[72px] max-w-lg items-stretch justify-around px-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={`${to}-${label}`}
            to={to}
            end={to === "/dashboard" || to === "/dashboard/family"}
            className={({ isActive }) =>
              cn(
                "flex min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-1 rounded-xl text-sm font-semibold transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <Icon className="h-7 w-7" aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
