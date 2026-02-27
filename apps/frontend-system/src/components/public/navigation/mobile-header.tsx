"use client";

import { AnimatePresence, motion } from "framer-motion";
import { NavItem } from "./nav-item";
import Link from "next/link";

export default function MobileHeader({
  mobileOpen,
  setMobileOpen,
  location,
}: {
  mobileOpen: boolean;
  setMobileOpen: (active: boolean) => void;
  location: string;
}) {
  const navLinks = NavItem();

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
              {["Settings", "Shopping History", "Logout"].map((item) => (
                <button
                  key={item}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm text-foreground/70 hover:bg-secondary transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
