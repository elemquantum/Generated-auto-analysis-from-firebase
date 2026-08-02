'use client';

import Link from "next/link";
import { Mountain, User, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center space-x-2 mr-6">
          <Mountain className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg hidden sm:inline-block">Пазарен Поглед AI</span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full"
                >
                  <Avatar>
                    <AvatarImage src="https://placehold.co/40x40" data-ai-hint="person avatar" alt="User avatar" />
                    <AvatarFallback>
                      <User />
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Моят акаунт</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/">Продуктов инвентар</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Настройки</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Изход</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
}
