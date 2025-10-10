"use client";

import Link from "next/link"
import { CodeXml } from "lucide-react"
import { AdminNav } from "./admin-nav";


export function AdminSidebar() {
  return (
    <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
                <CodeXml className="h-6 w-6" />
                <span className="">CSOJ Admin</span>
            </Link>
        </div>
        <div className="flex-1">
            <AdminNav />
        </div>
        </div>
    </div>
  )
}