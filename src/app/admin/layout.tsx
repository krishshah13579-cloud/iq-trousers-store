import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions, isAdminRole } from "@/lib/auth";
import AdminClientLayout from "./AdminClientLayout";
import AdminLoginForm from "./AdminLoginForm";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return <AdminLoginForm />;
  }

  return <AdminClientLayout>{children}</AdminClientLayout>;
}
