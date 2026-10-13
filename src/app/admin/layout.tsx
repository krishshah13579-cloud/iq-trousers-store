import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions, isAdminRole } from "@/lib/auth";
import AdminClientLayout from "./AdminClientLayout";
import AdminLoginForm from "./AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error("Failed to get session in AdminLayout:", error);
    session = null;
  }

  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return <AdminLoginForm />;
  }

  return <AdminClientLayout>{children}</AdminClientLayout>;
}
