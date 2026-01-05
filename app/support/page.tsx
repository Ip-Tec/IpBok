import React from "react";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupportPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Support Center
          </h1>
          <p className="text-lg text-muted-foreground">
            Need help? We represent a dedicated support team ready to assist
            you.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Email Support
              </CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Email Us</div>
              <p className="text-xs text-muted-foreground mt-2">
                For general inquiries and technical assistance.
              </p>
              <a
                href="mailto:iptecdev@gmail.com"
                className="mt-4 inline-block text-sm text-primary hover:underline"
              >
                iptecdev@gmail.com
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Phone Support
              </CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Call Us</div>
              <p className="text-xs text-muted-foreground mt-2">
                Available Mon-Fri from 9am to 5pm.
              </p>
              <a
                href="tel:+2349033798890"
                className="mt-4 inline-block text-sm text-primary hover:underline"
              >
                +234 (0) 903-379-8890
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Chat</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Chat With Us</div>
              <p className="text-xs text-muted-foreground mt-2">
                Connect with our support team instantly.
              </p>
              <span className="mt-4 inline-block text-sm text-muted-foreground">
                Currently Offline
              </span>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg border bg-card p-8 text-card-foreground shadow-sm">
          <h2 className="text-2xl font-semibold">Frequently Asked Questions</h2>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium">
                How do I reset my password?
              </h3>
              <p className="mt-2 text-muted-foreground">
                You can reset your password by clicking on the &quot;Forgot
                Password?&quot; link on the login page. Follow the instructions
                sent to your email.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium">
                Can I change my subscription plan?
              </h3>
              <p className="mt-2 text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time from
                your account settings under the &quot;Billing&quot; section.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
