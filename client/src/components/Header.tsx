import { Link2 } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { Link } from "wouter";

interface HeaderProps {
  showActions?: boolean;
}

export function Header({ showActions = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gold/30 glass-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/">
          <a className="flex items-center gap-2 hover-elevate rounded-lg px-2 py-1 -ml-2">
            <div className="h-8 w-8 bg-gold rounded-md flex items-center justify-center gold-glow">
              <Link2 className="h-5 w-5 text-black" />
            </div>
            <span className="text-xl font-bold text-gradient-gold" data-testid="text-app-title">
              SFS Link
            </span>
          </a>
        </Link>

        <div className="flex items-center gap-4">
          {!showActions && (
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard">
                <a className="text-sm font-medium text-gold hover:text-gold-light transition-colors">
                  Dashboard
                </a>
              </Link>
              <Link href="/#pricing">
                <a className="text-sm font-medium text-gold hover:text-gold-light transition-colors">
                  Pricing
                </a>
              </Link>
            </nav>
          )}

          <ThemeToggle />

          {!showActions && (
            <Link href="/dashboard">
              <Button className="btn-primary hidden md:inline-flex">Get Started</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
