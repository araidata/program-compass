import { MethodProvider } from "@/components/planning/method-provider";
import { loadMethods } from "@/lib/server/methods";
import { AppShell } from "@/components/app-shell";
import { requirePage } from "@/lib/server/access";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePage();
  return (
    <MethodProvider methods={await loadMethods()}>
      <AppShell>{children}</AppShell>
    </MethodProvider>
  );
}
