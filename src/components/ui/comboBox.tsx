import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useState, useEffect } from "react";

// Reusable ComboboxSelect component that accepts options as props
const ComboboxSelect = ({
  options,
  defaultSelectedIndex = 0,
  value = null,
  className = "mx-auto w-52",
  onChange,
  placeholder = "Select an option",
}) => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(
    value
      ? options.find((option) => option.id.toString() === value.toString())
      : options[defaultSelectedIndex] || null
  );

  // Update selected when value prop changes
  useEffect(() => {
    if (value !== null && value !== undefined) {
      const matchingOption = options.find(
        (option) => option.id.toString() === value.toString()
      );
      if (matchingOption) {
        setSelected(matchingOption);
      }
    }
  }, [value, options]);

  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) => {
          return option.name.toLowerCase().includes(query.toLowerCase());
        });

  const handleChange = (value) => {
    setSelected(value);
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className={className}>
      <Combobox
        value={selected}
        onChange={handleChange}
        onClose={() => setQuery("")}
        as="div" // Add an explicit "as" prop to render a specific element
      >
        <div className="relative">
          <ComboboxInput
            className="w-full rounded-lg border-none bg-white/5 py-1.5 pr-8 pl-3 text-sm text-white focus:not-data-focus:outline-none data-focus:outline-2 data-focus:-outline-offset-2 data-focus:outline-white/25"
            displayValue={(option:any) => option?.name || placeholder}
            onChange={(event) => setQuery(event.target.value)}
          />
          <ComboboxButton className="group absolute inset-y-0 right-0 px-2.5">
            <ChevronDownIcon className="h-4 w-4 fill-white/60 group-data-hover:fill-white" />
          </ComboboxButton>
        </div>
        <ComboboxOptions
          anchor="bottom"
          transition
          className="w-full rounded-xl border border-white/5 bg-white/5 p-1 empty:invisible transition duration-100 ease-in data-leave:data-closed:opacity-0"
        >
          {filteredOptions.length === 0 && (
            <div className="px-3 py-1.5 text-sm text-white/70">
              No results found
            </div>
          )}
          {filteredOptions.map((option) => (
            <ComboboxOption
              key={option.id}
              value={option}
              className="group flex cursor-default items-center gap-2 rounded-lg px-3 py-1.5 select-none data-focus:bg-white/10"
            >
              <CheckIcon className="invisible h-4 w-4 fill-white group-data-selected:visible" />
              <div className="text-sm text-white">{option.name}</div>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
};

export default ComboboxSelect;
