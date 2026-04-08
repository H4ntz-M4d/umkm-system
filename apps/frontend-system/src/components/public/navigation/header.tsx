"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, Bell, User, Menu, X, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileHeader from "./mobile-header";
import { NavItem, NavItemProfile } from "./nav-item";
import { useCustomerAuth } from "@/lib/queries/auth/userCustomerAuth";
import { useAuthOperations } from "@/hooks/auth/use-auth-operation";
import { Separator } from "@/components/ui/separator";

const Header = ({user}: {user?: any}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navLinks = NavItem();
  const navLinksProfile = NavItemProfile()
  const location = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between h-16 md:h-20">
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
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors hover:text-white ${
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
          <button className="relative p-2 rounded-lg text-foreground/70 hover:text-white hover:bg-secondary transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button>
          <button className="hidden md:flex relative p-2 rounded-lg text-foreground/70 hover:text-white hover:bg-secondary transition-colors">
            <Heart size={20} />
          </button>
          <button className="relative p-2 rounded-lg text-foreground/70 hover:text-white hover:bg-secondary transition-colors">
            <ShoppingBag size={20} />
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              3
            </span>
          </button>

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
                  <div className={"flex flex-col justify-center px-4 pt-4 pb-3"}>
                    <p className={"text-sm"}>{user?.name}</p>
                    <p className={"text-xs"}>{user?.email}</p>
                  </div>
                  <Separator />
                  {navLinksProfile.map((item) => (
                    <button
                      key={item.label}
                      className="w-full text-left px-4 py-3 text-sm text-card-foreground hover:bg-secondary transition-colors"
                      onClick={() => {
                        item.fn?.(),
                        setProfileOpen(false)
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
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
      />
    </nav>
  );
};

export default Header;
