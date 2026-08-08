import { CONTROL_TEMPLATES } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export default function ControlLibraryPage() {
  const categories = [...new Set(CONTROL_TEMPLATES.map((t) => t.category))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Control Library</h1>
        <p className="text-sm text-zinc-500">Pre-built controls for common business integrity checks</p>
      </div>

      {categories.map((category) => (
        <div key={category}>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-400">{category}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {CONTROL_TEMPLATES.filter((t) => t.category === category).map((template) => (
              <Card key={template.id} className={!template.available ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {!template.available && (
                      <Badge className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Coming soon
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {template.available ? (
                    <Button size="sm" asChild>
                      <Link href={`/controls/new?template=${template.id}`}>Use this control</Link>
                    </Button>
                  ) : (
                    <p className="text-xs text-zinc-400">Available in a future release</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
