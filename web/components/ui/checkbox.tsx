import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    iconClassName?: string;
    variant?: "default" | "blue" | "ghost";
  }
>(({ className, iconClassName, variant = "default", ...props }, ref) => {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "default" &&
          "border border-slate-200 border-slate-900 focus-visible:ring-slate-950 data-[state=checked]:bg-slate-900 data-[state=checked]:text-slate-50 dark:border-slate-800 dark:border-slate-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 dark:data-[state=checked]:bg-slate-50 dark:data-[state=checked]:text-slate-900",
        variant === "blue" &&
          "border border-blue-200 border-blue-600 focus-visible:ring-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:border-blue-400 dark:border-blue-400 dark:ring-offset-slate-950 dark:focus-visible:ring-blue-400 dark:data-[state=checked]:bg-blue-400 dark:data-[state=checked]:text-slate-900",
        variant === "ghost" &&
          "border-0 focus-visible:ring-slate-950 data-[state=checked]:bg-transparent dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn(
          "flex items-center justify-center",
          variant === "default"
            ? "text-current"
            : variant === "ghost"
            ? "text-slate-900 dark:text-slate-50"
            : "text-white dark:text-slate-900"
        )}
      >
        <Check className={cn("h-4 w-4", iconClassName)} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
