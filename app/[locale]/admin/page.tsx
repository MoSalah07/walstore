import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/routing";

export default async function AdminIndex() {
  redirect({ href: "/admin/overview", locale: await getLocale() });
}
