import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { getAdminBadgeCounts } from "@/actions/admin-order.action";
import AdminShell from "@/components/admin/admin-shell";
import { WEBSITE_NAME } from "@/constants";
import { requireAdmin } from "@/lib/auth-guard";

export async function generateMetadata() {
  const t = await getTranslations("Admin");
  return { title: { template: `%s · ${t("Admin")} · ${WEBSITE_NAME}`, default: `${t("Admin")} · ${WEBSITE_NAME}` }, robots: { index: false } };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const counts = await getAdminBadgeCounts();
  return (
    <Suspense>
      <AdminShell counts={counts} user={{ name: session.user.name ?? "", role: session.user.role }}>
        {children}
      </AdminShell>
    </Suspense>
  );
}
