import { AppShell } from "@/components/app-shell";
import { requirePage } from "@/lib/server/access";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePage();
  return <AppShell>{children}</AppShell>;
}
