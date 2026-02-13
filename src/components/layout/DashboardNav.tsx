"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Hammer,
  SignOut,
  GearSix,
  User,
} from "@phosphor-icons/react/dist/ssr";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

type DashboardNavProps = {
  userEmail: string;
  userName: string;
};

export function DashboardNav({ userEmail, userName }: DashboardNavProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-blue-600 flex items-center justify-center">
              <Hammer size={16} weight="bold" className="text-white" />
            </div>
            <span className="text-[15px] font-semibold text-gray-900">TeamForge</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              href="/org/settings"
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              <GearSix size={18} weight="bold" />
            </Link>

            <Menu as="div" className="relative">
              <MenuButton className="flex items-center gap-2 rounded px-2.5 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <User size={12} weight="bold" className="text-blue-600" />
                </div>
                <span className="hidden sm:inline">{userName}</span>
              </MenuButton>

              <MenuItems className="absolute right-0 mt-1 w-56 origin-top-right rounded-xl border border-gray-200 bg-white py-1 shadow-lg focus:outline-none z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-[13px] font-semibold text-gray-900">{userName}</p>
                  <p className="text-[11px] text-gray-400 truncate">{userEmail}</p>
                </div>
                <MenuItem>
                  <Link
                    href="/org/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 data-[focus]:bg-gray-50"
                  >
                    <GearSix size={16} weight="bold" />
                    Organisation Settings
                  </Link>
                </MenuItem>
                <MenuItem>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 data-[focus]:bg-red-50"
                  >
                    <SignOut size={16} weight="bold" />
                    Sign Out
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </div>
      </div>
    </nav>
  );
}
