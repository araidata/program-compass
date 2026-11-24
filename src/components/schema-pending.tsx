/** Shown when the database is older than the deployed application. */
export function SchemaPending() {
  return (
    <section className="rounded-md border bg-card px-4 py-6">
      <h2>Database update pending</h2>
      <p className="mt-1 max-w-2xl text-muted-foreground">
        This version of Program Compass needs the capability assessment tables,
        which have not been added to this environment&apos;s database yet. An
        operator runs the database migration and seed commands; no data is lost
        and the rest of the application keeps working.
      </p>
    </section>
  );
}
