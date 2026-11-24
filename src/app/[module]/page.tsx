import { notFound } from "next/navigation";
import Link from "next/link";
import { navigation } from "@/lib/navigation";
import { Card, CardContent } from "@/components/ui/card";

export const dynamicParams = false;
export function generateStaticParams() {
  return navigation
    .filter((item) => item.href !== "/")
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
  const { module } = await params;
  const item = navigation.find((entry) => entry.href === `/${module}`);
  if (!item) notFound();
  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Program workspace</p>
        <h1>{item.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {item.description}
        </p>
      </div>
      <Card>
        <CardContent className="px-4 py-4">
          <p className="eyebrow">Planned module</p>
          <h2 className="mt-2 text-base font-semibold">Not implemented</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            {item.title} functionality will be introduced in a future phase. No
            organizational data is collected on this page.
          </p>
          <Link
            href="/"
            className="mt-6 text-sm font-medium text-teal-800 hover:underline"
          >
            Return to Dashboard →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
