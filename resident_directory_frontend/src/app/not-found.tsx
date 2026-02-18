import Link from "next/link";
import AppShell from "@/components/AppShell";

export default function NotFound() {
  return (
    <AppShell title="Resident Directory" subtitle="404">
      <section className="card" role="alert" aria-live="assertive">
        <div className="cardHeader">
          <div className="cardTitle">404 – Page Not Found</div>
        </div>
        <div className="cardBody">
          <div className="notice">
            The page you’re looking for doesn’t exist.{" "}
            <Link href="/">Return to directory</Link>.
          </div>
        </div>
      </section>
    </AppShell>
  );
}
