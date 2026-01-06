import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { User } from "@/lib/types";
import RequestsContent from "@/components/dashboards/RequestsContent";

export default async function RequestsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user as User;

  return <RequestsContent user={user} />;
}
