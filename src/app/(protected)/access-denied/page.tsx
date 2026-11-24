import Link from "next/link";

export const metadata = { title: "Access denied" };
export default function AccessDenied() {
  return (
    <section className="space-y-3">
      <h1>Access denied</h1>
      <p>
        Your role cannot access this page. Contact an administrator if you need
        access.
      </p>
      <Link className="text-link underline" href="/">
        Back to Overview
      </Link>
    </section>
  );
}
