"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { runControlAction } from "@/actions/controls";
import { toast } from "sonner";
import { Play } from "lucide-react";

interface RunControlButtonProps {
  controlId: string;
  organizationId: string;
}

export function RunControlButton({ controlId, organizationId }: RunControlButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRun() {
    setLoading(true);
    try {
      const result = await runControlAction(controlId, organizationId);
      toast.success(
        `Control run complete: ${(result.metrics as { exceptions: number }).exceptions} exceptions found`
      );
      router.push(`/controls/runs/${result.run.id}`);
      router.refresh();
    } catch {
      toast.error("Control run failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" onClick={handleRun} disabled={loading}>
      <Play className="h-3 w-3" />
      {loading ? "Running..." : "Run"}
    </Button>
  );
}
