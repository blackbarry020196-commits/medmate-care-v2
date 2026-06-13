import {
  Bell,
  Camera,
  Heart,
  LayoutDashboard,
  LineChart,
  ScanLine,
  Shield,
  Smartphone,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_hsl(221_83%_53%_/_0.08),_transparent_50%)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div className="space-y-8">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
            Never Miss a Medication Again
          </h1>
          <p className="max-w-xl text-xl leading-relaxed text-muted-foreground">
            MedMate helps elderly people manage their medications — and keeps their family
            informed automatically.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link to="/signup">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <a href="#features">See How It Works</a>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#60A5FA] p-1 shadow-soft">
            <div className="flex h-full flex-col rounded-[calc(1rem-4px)] bg-white/95 p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="space-y-3">
                <div className="rounded-xl bg-primary/10 p-4">
                  <p className="text-sm font-semibold text-primary">Today&apos;s Medications</p>
                  <p className="mt-1 text-2xl font-bold">3 of 4 taken</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Next dose</p>
                    <p className="font-semibold">2:00 PM</p>
                  </div>
                  <div className="rounded-xl bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Adherence</p>
                    <p className="font-semibold text-green-600">94%</p>
                  </div>
                </div>
                <div className="rounded-xl border border-primary/20 bg-accent/50 p-3">
                  <p className="text-sm font-medium">Family dashboard connected</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProofBar() {
  const stats = [
    "AI Prescription Scanner",
    "Family Monitoring Dashboard",
    "Missed Medication Alerts",
  ];

  return (
    <section className="border-y bg-secondary/50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="mb-6 text-center text-lg font-medium text-muted-foreground">
          Trusted by families across the UK
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat}
              className="rounded-xl border bg-white px-4 py-5 text-center text-base font-semibold shadow-sm sm:text-lg"
            >
              {stat}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      icon: Camera,
      title: "Scan Your Prescription",
      text: "Take a photo of any NHS prescription and MedMate automatically adds all your medications in seconds.",
    },
    {
      icon: Bell,
      title: "Get Smart Reminders",
      text: "Never forget a dose. MedMate reminds you at the right time, every time.",
    },
    {
      icon: Heart,
      title: "Family Stays Informed",
      text: "Invite a family member to monitor your adherence remotely. They get alerted if you miss a dose.",
    },
  ];

  return (
    <section id="how-it-works" className="scroll-mt-20 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">Simple for the whole family</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="relative text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <step.icon className="h-8 w-8" />
              </div>
              <p className="mt-2 text-sm font-bold text-primary">Step {i + 1}</p>
              <h3 className="mt-2 text-xl font-bold">{step.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: ScanLine,
      title: "AI Prescription Scanner",
      text: "Photograph any prescription and we'll add your meds automatically",
    },
    {
      icon: Bell,
      title: "Smart Reminders",
      text: "Personalised alerts at the right time",
    },
    {
      icon: LayoutDashboard,
      title: "Family Dashboard",
      text: "Your loved ones can monitor remotely",
    },
    {
      icon: Zap,
      title: "Missed Dose Alerts",
      text: "Family gets notified automatically",
    },
    {
      icon: LineChart,
      title: "Weekly Reports",
      text: "Track adherence over time",
    },
    {
      icon: Smartphone,
      title: "Simple Design",
      text: "Built specifically for elderly users",
    },
  ];

  return (
    <section id="features" className="scroll-mt-20 bg-secondary/30 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">
          Everything you need, nothing you don&apos;t
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-soft">
              <CardHeader className="pb-2">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed text-muted-foreground">{feature.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "MedMate has given me peace of mind knowing my mum is taking her medications. I can check from anywhere.",
      author: "Sarah T.",
      role: "daughter of MedMate user",
    },
    {
      quote:
        "Setting it up was so easy. My dad scanned his prescription and it was all done in minutes.",
      author: "James K.",
      role: "son of MedMate user",
    },
    {
      quote:
        "The reminder system is brilliant. Dad hasn't missed a single dose since we started using it.",
      author: "Priya M.",
      role: "daughter of MedMate user",
    },
  ];

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">What families are saying</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.author} className="border shadow-sm">
              <CardContent className="space-y-4 p-6">
                <p className="text-base leading-relaxed text-foreground">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold">— {t.author}</p>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = [
    {
      name: "Free",
      price: "£0",
      period: "/month",
      popular: false,
      features: [
        "Up to 5 medications",
        "Daily reminders",
        "Prescription scanner",
        "1 family member",
      ],
      cta: "Get Started Free",
    },
    {
      name: "Family Plan",
      price: "£9.99",
      period: "/month",
      popular: true,
      features: [
        "Unlimited medications",
        "Smart reminders",
        "Prescription scanner",
        "Up to 5 family members",
        "Missed dose alerts",
        "Weekly adherence reports",
      ],
      cta: "Start Free Trial",
    },
  ];

  return (
    <section id="pricing" className="scroll-mt-20 bg-secondary/30 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">Simple, honest pricing</h2>
        <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "relative overflow-hidden",
                plan.popular && "border-2 border-primary shadow-soft",
              )}
            >
              {plan.popular && (
                <div className="absolute right-0 top-0 rounded-bl-xl bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground">
                  Most Popular
                </div>
              )}
              <CardHeader className="pb-4 pt-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-base">
                      <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full"
                  asChild
                >
                  <Link to="/signup">{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Give your family peace of mind today
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-blue-100 sm:text-xl">
          Join families across the UK who trust MedMate to keep their loved ones safe.
        </p>
        <Button
          size="lg"
          variant="secondary"
          className="mt-8 bg-white text-primary hover:bg-white/90"
          asChild
        >
          <Link to="/signup">Get Started Free</Link>
        </Button>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <main>
        <HeroSection />
        <SocialProofBar />
        <HowItWorksSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
