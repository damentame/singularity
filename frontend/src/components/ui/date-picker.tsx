import * as React from "react";
import { format, addMonths, subMonths, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  variant?: 'default' | 'dark';
  showQuickSelect?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select a date",
  disabled = false,
  minDate,
  maxDate,
  className,
  variant = 'default',
  showQuickSelect = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState(value || new Date());

  const handleSelect = (date: Date | undefined) => {
    onChange(date);
    setOpen(false);
  };

  const disabledDays = React.useMemo(() => {
    const disabled: { before?: Date; after?: Date } = {};
    if (minDate) disabled.before = startOfDay(minDate);
    if (maxDate) disabled.after = startOfDay(maxDate);
    return Object.keys(disabled).length > 0 ? disabled : undefined;
  }, [minDate, maxDate]);

  const isDark = variant === 'dark';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "w-full px-4 py-3 border rounded-lg text-left transition-all duration-200",
            "flex items-center justify-between group",
            isDark 
              ? "bg-white/[0.05] border-white/[0.1] hover:border-gold/50 focus:border-gold/50" 
              : "bg-white border-gray-300 hover:border-gold/50 focus:ring-2 focus:ring-gold focus:border-gold",
            open && (isDark ? "border-gold/50" : "ring-2 ring-gold border-gold"),
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <span className={cn(
            "flex items-center gap-3",
            value 
              ? (isDark ? "text-white" : "text-gray-900") 
              : (isDark ? "text-white/40" : "text-gray-400")
          )}>
            <CalendarIcon className={cn(
              "w-5 h-5 transition-colors",
              value 
                ? "text-gold" 
                : (isDark ? "text-white/40 group-hover:text-gold" : "text-gray-400 group-hover:text-gold")
            )} />
            {value ? (
              <span className="font-medium">
                {format(value, 'EEEE, MMMM d, yyyy')}
              </span>
            ) : (
              <span>{placeholder}</span>
            )}
          </span>
          <ChevronRight className={cn(
            "w-5 h-5 transition-transform duration-200",
            isDark ? "text-white/40" : "text-gray-400",
            open && "rotate-90"
          )} />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 bg-white border-0 shadow-2xl rounded-xl overflow-hidden" 
        align="start"
        sideOffset={8}
      >
        {/* Custom Calendar Header */}
        <div className="bg-gradient-to-r from-navy to-navy/90 p-4 text-white">
          <p className="text-xs uppercase tracking-wider text-gold/80 mb-1">Select Date</p>
          <p className="text-lg font-playfair">
            {value 
              ? format(value, 'MMMM d, yyyy')
              : 'Choose a date'
            }
          </p>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={() => setMonth(subMonths(month, 1))}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="font-semibold text-gray-900">
            {format(month, 'MMMM yyyy')}
          </h3>
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Calendar Grid */}
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          disabled={disabledDays}
          className="p-4"
          classNames={{
            months: "flex flex-col",
            month: "space-y-4",
            caption: "hidden",
            caption_label: "hidden",
            nav: "hidden",
            table: "w-full border-collapse",
            head_row: "flex mb-2",
            head_cell: "text-gray-500 rounded-md w-10 font-medium text-xs uppercase tracking-wide",
            row: "flex w-full",
            cell: cn(
              "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
              "[&:has([aria-selected])]:bg-transparent"
            ),
            day: cn(
              "h-10 w-10 p-0 font-normal rounded-full transition-all duration-200",
              "hover:bg-gold/10 hover:text-navy",
              "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2",
              "aria-selected:opacity-100"
            ),
            day_range_end: "day-range-end",
            day_selected: cn(
              "bg-gold text-navy font-semibold",
              "hover:bg-gold hover:text-navy",
              "focus:bg-gold focus:text-navy",
              "shadow-lg shadow-gold/30"
            ),
            day_today: cn(
              "bg-navy/5 text-navy font-semibold",
              "ring-1 ring-navy/20"
            ),
            day_outside: "text-gray-300 opacity-50",
            day_disabled: "text-gray-300 opacity-50 cursor-not-allowed hover:bg-transparent",
            day_hidden: "invisible",
          }}
        />

        {/* Quick Select Options */}
        {showQuickSelect && (
          <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500 mb-2 font-medium">Quick Select</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: '3 months', months: 3 },
                { label: '6 months', months: 6 },
                { label: '1 year', months: 12 },
                { label: '18 months', months: 18 },
              ].map(({ label, months }) => {
                const date = addMonths(new Date(), months);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      onChange(date);
                      setMonth(date);
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-full hover:border-gold hover:text-gold transition-colors"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Compact version for forms with limited space
export function DatePickerCompact({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  minDate,
  maxDate,
  className,
  variant = 'default',
}: Omit<DatePickerProps, 'showQuickSelect'>) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState(value || new Date());

  const handleSelect = (date: Date | undefined) => {
    onChange(date);
    setOpen(false);
  };

  const disabledDays = React.useMemo(() => {
    const disabled: { before?: Date; after?: Date } = {};
    if (minDate) disabled.before = startOfDay(minDate);
    if (maxDate) disabled.after = startOfDay(maxDate);
    return Object.keys(disabled).length > 0 ? disabled : undefined;
  }, [minDate, maxDate]);

  const isDark = variant === 'dark';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "px-4 py-3 border rounded-lg text-left transition-all duration-200 w-full",
            "flex items-center gap-2 group",
            isDark 
              ? "bg-white/[0.05] border-white/[0.1] hover:border-gold/50 focus:border-gold/50" 
              : "bg-white border-gray-300 hover:border-gold/50 focus:ring-2 focus:ring-gold focus:border-gold",
            open && (isDark ? "border-gold/50" : "ring-2 ring-gold border-gold"),
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <CalendarIcon className={cn(
            "w-4 h-4 transition-colors flex-shrink-0",
            value 
              ? "text-gold" 
              : (isDark ? "text-white/40 group-hover:text-gold" : "text-gray-400 group-hover:text-gold")
          )} />
          <span className={cn(
            "text-sm truncate",
            value 
              ? (isDark ? "text-white" : "text-gray-900") 
              : (isDark ? "text-white/40" : "text-gray-400")
          )}>
            {value ? format(value, 'MMM d, yyyy') : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 bg-white border-0 shadow-2xl rounded-xl overflow-hidden" 
        align="start"
        sideOffset={8}
      >
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-navy to-navy/90">
          <button
            type="button"
            onClick={() => setMonth(subMonths(month, 1))}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <h3 className="font-semibold text-white text-sm">
            {format(month, 'MMMM yyyy')}
          </h3>
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Calendar Grid */}
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          disabled={disabledDays}
          className="p-3"
          classNames={{
            months: "flex flex-col",
            month: "space-y-3",
            caption: "hidden",
            caption_label: "hidden",
            nav: "hidden",
            table: "w-full border-collapse",
            head_row: "flex mb-1",
            head_cell: "text-gray-500 rounded-md w-9 font-medium text-xs",
            row: "flex w-full",
            cell: cn(
              "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
              "[&:has([aria-selected])]:bg-transparent"
            ),
            day: cn(
              "h-9 w-9 p-0 font-normal rounded-full transition-all duration-200",
              "hover:bg-gold/10 hover:text-navy",
              "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-1",
              "aria-selected:opacity-100"
            ),
            day_range_end: "day-range-end",
            day_selected: cn(
              "bg-gold text-navy font-semibold",
              "hover:bg-gold hover:text-navy",
              "focus:bg-gold focus:text-navy",
              "shadow-md shadow-gold/30"
            ),
            day_today: cn(
              "bg-navy/5 text-navy font-semibold",
              "ring-1 ring-navy/20"
            ),
            day_outside: "text-gray-300 opacity-50",
            day_disabled: "text-gray-300 opacity-50 cursor-not-allowed hover:bg-transparent",
            day_hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
