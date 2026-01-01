
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
          setMessage("Email verified successfully! You can now log in.");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred. Please try again.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="mb-8">
            <Logo />
        </div>
      <div className="max-w-md w-full bg-card border rounded-lg p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
        <p className={`mb-6 ${status === "error" ? "text-red-500" : "text-muted-foreground"}`}>
          {message}
        </p>

        {status === "success" && (
          <Button onClick={() => router.push("/login")} className="w-full">
            Go to Login
          </Button>
        )}

        {status === "error" && (
          <Button onClick={() => router.push("/login")} variant="outline" className="w-full">
            Back to Login
          </Button>
        )}
        
        {status === "loading" && (
             <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
             </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailContent />
        </Suspense>
    )
}
