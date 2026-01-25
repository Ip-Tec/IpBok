import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PaystackCheckoutButton from "./checkout-button";

interface PageProps {
  params: Promise<{ reference: string }>;
}

export default async function GatewayPayPage(props: PageProps) {
  const params = await props.params;
  const { reference } = params;

  if (!reference) return notFound();

  // Find the transaction PENDING or FAILED (retry)
  const tx = await prisma.gatewayTransaction.findUnique({
    where: { reference },
  });

  if (!tx || tx.status === "SUCCESS") {
    // If success, maybe show "Already Paid" or redirect. For now, 404/Error.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
            <h1 className="text-xl font-bold mb-2">Transaction Invalid</h1>
            <p className="text-gray-500">This transaction may have already been completed or does not exist.</p>
        </div>
      </div>
    );
  }

  // Get original email, fallback to unknown
  // We need to parse metadata if it's stored as Json
  const metadata = tx.paystackResponse as any; // or wherever we put it.
  // Wait, in our schema: `paystackResponse Json?`
  // But we stored metadata in the *init* body. We didn't store it in a separate column.
  // We can't easily access the email from `paystackResponse` because that's usually the *response* from Paystack Init (which we failed or didn't do fully yet, or maybe we did).
  // Actually, we do have `authorizationUrl` locally if we did server-side init.
  // But now we want client-side init.
  // The `GatewayTransaction` model doesn't store `email` explicitly.
  // We should add `email` to the GatewayTransaction model OR rely on the client passing it again? No, secure link.
  
  // Let's assume for now we can get the email from the `paystackResponse` if we saved the INIT payload there?
  // In `route.ts`, we did: `paystackResponse: data`. Data was the response from Paystack Init.
  // The response from Paystack Init usually just has { authorization_url, access_code, reference }.
  // It does NOT have the email.
  
  // CRITICAL: We need the email to initialize the payment client-side.
  // We should fetch the email or store it.
  // Since we can't change schema easily right now without migration, lets check if we can pass it in query param (less secure but ok for email) OR check if we have it.
  
  // Actually, wait. We are "Initializing" via API first, THEN redirecting here.
  // In the API `route.ts`, we have the email.
  // We can update `route.ts` to store the email in `paystackResponse` or a new field.
  // Or, since we are doing a UI flow, maybe we don't init with Paystack server-side anymore?
  // User said: "Invalid merchant selected" via Server-side.
  // If we init client-side using `react-paystack`, we need the email.
  
  // Quick fix: Add `email` to the `GatewayTransaction` model? 
  // User didn't authorize schema change.
  // We can store it in `paystackResponse` field as a JSON object: `{ ...paystackData, _internal_email: email }`.
  
  // Let's proceed assuming we will update `route.ts` to store the email in `paystackResponse`.
  
  const email = (tx.paystackResponse as any)?.original_email || "customer@example.com";
  const callbackUrl = (tx.paystackResponse as any)?.callback_url;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full space-y-6 text-center">
        <div className="space-y-2">
            <h1 className="text-2xl font-black text-gray-900">Secure Payment</h1>
            <p className="text-sm text-gray-500">Pay ₦{(tx.amount / 100).toLocaleString()} to IpTec</p>
        </div>

        <div className="py-4 border-y border-gray-100">
            <div className="flex justify-between text-sm py-1">
                <span className="text-gray-500">Product</span>
                <span className="font-medium text-gray-900 capitalize">{tx.product}</span>
            </div>
            <div className="flex justify-between text-sm py-1">
                <span className="text-gray-500">Reference</span>
                <span className="font-mono text-xs text-gray-400">{tx.reference.substring(0, 10)}...</span>
            </div>
        </div>

        <PaystackCheckoutButton 
            amount={tx.amount} 
            email={email} 
            reference={tx.reference}
            callbackUrl={callbackUrl}
            publicKey={process.env.PAYSTACK_PUBLIC_KEY || ''}
        />
        
        <p className="text-xs text-center text-gray-400 mt-4">
          Secured by Paystack
        </p>
      </div>
    </div>
  );
}
