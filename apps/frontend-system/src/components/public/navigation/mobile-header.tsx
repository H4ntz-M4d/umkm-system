"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { NavItem, NavItemProfile } from "./nav-item";
import { useAuthOperations } from "@/hooks/auth/use-auth-operation";

export default function MobileHeader({
  mobileOpen,
  setMobileOpen,
  location,
  isLoggedIn = false,
}: {
  mobileOpen: boolean;
  setMobileOpen: (active: boolean) => void;
  location: string;
  isLoggedIn?: boolean;
}) {
  const navLinks = NavItem();
  const { signOutCustomer } = useAuthOperations();
  const navLinksProfile = NavItemProfile(signOutCustomer);

  return (
    <AnimatePresence>
      {mobileOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="md:hidden overflow-hidden border-t border-border bg-background"
        >
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  location === link.path
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t border-border pt-3 mt-3 space-y-1">
              {isLoggedIn ? (
                // Sebelumnya daftar ini hardcoded tanpa handler sama sekali,
                // jadi logout di tampilan mobile tidak berfungsi.
                navLinksProfile.map((item) =>
                  item.fn ? (
                    <button
                      key={item.label}
                      onClick={() => {
                        item.fn?.();
                        setMobileOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm text-foreground/70 hover:bg-secondary transition-colors"
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.path}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 rounded-xl text-sm text-foreground/70 hover:bg-secondary transition-colors"
                    >
                      {item.label}
                    </Link>
                  ),
                )
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-primary hover:bg-secondary transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
