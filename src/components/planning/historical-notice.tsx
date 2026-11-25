export function HistoricalUnavailable() {
  return (
    <section className="rounded-md border bg-card p-6">
      <h2>Not captured in this historical cycle</h2>
      <p className="mt-2 text-muted-foreground">
        This cycle did not capture this module. Select Current assessment to see
        the live workspace. Live data is never substituted for missing
        historical facts.
      </p>
    </section>
  );
}
