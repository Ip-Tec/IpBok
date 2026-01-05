import React from "react";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last Updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <article className="prose prose-gray max-w-none dark:prose-invert">
          <p>
            Welcome to IpBok. These terms and conditions outline the rules and
            regulations for the use of IpBok&apos;s Website and Services.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing this website we assume you accept these terms and
            conditions. Do not continue to use IpBok if you do not agree to take
            all of the terms and conditions stated on this page.
          </p>

          <h2>2. License</h2>
          <p>
            Unless otherwise stated, IpBok and/or its licensors own the
            intellectual property rights for all material on IpBok. All
            intellectual property rights are reserved. You may access this from
            IpBok for your own personal use subjected to restrictions set in
            these terms and conditions.
          </p>

          <h2>3. User Responsibilities</h2>
          <p>You must not:</p>
          <ul>
            <li>Republish material from IpBok</li>
            <li>Sell, rent or sub-license material from IpBok</li>
            <li>Reproduce, duplicate or copy material from IpBok</li>
            <li>Redistribute content from IpBok</li>
          </ul>

          <h2>4. Account Security</h2>
          <p>
            You are responsible for safeguarding the password that you use to
            access the Service and for any activities or actions under your
            password, whether your password is with our Service or a third-party
            service.
          </p>

          <h2>5. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior
            notice or liability, for any reason whatsoever, including without
            limitation if you breach the Terms.
          </p>

          <h2>6. Limitation of Liability</h2>
          <p>
            In no event shall IpBok, nor its directors, employees, partners,
            agents, suppliers, or affiliates, be liable for any indirect,
            incidental, special, consequential or punitive damages, including
            without limitation, loss of profits, data, use, goodwill, or other
            intangible losses, resulting from your access to or use of or
            inability to access or use the Service.
          </p>

          <h2>7. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at{" "}
            <a href="mailto:iptecdev@gmail.com">iptecdev@gmail.com</a>.
          </p>
        </article>
      </div>
    </div>
  );
}
