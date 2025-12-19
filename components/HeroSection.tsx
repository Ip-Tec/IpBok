import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowRight, Play } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-hero pt-16">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -left-20 top-1/2 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container relative mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-20 text-center md:px-6">
        {/* Badge */}
        <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-1.5">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-primary">
            New: Business Mode Now Available
          </span>
        </div>

        {/* Main heading */}
        <h1 className="animate-fade-up-delay-1 mb-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Your Simple Accounting Companion For{" "}
          <span className="text-gradient">Individuals</span> &{" "}
          <span className="text-gradient">Small Businesses</span>
        </h1>

        {/* Tagline */}
        <p className="animate-fade-up-delay-2 mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
          Track your income, expenses, loans, and reports — all in one place. No
          spreadsheets required.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-up-delay-3 flex flex-col gap-4 sm:flex-row">
          <Button variant="hero" size="xl">
            Try Demo
            <Play className="h-5 w-5" />
          </Button>

          <Link href="/signup" className="pointer cursor-pointer">
            <Button variant="heroOutline" size="xl">
              Sign Up Free
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Trust badge */}
        <p className="animate-fade-up-delay-3 mt-8 text-sm text-muted-foreground">
          Start for free — no credit card required
        </p>

        {/* Hero visual */}
        <div className="animate-fade-up-delay-3 !opacity-100 mt-12 w-full max-w-5xl animate-float">
          <div className="relative rounded-2xl border border-border/50 bg-card p-2 shadow-card">
            <div className="rounded-xl bg-gradient-to-br from-primary-light to-background p-8">
              <div className="grid grid-cols-3 gap-4">
                {/* Dashboard preview cards */}
                <div className="col-span-2 rounded-lg bg-card p-6 shadow-soft">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      Monthly Overview
                    </span>
                    <span className="text-xs text-primary">December 2025</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Income</span>
                      <span className="font-semibold text-primary">
                        $29,450
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-3/4 rounded-full bg-gradient-primary" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Expenses</span>
                      <span className="font-semibold text-muted-foreground">
                        $18,230
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-1/2 rounded-full bg-secondary-foreground/30" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg bg-card p-4 shadow-soft">
                    <span className="text-xs text-muted-foreground">
                      Profit
                    </span>
                    <p className="text-2xl font-bold text-primary">$14,220</p>
                  </div>
                  <div className="rounded-lg bg-card p-4 shadow-soft">
                    <span className="text-xs text-muted-foreground">
                      Savings Goal
                    </span>
                    <p className="text-2xl font-bold text-foreground">78%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
