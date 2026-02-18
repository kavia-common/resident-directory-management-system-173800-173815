"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

type NavItem = {
  href: string;
  label: string;
  requireAdmin?: boolean;
  requireResident?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Directory" },
  { href: "/favorites", label: "Favorites" },
  { href: "/me", label: "My Profile" },
  { href: "/my-requests", label: "My Requests", requireResident: true },
  { href: "/admin/residents", label: "Admin: Residents", requireAdmin: true },
  { href: "/admin/approvals", label: "Admin: Approvals", requireAdmin: true },
  { href: "/admin/import-export", label: "Admin: Import/Export", requireAdmin: true },
  { href: "/admin/audit", label: "Admin: Audit Log", requireAdmin: true },
];

export default function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, hasRole, state } = useAuth();

  const nav = useMemo(() => {
    return NAV_ITEMS.filter((i) => {
      if (i.requireAdmin) return hasRole("admin");
      if (i.requireResident) return hasRole("resident");
      return true;
    });
  }, [hasRole]);

  return (
    <div className="appShell">
      <div className="container">
        <header className="topBar">
          <div className="brand">
            <div className="brandTitle">{title}</div>
            <div className="brandSubtitle">
              {subtitle ?? "Retro resident directory • Search • Approvals • Audit"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {state.status === "authenticated" ? (
              <>
                <span className="badge" aria-label="Logged in user">
                  {user?.email} • {user?.role.toUpperCase()}
                </span>
                <button
                  className="btn"
                  onClick={async () => {
                    await logout();
                    router.push("/login");
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link className="btn btnPrimary" href="/login">
                Login
              </Link>
            )}
          </div>
        </header>

        <div className="grid gridCols2" style={{ marginTop: 14 }}>
          <aside className="sideNav" aria-label="Primary navigation">
            <div className="navHeading">Navigation</div>
            <ul className="navList">
              {nav.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link className={`navLink ${active ? "navLinkActive" : ""}`} href={item.href}>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>

          <main style={{ minWidth: 0 }}>{children}</main>
        </div>

        <footer style={{ marginTop: 18, opacity: 0.85, fontSize: 12 }}>
          Tip: This frontend is integrated via REST calls. If the backend endpoints are not yet
          implemented, pages will show helpful error states.
        </footer>
      </div>
    </div>
  );
}
