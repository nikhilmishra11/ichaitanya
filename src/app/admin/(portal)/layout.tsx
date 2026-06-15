import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminRouteLoader } from "@/components/admin-route-loader";
import { authOptions } from "@/lib/auth";

export default async function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  return (
    <div className="min-h-screen bg-background">
      <AdminRouteLoader />
      <AdminSidebar />
      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
