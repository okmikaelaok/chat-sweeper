import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type SelectOption = {
  value: string
  label: string
  icon: LucideIcon
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: SelectOption[]
}

// Keep native selection, keyboard navigation and form events in the static UI.
// The customizable picker is styled with the same tokens as our shadcn controls.
export function Select({ className, options, ...props }: SelectProps) {
  return (
    <select className={cn("ui-select font-normal", className)} {...props}>
      {options.map(({ value, label, icon: Icon }) => (
        <option key={value} value={value}>
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </option>
      ))}
    </select>
  )
}
