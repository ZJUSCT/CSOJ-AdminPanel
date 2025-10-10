"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Users,
    Server,
    FileCode,
    Trophy,
    BookCopy,
} from "lucide-react"
import { cn } from "@/lib/utils";

const routes = [
    { href: "/cluster", label: "Cluster", icon: Server },
    { href: "/users", label: "Users", icon: Users },
    { href: "/submissions", label: "Submissions", icon: FileCode },
    { href: "/contests", label: "Contests", icon: Trophy },
    { href: "/problems", label: "Problems", icon: BookCopy },
];

export function AdminNav() {
    const pathname = usePathname();

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {routes.map(route => {
                const Icon = route.icon;
                return (
                    <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                            pathname.startsWith(route.href) && "bg-muted text-primary"
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        {route.label}
                    </Link>
                )
            })}
        </nav>
    );
}