
import { LlmConfigForm } from "@/components/llm-config-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, BotMessageSquare, TestTube2, FileKey2, Terminal, MessageSquare, LogOut } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logout } from "./actions";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <div className="container mx-auto p-4 py-8 md:p-8">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Settings className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-headline text-foreground">
                LLM Config Manager
              </h1>
              <p className="text-muted-foreground">
                An admin dashboard to configure inference request parameters for your LLM.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/chat" passHref>
                <Button variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Buka Chat Pengguna
                </Button>
            </Link>
            <form action={logout}>
                <Button variant="ghost">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </form>
          </div>
        </header>

        <LlmConfigForm />
        
      </div>
    </div>
  );
}
