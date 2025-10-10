"use client";

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { CircleUser, Menu, ServerCrash, Zap } from "lucide-react"
import Link from "next/link"
import { AdminNav } from "./admin-nav";
import { ThemeToggle } from "./theme-toggle";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useSWRConfig } from "swr";

export function AdminHeader() {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();

  const handleReload = async () => {
     try {
        const response = await api.post('/reload');
        const data = response.data.data;
        toast({
            title: "Reload Successful",
            description: `${data.contests_loaded} contests, ${data.problems_loaded} problems loaded. ${data.submissions_deleted} submissions deleted.`
        });
        // Mutate key endpoints to refresh data across the app
        mutate('/contests');
        mutate('/problems');
        mutate('/submissions');
     } catch (err) {
        // SWR's global error handler will also catch this
     }
  }

  const handleRecalculate = async () => {
    // In a real app, this would open a dialog to get user_id and problem_id
    const userId = prompt("Enter User ID to recalculate for:");
    const problemId = prompt("Enter Problem ID to recalculate for:");
    if (!userId || !problemId) return;

    try {
        await api.post('/scores/recalculate', { user_id: userId, problem_id: problemId });
        toast({
            title: "Recalculation Triggered",
            description: `Score recalculation for user ${userId} on problem ${problemId} has been started.`
        });
    } catch(err) {
       // SWR's global error handler will also catch this
    }
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
        <Sheet>
            <SheetTrigger asChild>
            <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
            </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
                <AdminNav />
            </SheetContent>
        </Sheet>
        <div className="w-full flex-1">
            {/* Can add a global search bar here if needed */}
        </div>
        <Button variant="outline" size="sm" onClick={handleRecalculate}><Zap /> Recalculate Score</Button>
        <Button variant="outline" size="sm" onClick={handleReload}><ServerCrash /> Reload Config</Button>
        <ThemeToggle />
    </header>
  )
}