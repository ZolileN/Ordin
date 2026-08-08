import { Sidebar } from "./sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
  organizationName: string;
  userName?: string | null;
}

export function AppLayout({ children, organizationName, userName }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100">
      <Sidebar organizationName={organizationName} userName={userName} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-6">{children}</div>
      </main>
    </div>
  );
}
