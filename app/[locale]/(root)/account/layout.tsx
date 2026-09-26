import { requireUser } from "@/lib/auth-guard";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/account");
  return <>{children}</>;
}
