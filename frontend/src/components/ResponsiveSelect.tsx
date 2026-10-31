import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { cn } from "@/lib/utils";

export type ResponsiveSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

const nativeSelectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:bg-background";

type ResponsiveSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: ResponsiveSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  triggerClassName?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  required?: boolean;
};

export function ResponsiveSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  id,
  className,
  triggerClassName,
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  required,
}: ResponsiveSelectProps) {
  const coarse = useCoarsePointer();

  if (coarse) {
    return (
      <select
        id={id}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid || undefined}
        aria-required={required || undefined}
        required={required}
        value={value}
        disabled={disabled}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn(nativeSelectClassName, className, triggerClassName)}
      >
        {placeholder ? (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    // `required` is also set on the trigger below. The prop is not in the button
    // type, so it is passed through a narrow assertion; Radix forwards it.
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-required={required || undefined}
        className={cn("w-full", triggerClassName, className)}
        {...(required
          ? ({ required: true } as { "aria-required"?: boolean })
          : {})}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
