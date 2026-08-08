"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/actions/auth";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded bg-zinc-900 text-sm font-bold text-white">
            O
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">Sign in to Ordin</h1>
          <p className="mt-1 text-sm text-zinc-500">Business integrity platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="you@company.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500">
          No account?{" "}
          <Link href="/signup" className="font-medium text-zinc-900 hover:underline">
            Create one
          </Link>
        </p>

        <div className="mt-6 rounded-md border border-zinc-200 bg-zinc-100 p-3 text-center text-xs text-zinc-500">
          Demo: <span className="font-mono">demo@acme.services</span> / <span className="font-mono">demo1234</span>
        </div>
      </div>
    </div>
  );
}
