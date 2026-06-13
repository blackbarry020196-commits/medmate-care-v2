import { Pill } from "lucide-react";
import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2.5 font-bold text-primary">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Pill className="h-4 w-4" />
              </div>
              <span className="text-xl">MedMate</span>
            </Link>
            <p className="max-w-xs text-base text-muted-foreground">
              Built for families across the UK.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 text-base">
            <a href="#" className="text-muted-foreground hover:text-primary">
              Privacy Policy
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary">
              Terms of Service
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary">
              Contact
            </a>
          </div>
        </div>

        <div className="mt-10 space-y-2 border-t pt-8 text-sm text-muted-foreground">
          <p>© 2024 MedMate. Built for families across the UK.</p>
          <p>
            MedMate is not a medical device and does not replace professional medical advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
