import { ArrowRight } from "lucide-react";

import { Button } from "../ui/Button";
import { Dropdown } from "../ui/Dropdown";
import { BrandLogo } from "./BrandLogo";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

function NavLinks({ mobile = false }) {
  return navItems.map((item) => (
    <a
      key={item.href}
      href={item.href}
      className={
        mobile
          ? "block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-slate-100"
          : "text-sm font-medium text-slate-300 transition hover:text-white"
      }
    >
      {item.label}
    </a>
  ));
}

export function Navbar({ authenticated, onLogin, onSignup, onOpenChat }) {
  return (
    <header className="absolute inset-x-0 top-0 z-40 border-b border-white/10 bg-[#0b0f19]/75 backdrop-blur-xl">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="#top" aria-label="AI Chat Assistant home">
          <BrandLogo dark />
        </a>

        <div className="hidden items-center gap-8 md:flex">
          <NavLinks />
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {authenticated ? (
            <Button onClick={onOpenChat} size="sm">
              Open chat <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={onLogin}>
                Log in
              </Button>
              <Button size="sm" onClick={onSignup}>
                Sign up
              </Button>
            </>
          )}
        </div>

        <Dropdown className="md:hidden">
          <div className="space-y-1">
            <NavLinks mobile />
          </div>
          <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3">
            {authenticated ? (
              <Button onClick={onOpenChat}>Open chat</Button>
            ) : (
              <>
                <Button variant="outline" onClick={onLogin}>
                  Log in
                </Button>
                <Button onClick={onSignup}>Sign up</Button>
              </>
            )}
          </div>
        </Dropdown>
      </nav>
    </header>
  );
}
