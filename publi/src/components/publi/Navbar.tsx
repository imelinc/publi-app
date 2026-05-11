"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-[hsl(var(--hero-background)/0.95)] backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-3xl font-bold tracking-tight text-primary"
          aria-label="publi"
        >
          publi
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            asChild
            variant="ghost"
            className="h-11 rounded-full px-5 text-sm font-semibold text-foreground hover:bg-primary/10 hover:text-primary"
          >
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button
            asChild
            className="h-11 rounded-full px-5 text-sm font-semibold shadow-sm hover:bg-primary/90"
          >
            <Link href="/waitlist">Registrarse</Link>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full md:hidden"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="mobile-navigation"
          aria-label={isOpen ? "Cerrar menu" : "Abrir menu"}
        >
          {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      <div
        id="mobile-navigation"
        className={cn(
          "border-t border-border/60 bg-background md:hidden",
          isOpen ? "block" : "hidden",
        )}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
          <Button
            asChild
            variant="ghost"
            className="h-11 rounded-full text-sm font-semibold text-foreground hover:bg-primary/10 hover:text-primary"
          >
            <Link href="/login" onClick={() => setIsOpen(false)}>
              Iniciar sesión
            </Link>
          </Button>
          <Button
            asChild
            className="h-11 rounded-full text-sm font-semibold hover:bg-primary/90"
          >
            <Link href="/waitlist" onClick={() => setIsOpen(false)}>
              Registrarse
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
