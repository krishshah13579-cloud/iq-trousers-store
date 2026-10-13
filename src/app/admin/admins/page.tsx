import { prisma } from "@/lib/prisma";
import AdminUsersManager from "./AdminUsersManager";

export const metadata = {
  title: "Admin Users Management | IQ Trousers Admin",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminAdminsPage() {
  let admins: any[] = [];
  try {
    admins = await prisma.user.findMany({
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
  } catch (error) {
    console.error("Failed to query admins in AdminAdminsPage:", error);
    admins = [];
  }

  const serialized = admins.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  return <AdminUsersManager initialAdmins={serialized} />;
}
