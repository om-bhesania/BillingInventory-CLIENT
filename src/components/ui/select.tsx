import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

// Extended interfaces for combobox functionality
interface SelectProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> {
  isCombobox?: boolean;
}

interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  isCombobox?: boolean;
}

interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
  searchValue?: string;
}

const Select = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Root>,
  SelectProps
>(({ isCombobox, value, onValueChange, defaultValue, ...props }, ref) => {
  // Maintain the search value in state
  const [searchValue, setSearchValue] = React.useState("");
  const [open, setOpen] = React.useState(false);

  // Sync the search value with the selected value when it changes externally
  React.useEffect(() => {
    if (isCombobox && value && !open) {
      // Find the item text for the selected value
      const selectedItem = React.Children.toArray(props.children).find(
        (child) => {
          if (React.isValidElement(child) && child.props.children) {
            const content = child.props.children;
            if (
              React.isValidElement(content) &&
              content.props &&
              (content as React.ReactElement).props.children
            ) {
              const items = React.Children.toArray(
                (content as React.ReactElement).props.children
              );
              return items.some(
                (item) =>
                  React.isValidElement(item) && item.props.value === value
              );
            }
          }
          return false;
        }
      );

      if (selectedItem && React.isValidElement(selectedItem)) {
        const content = selectedItem.props.children;
        if (
          React.isValidElement(content) &&
          content.props &&
          (content as React.ReactElement).props.children
        ) {
          const items = React.Children.toArray(
            (content as React.ReactElement).props.children
          );
          const selectedItemElement = items.find(
            (item) => React.isValidElement(item) && item.props.value === value
          );

          if (
            selectedItemElement &&
            React.isValidElement(selectedItemElement)
          ) {
            const itemText = React.Children.toArray(
              selectedItemElement.props.children
            ).join("");
            setSearchValue(itemText);
          }
        }
      }
    }
  }, [isCombobox, value, props.children, open]);

  // Enhanced props for Select.Root with combobox functionality
  const enhancedProps = {
    ...props,
    value,
    defaultValue,
    onValueChange: (newValue: string) => {
      if (onValueChange) {
        onValueChange(newValue);
      }
    },
    open,
    onOpenChange: (newOpen: boolean) => {
      setOpen(newOpen);
      // Don't reset search when opening
      if (!newOpen && !value) {
        setSearchValue("");
      }
      if (props.onOpenChange) {
        props.onOpenChange(newOpen);
      }
    },
  };

  // Context to pass down the combobox state
  const comboboxContext = React.useMemo(
    () => ({
      isCombobox: isCombobox || false,
      searchValue,
      setSearchValue,
    }),
    [isCombobox, searchValue]
  );

  return (
    <ComboboxContext.Provider value={comboboxContext}>
      <SelectPrimitive.Root {...enhancedProps} />
    </ComboboxContext.Provider>
  );
});

Select.displayName = "Select";

// Context for combobox functionality
type ComboboxContextType = {
  isCombobox: boolean;
  searchValue: string;
  setSearchValue: React.Dispatch<React.SetStateAction<string>>;
};

const ComboboxContext = React.createContext<ComboboxContextType>({
  isCombobox: false,
  searchValue: "",
  setSearchValue: () => {},
});

const useCombobox = () => React.useContext(ComboboxContext);

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, children, isCombobox: triggerIsCombobox, ...props }, ref) => {
  const { isCombobox, searchValue, setSearchValue } = useCombobox();
  const shouldUseCombobox = isCombobox || triggerIsCombobox;
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Handle input click to prevent trigger from toggling dropdown
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  // Handle keydown to prevent select from closing on space/enter
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " " || e.key === "Enter") {
      e.stopPropagation();
    }
  };

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        shouldUseCombobox && "cursor-text",
        className
      )}
      {...props}
    >
      {shouldUseCombobox ? (
        <div
          className="flex items-center w-full relative"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none outline-none p-0 text-sm absolute inset-0 z-10"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onClick={handleInputClick}
            onKeyDown={handleInputKeyDown}
          />
          <div className="flex-1 opacity-0">{children}</div>
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
          </SelectPrimitive.Icon>
        </div>
      ) : (
        <>
          {children}
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SelectPrimitive.Icon>
        </>
      )}
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(({ className, children, position = "popper", ...props }, ref) => {
  const { isCombobox, searchValue } = useCombobox();

  // Filter children based on search value if it's a combobox
  const filteredChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;

    // Handle SelectItem directly
    if (child.type === SelectItem) {
      if (!isCombobox || !searchValue) return child;

      const itemText = React.Children.toArray(child.props.children)
        .join("")
        .toLowerCase();
      return itemText.includes(searchValue.toLowerCase()) ? child : null;
    }

    // Handle SelectGroup or other container components
    if (child.props.children) {
      const filteredGroupChildren = React.Children.map(
        child.props.children,
        (groupChild) => {
          if (
            !React.isValidElement(groupChild) ||
            groupChild.type !== SelectItem
          )
            return groupChild;

          if (!isCombobox || !searchValue) return groupChild;

          const itemText = React.Children.toArray(
            (groupChild as React.ReactElement).props.children
          )
            .join("")
            .toLowerCase();
          return itemText.includes(searchValue.toLowerCase())
            ? groupChild
            : null;
        }
      );

      // Only return groups that have at least one matching child
      const hasVisibleChildren =
        filteredGroupChildren && filteredGroupChildren.some((c) => c !== null);

      return hasVisibleChildren
        ? React.cloneElement(child, {
            ...child.props,
            children: filteredGroupChildren,
          })
        : null;
    }

    return child;
  });

  // Check if we have any non-null children after filtering
  const hasChildren =
    filteredChildren && filteredChildren.some((child) => child !== null);

  // If no matches, show a "No results" message
  const contentToRender = hasChildren ? (
    filteredChildren
  ) : isCombobox && searchValue ? (
    <div className="py-2 px-2 text-sm text-muted-foreground">
      No results found
    </div>
  ) : (
    children
  );

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          )}
        >
          {contentToRender}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
SelectContent.displayName = "SelectContent";

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, value, ...props }, ref) => {
  const { setSearchValue, isCombobox } = useCombobox();

  // Get the display text from children
  const displayText = React.Children.toArray(children).join("");

  // Handle selection
  const handleSelect = () => {
    if (isCombobox) {
      setSearchValue(displayText);
    }
  };

  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      value={value}
      onSelect={handleSelect}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
