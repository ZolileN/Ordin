"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpAction } from "@/actions/auth";
import { toast } from "sonner";

const plans = [
  { id: "STARTER", name: "Starter", price: "R500–R1,500/mo", desc: "1 control, 2 data sources" },
  { id: "GROWTH", name: "Growth", price: "R2,000–R5,000/mo", desc: "5 controls, team features" },
  { id: "BUSINESS", name: "Business", price: "R5,000–R15,000+/mo", desc: "Unlimited scale, API access" },
];

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("STARTER");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("plan", selectedPlan);
    const result = await signUpAction(formData);
    setLoading(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded bg-zinc-900 text-sm font-bold text-white">
            O
          </div>
          <h1 className="text-xl font-semibold text-zinc-900">Create your Ordin account</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization</Label>
              <Input id="organizationName" name="organizationName" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
          </div>

          <div className="space-y-2">
            <Label>Plan</Label>
            <div className="grid grid-cols-3 gap-2">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`rounded-md border p-3 text-left text-xs transition-colors ${
                    selectedPlan === plan.id
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 hover:border-zinc-400"
                  }`}
                >
                  <p className="font-semibold">{plan.name}</p>
                  <p className={`mt-0.5 ${selectedPlan === plan.id ? "text-zinc-300" : "text-zinc-500"}`}>
                    {plan.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-900 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
