import { notFound } from "next/navigation";
import { navigation } from "@/lib/navigation";
import { PageHeader } from "@/components/page-header";
import { ScopedLink } from "@/components/scoped-link";
import { requirePage } from "@/lib/server/access";

export const dynamicParams = false;

/** Modules with their own route; everything else renders a placeholder. */
const implemented = new Set([
  "/",
  "/capabilities",
  "/settings",
  "/workforce",
  "/context",
]);

export function generateStaticParams() {
  return navigation
    .filter((item) => !implemented.has(item.href))
    .map((item) => ({ module: item.href.slice(1) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  return {
    title:
      navigation.find((item) => item.href === `/${module}`)?.title ??
      "Not found",
  };
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  await requirePage();
  const { module } = await params;
  const item = navigation.find((entry) => entry.href === `/${module}`);
  if (!item) notFound();
  return (
    <div className="space-y-5">
      <PageHeader title={item.title} description={item.description} />
      <ul
        aria-label="Planned views"
        className="flex gap-4 overflow-x-auto border-b text-[13px]"
      >
        {item.views.map((view, index) => (
          <li
            key={view}
            className={
              index === 0
                ? "-mb-px whitespace-nowrap border-b-2 border-foreground pb-2 font-medium"
                : "whitespace-nowrap pb-2 text-muted-foreground"
            }
          >
            {view}
          </li>
        ))}
      </ul>
      <section
        aria-labelledby="unavailable-title"
        className="rounded-md border bg-card px-4 py-6"
      >
        <h2 id="unavailable-title">Not available yet</h2>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          {item.title} arrives in phase {item.phase} of the implementation plan.
          No organizational data is collected on this page.
        </p>
        <ScopedLink
          href="/"
          className="mt-3 inline-block text-[13px] font-medium text-link hover:underline"
        >
          Back to Overview
        </ScopedLink>
      </section>
    </div>
  );
}
