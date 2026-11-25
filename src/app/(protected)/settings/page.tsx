import { MethodSettings } from "@/components/planning/method-settings";
import { loadMethods } from "@/lib/server/methods";
import { requirePage } from "@/lib/server/access";
import { db } from "@/lib/server/db";
import { SettingsForms } from "@/components/settings-forms";
import { UserAdministration } from "@/components/user-administration";

export const metadata = { title: "Settings" };
export default async function SettingsPage() {
  await requirePage("administer");
  const organization = await db().organization.findUnique({
    where: { id: "organization" },
    include: {
      pillars: {
        orderBy: { sortOrder: "asc" },
        include: { functions: { orderBy: { name: "asc" } } },
      },
    },
  });
  const settings = await db().applicationSettings.findUnique({
    where: { id: "application" },
  });
  return (
    <div className="space-y-8">
      <h1>Settings</h1>
      <SettingsForms
        name={organization?.name ?? ""}
        dateFormat={settings?.dateFormat ?? "YYYY-MM-DD"}
        pillars={organization?.pillars ?? []}
      />
      <MethodSettings initial={await loadMethods()} />
      <UserAdministration />
    </div>
  );
}
