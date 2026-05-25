import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangePickerProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  className?: string;
}

export function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const range: DateRange = {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  };

  function handleSelect(selected: DateRange | undefined) {
    onFromChange(selected?.from ? format(selected.from, "yyyy-MM-dd") : "");
    onToChange(selected?.to ? format(selected.to, "yyyy-MM-dd") : "");
    if (selected?.from && selected?.to) setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onFromChange("");
    onToChange("");
  }

  const hasRange = from || to;

  const label = hasRange
    ? [
        from ? format(new Date(from), "MMM d, yyyy") : "Start",
        to ? format(new Date(to), "MMM d, yyyy") : "End",
      ].join(" → ")
    : "Pick date range";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 justify-start gap-2 text-left font-normal",
            !hasRange && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          <span className="truncate">{label}</span>
          {hasRange && (
            <X
              className="size-3.5 ml-auto shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={2}
          captionLayout="dropdown"
          disabled={(date) => date > new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}
