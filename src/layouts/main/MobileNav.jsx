import { Plus } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { MOBILE_NAV } from "../../app/config/navigation";
import { ROUTES } from "../../app/config/routes";
import { cn } from "../../utils/cn";

/** Bottom tab bar, shown below the `lg` breakpoint where the sidebar is hidden. */
export default function MobileNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center">
        {MOBILE_NAV.map((item) =>
          item.action === "create" ? (
            <li key={item.label} className="grid place-items-center">
              <Link
                to={ROUTES.home}
                state={{ focusComposer: true }}
                aria-label="Create a post"
                className="grid size-11 place-items-center rounded-2xl bg-brand text-on-brand transition-colors hover:bg-brand-hover"
              >
                <Plus className="size-6" aria-hidden="true" />
              </Link>
            </li>
          ) : (
            <li key={item.label}>
              <NavLink
                to={item.path}
                end={item.path === ROUTES.home}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center gap-1 py-1.5 text-[11px] font-semibold transition-colors",
                    isActive ? "text-brand-ink" : "text-ink-soft",
                  )
                }
              >
                <item.icon className="size-[22px]" aria-hidden="true" />
                {item.label}
              </NavLink>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
