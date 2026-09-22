import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export type EmptyAction = { label: string; onClick: () => void; icon?: LucideIcon; variant?: "academic" | "yellow" | "outline" | "ghost" };

/**
 * Guided empty state: never a bare "no data" line. Every state explains what
 * this space is for and offers the next academic action.
 */
export function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions = [],
  hints = [],
  compact = false,
  className = "",
}: {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description: string;
  actions?: EmptyAction[];
  hints?: string[];
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={`academic-card overflow-hidden ${className}`}>
      <div className="h-1.5 bg-primary" />
      <div className={compact ? "p-5" : "p-6 md:p-8"}>
        <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-academic">
            <Icon className="size-6" />
          </span>
          <div className="min-w-0">
            {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-wide text-academic">{eyebrow}</p>}
            <h3 className={`mt-1 font-bold ${compact ? "text-base" : "text-lg"}`}>{title}</h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>

            {hints.length > 0 && (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {hints.map((hint) => (
                  <li key={hint} className="flex items-start gap-2 rounded-xl bg-muted p-3 text-xs leading-5 text-muted-foreground">
                    <Sparkles className="mt-0.5 size-3.5 shrink-0 text-academic" />
                    <span className="min-w-0">{hint}</span>
                  </li>
                ))}
              </ul>
            )}

            {actions.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {actions.map((action, index) => {
                  const ActionIcon = action.icon;
                  return (
                    <Button
                      key={action.label}
                      size="sm"
                      variant={action.variant ?? (index === 0 ? "academic" : "outline")}
                      onClick={action.onClick}
                    >
                      {ActionIcon && <ActionIcon />}
                      {action.label}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
