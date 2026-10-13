import { prisma } from "@/lib/prisma";
import AdminUsersManager from "./AdminUsersManager";

export const metadata = {
  title: "Admin Users Management | IQ Trousers Admin",
};

export const revalidate = 0;

export default async function AdminAdminsPage() {
  const admins = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "SUPER_ADMIN"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const serialized = admins.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return <AdminUsersManager initialAdmins={serialized} />;
}
