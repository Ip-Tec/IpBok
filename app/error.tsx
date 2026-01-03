"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import Logo from "@/components/Logo";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="text-center animate-fade-up">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
        </div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Something went <span className="text-destructive">wrong!</span>
        </h1>
        <p className="mb-8 text-lg text-muted-foreground max-w-md mx-auto">
          We apologize for the inconvenience. An unexpected error occurred. 
          Our team has been notified and we're working on it.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button 
            onClick={() => reset()}
            size="lg" 
            className="rounded-full px-8 bg-gradient-primary shadow-soft hover:shadow-hover transition-all"
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Try again
          </Button>
          <Link href="/">
            <Button variant="ghost" size="lg" className="rounded-full px-8">
              Go back home
            </Button>
          </Link>
        </div>
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-muted rounded-lg text-left overflow-auto max-w-2xl mx-auto">
            <p className="text-sm font-mono text-destructive">
              {error.message}
            </p>
            {error.stack && (
              <pre className="mt-2 text-xs font-mono text-muted-foreground">
                {error.stack}
              </pre>
            )}
          </div>
        )}
      </div>
      <div className="mt-12 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Ipbok. All rights reserved.
      </div>
    </div>
  );
}
