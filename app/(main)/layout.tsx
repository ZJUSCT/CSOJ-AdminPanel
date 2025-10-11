"use client";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <AdminSidebar />
            <div className="flex flex-col">
                <AdminHeader />
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
                <footer className="mt-auto border-t py-4">
                  <div className="container mx-auto text-center text-sm text-muted-foreground">
                    Powered by{" "}
                    <a
                      href="https://github.com/ZJUSCT/CSOJ"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      ZJUSCT/CSOJ
                    </a>{" "}
                    &{" "}
                    <a
                      href="https://github.com/ZJUSCT/CSOJ-AdminPanel"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      ZJUSCT/CSOJ-AdminPanel
                    </a>
                  </div>
                </footer>
            </div>
        </div>
    )
}