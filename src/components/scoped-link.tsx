"use client";

import Link from "next/link";
import { Suspense } from "react";
import { withScope } from "@/lib/pillars";
import { useScope } from "@/components/use-scope";

type Props = Omit<React.ComponentProps<typeof Link>, "href"> & { href: string };

function Scoped({ href, ...props }: Props) {
  return <Link href={withScope(href, useScope())} {...props} />;
}

/** Internal link that keeps the current pillar scope. */
export function ScopedLink(props: Props) {
  return (
    <Suspense fallback={<Link {...props} />}>
      <Scoped {...props} />
    </Suspense>
  );
}
