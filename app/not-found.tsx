import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="text-center animate-fade-up">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-primary/10 p-4">
            <FileQuestion className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          404 - Page <span className="text-gradient">Not Found</span>
        </h1>
        <p className="mb-8 text-lg text-muted-foreground max-w-md mx-auto">
          Oops! The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/">
            <Button size="lg" className="rounded-full px-8 bg-gradient-primary shadow-soft hover:shadow-hover transition-all">
              Go back home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost" size="lg" className="rounded-full px-8">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
      <div className="mt-12 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Ipbok. All rights reserved.
      </div>
    </div>
  );
}
