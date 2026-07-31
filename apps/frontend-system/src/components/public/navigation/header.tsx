"use client";

import { useState } from "react";
import { Bell, User, Menu, X, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CartDataType } from "@repo/schemas";
import MobileHeader from "./mobile-header";
import { NavItem, NavItemProfile } from "./nav-item";
import { Separator } from "@/components/ui/separator";
import CartBadge from "../cart/cart-badge";
import { useAuthOperations } from "@/hooks/auth/use-auth-operation";

const Header = ({ user, cart }: { user?: any; cart?: CartDataType | null }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navLinks = NavItem();
  const { signOutCustomer } = useAuthOperations();
  const navLinksProfile = NavItemProfile(signOutCustomer);
  const location = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="mx-auto px-4 md:px-8 flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-xl md:text-2xl font-bold text-foreground tracking-tight">
            Nurfa<span className="text-primary">Craft</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`px-4 py-2 rounded-lg text-sm transition-colors hover:text-white ${
                location === link.path
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:text-foreground hover:bg-secondary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* <button className="relative p-2 rounded-lg text-foreground/70 hover:text-white hover:bg-secondary transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button> */}
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="hidden md:flex relative p-2 rounded-lg text-foreground/70 hover:text-white hover:bg-secondary transition-colors"
          >
            <Heart size={20} />
          </Link>
          <CartBadge serverCart={cart ?? null} isLoggedIn={Boolean(user)} />

          {/* Profile dropdown */}
          <div className="relative hidden md:block">
            {user ? (
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="p-2 rounded-lg text-foreground/70 hover:text-white hover:bg-secondary transition-colors"
              >
                <User size={20} />
              </button>
            ) : (
              <Link href={"/login"}>
                <button className="p-2 rounded-lg text-foreground/70 hover:text-white hover:bg-secondary transition-colors">
                  Login
                </button>
              </Link>
            )}
            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-warm-lg overflow-hidden"
                >
                  <div
                    className={"flex flex-col justify-center px-4 pt-4 pb-3"}
                  >
                    <p className={"text-sm"}>{user?.name}</p>
                    <p className={"text-xs"}>{user?.email}</p>
                  </div>
                  <Separator />
                  {navLinksProfile.map((item) =>
                    item.fn ? (
                      <button
                        key={item.label}
                        className="w-full text-left px-4 py-3 text-sm text-card-foreground hover:bg-secondary transition-colors"
                        onClick={() => {
                          item.fn?.();
                          setProfileOpen(false);
                        }}
                      >
                        {item.label}
                      </button>
                    ) : (
                      <Link
                        key={item.label}
                        href={item.path}
                        className="block w-full px-4 py-3 text-sm text-card-foreground hover:bg-secondary transition-colors"
                        onClick={() => setProfileOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ),
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-foreground/70 hover:bg-secondary"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <MobileHeader
        mobileOpen={mobileOpen}
        location={location}
        setMobileOpen={setMobileOpen}
        isLoggedIn={Boolean(user)}
      />
    </nav>
  );
};

export default Header;
