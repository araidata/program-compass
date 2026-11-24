"use client";

import { Suspense } from "react";
import { PillarTag } from "@/components/pillar-tag";
import { useScope } from "@/components/use-scope";

function ScopedTag() {
  return <PillarTag pillar={useScope()} label="name" />;
}

/** Standard one-line module header: title, scope, description, actions. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1>{title}</h1>
          <Suspense fallback={<PillarTag pillar={null} label="name" />}>
            <ScopedTag />
          </Suspense>
        </div>
        {description ? (
          <p className="mt-1 max-w-3xl text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
