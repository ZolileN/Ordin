import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white">
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-white text-sm font-bold text-zinc-900">
            O
          </div>
          <span className="text-lg font-semibold">Ordin</span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button className="bg-white text-zinc-900 hover:bg-zinc-100" asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-zinc-500">
          Business Integrity Platform
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight">
          Know where your business doesn&apos;t agree with itself.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-zinc-400">
          Ordin continuously verifies that related records across your systems agree —
          and gives your team a workflow to resolve what doesn&apos;t.
        </p>
        <div className="mt-10 flex gap-4">
          <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100" asChild>
            <Link href="/signup">Start free trial</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            asChild
          >
            <Link href="/login">Sign in</Link>
          </Button>
        </div>

        <div className="mt-24 grid max-w-4xl grid-cols-3 gap-8 text-left">
          {[
            {
              title: "Connect",
              desc: "Ingest data from CSV, XLSX, and future integrations with Sage, Xero, and more.",
            },
            {
              title: "Reconcile",
              desc: "Run controls that compare orders, invoices, payments, and inventory across systems.",
            },
            {
              title: "Resolve",
              desc: "Investigate exceptions, assign owners, attach evidence, and verify resolutions.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-zinc-800 p-6">
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
