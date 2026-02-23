"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Eye, EyeOff, UserPlus } from "lucide-react";

const Signup = () => {
  const searchParams = useSearchParams();
  const businessId = searchParams.get("businessId");
  const invitedRole = searchParams.get("role");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [regError, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [invitationLoading, setInvitationLoading] = useState(!!searchParams.get("token"));
  const [tokenError, setTokenError] = useState("");
  const router = useRouter();

  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (token: string) => {
    try {
      const res = await fetch(`/api/auth/verify-token?token=${token}`);
      if (!res.ok) {
        setTokenError("Invalid or expired invitation link");
        return;
      }
      const data = await res.json();
      if (data.type === "INVITE") {
        setEmail(data.email);
        // We can't easily lock the form without more state, but let's at least pre-fill.
      }
    } catch (err) {
      setTokenError("Failed to verify invitation");
    } finally {
      setInvitationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");

    try {
      // Call backend API for registration
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          password,
          token: token || undefined,
          ...(token ? {} : {
            email,
            role: invitedRole || "OWNER",
            businessId: businessId || undefined,
          }),
        }),
      });

      if (res.ok) {
        setLoading(false);
        // Show success message and redirect to login
        setError(""); // Clear any errors
        // You might want to use a toast or a dedicated success page
        if (token) {
          router.push("/login?message=registered");
        } else {
          router.push("/login?message=check-email");
        }
      } else {
        const data = await res.json();
        setError(data.error || data.message || "Registration failed");
        setLoading(false);
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-xl space-y-8 p-8 bg-card rounded-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold">
            {token ? `Accept Invitation` : businessId ? `Join as an Agent` : `Create your IpBok account`}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {token 
              ? `Complete your profile to join the business team`
              : businessId
              ? `You've been invited to join a business on IpBok`
              : `Sign up to start managing your finances`}
          </p>
          {tokenError && (
             <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
               {tokenError}
             </div>
          )}
          {(businessId || token) && !tokenError && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center gap-2 text-blue-700 text-sm">
              <UserPlus className="w-4 h-4" />
              <span>Registering for an existing business</span>
            </div>
          )}
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="md:flex justify-between">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Peter Innocent"
                className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {!token && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium">
                  Email address
                </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="peterinnocent@mail.etc"
                    className="mt-1 block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-muted"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
              </div>
            )}
            </div>
            <div className="md:flex justify-between">
              <div>
                <label htmlFor="password" title={tokenError} className="block text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={!!tokenError}
                    placeholder="********"
                    className="mt-1 block w-full px-3 py-2 pr-10 border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:opacity-50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                <button
                  type="button"
                  className="absolute cursor-pointer inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="********"
                  className="mt-1 block w-full px-3 py-2 pr-10 border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute cursor-pointer inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
          {regError && <div className="text-red-500 text-sm">{regError}</div>}
          <div>
            <Button
              type="submit"
              className="w-full cursor-pointer"
              disabled={loading || !!tokenError || invitationLoading}
            >
              {invitationLoading ? "Verifying Invitation..." : loading ? "Signing Up..." : token ? "Accept Invitation" : "Sign Up"}
            </Button>
          </div>
        </form>
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div className="mt-6">
            <Button
              onClick={() =>
                signIn("google", {
                  callbackUrl: businessId
                    ? `/dashboard?inviteBusinessId=${businessId}`
                    : "/dashboard",
                })
              }
              variant="outline"
              className="w-full cursor-pointer hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </Button>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

import { Suspense } from "react";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <Signup />
    </Suspense>
  );
}
