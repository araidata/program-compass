import { navigationGroups, settingsItem, type NavItem } from "@/lib/navigation";
import { pillars } from "@/lib/pillars";
import { PageHeader } from "@/components/page-header";
import { PillarTag } from "@/components/pillar-tag";
import { ScopedLink } from "@/components/scoped-link";
import { requirePage } from "@/lib/server/access";

const groups = [
  ...navigationGroups
    .filter((group) => group.label)
    .map((group) => ({ label: group.label as string, items: group.items })),
  {
    label: "Other",
    items: [
      ...navigationGroups
        .filter((group) => !group.label)
        .flatMap((group) => group.items)
        .filter((item) => item.href !== "/"),
      settingsItem,
    ] as NavItem[],
  },
];

export default async function Overview() {
  await requirePage();
  return (
    <div className="space-y-5">
      <PageHeader
        title="Overview"
        description="Program position for the selected scope. Figures appear here once assessment, planning, and workforce data exist."
      />

      <p className="rounded-md border bg-card px-3 py-2 text-muted-foreground">
        No organizational data is connected. Each module becomes available in
        the phase shown below.
      </p>

      <section aria-labelledby="modules-title" className="space-y-2">
        <h2 id="modules-title">Modules</h2>
        <div className="overflow-x-auto rounded-md border bg-card">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="border-b bg-muted/60 text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="h-8 px-3 font-medium">
                  Module
                </th>
                <th scope="col" className="h-8 px-3 font-medium">
                  Purpose
                </th>
                <th scope="col" className="h-8 px-3 font-medium">
                  Planned views
                </th>
                <th scope="col" className="h-8 px-3 text-right font-medium">
                  Phase
                </th>
              </tr>
            </thead>
            {groups.map((group) => (
              <tbody
                key={group.label}
                className="divide-y border-b last:border-b-0"
              >
                <tr className="bg-muted/30">
                  <th
                    scope="rowgroup"
                    colSpan={4}
                    className="h-7 px-3 text-xs font-medium text-muted-foreground"
                  >
                    {group.label}
                  </th>
                </tr>
                {group.items.map((item) => (
                  <tr key={item.href} className="hover:bg-muted/40">
                    <td className="h-9 whitespace-nowrap px-3 font-medium">
                      <ScopedLink
                        href={item.href}
                        className="text-link hover:underline"
                      >
                        {item.title}
                      </ScopedLink>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {item.description}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {item.views.join(" · ")}
                    </td>
                    <td className="tabular px-3 text-right">{item.phase}</td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </section>

      <section aria-labelledby="pillars-title" className="space-y-2">
        <h2 id="pillars-title">Pillars</h2>
        <ul className="grid gap-2 md:grid-cols-3">
          {pillars.map((pillar) => (
            <li
              key={pillar.id}
              className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2"
            >
              <PillarTag pillar={pillar} label="name" />
              <span className="text-xs text-muted-foreground">
                {pillar.short}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Use the scope control in the header to view every module for one
          pillar or for the enterprise.
        </p>
      </section>
    </div>
  );
}
