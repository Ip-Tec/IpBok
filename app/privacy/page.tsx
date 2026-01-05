import React from "react";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Effective Date: {new Date().toLocaleDateString()}
          </p>
        </div>

        <article className="prose prose-gray max-w-none dark:prose-invert">
          <p>
            At IpBok, accessible from ipbok.com, one of our main priorities is
            the privacy of our visitors. This Privacy Policy document contains
            types of information that is collected and recorded by IpBok and how
            we use it.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            The personal information that you are asked to provide, and the
            reasons why you are asked to provide it, will be made clear to you
            at the point we ask you to provide your personal information.
          </p>
          <ul>
            <li>
              User account information (name, email address, phone number).
            </li>
            <li>
              Business information (business name, type, transaction data).
            </li>
            <li>
              Usage data (logs, device information, interactions with our
              service).
            </li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>
            We use the information we collect in various ways, including to:
          </p>
          <ul>
            <li>Provide, operate, and maintain our website.</li>
            <li>Improve, personalize, and expand our website.</li>
            <li>Understand and analyze how you use our website.</li>
            <li>
              Develop new products, services, features, and functionality.
            </li>
            <li>
              Communicate with you, either directly or through one of our
              partners, including for customer service, to provide you with
              updates and other information relating to the website, and for
              marketing and promotional purposes.
            </li>
            <li>Send you emails.</li>
            <li>Find and prevent fraud.</li>
          </ul>

          <h2>3. Data Security</h2>
          <p>
            We take reasonable measures to protect your personal information
            from unauthorized access, use, or disclosure. However, no internet
            or email transmission is ever fully secure or error-free.
          </p>

          <h2>4. Third-Party Privacy Policies</h2>
          <p>
            IpBok&apos;s Privacy Policy does not apply to other advertisers or
            websites. Thus, we are advising you to consult the respective
            Privacy Policies of these third-party ad servers for more detailed
            information.
          </p>

          <h2>5. Contact Us</h2>
          <p>
            If you have additional questions or require more information about
            our Privacy Policy, do not hesitate to contact us at{" "}
            <a href="mailto:iptecdev@gmail.com">iptecdev@gmail.com</a>.
          </p>
        </article>
      </div>
    </div>
  );
}
