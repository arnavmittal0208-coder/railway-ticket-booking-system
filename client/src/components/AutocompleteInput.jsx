import { useMemo, useState } from "react";

const AutocompleteInput = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  name,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const filtered = useMemo(() => {
    const needle = String(value || "").trim().toLowerCase();
    if (!needle) {
      return options.slice(0, 8);
    }

    const scoreOption = (optionValue) => {
      const normalized = optionValue.toLowerCase();
      if (normalized.startsWith(needle)) {
        return 0;
      }
      if (normalized.includes(` ${needle}`) || normalized.includes(`(${needle}`)) {
        return 1;
      }
      if (normalized.includes(needle)) {
        return 2;
      }
      return 99;
    };

    return options
      .map((opt) => ({ opt, score: scoreOption(opt) }))
      .filter((row) => row.score < 99)
      .sort((a, b) => a.score - b.score || a.opt.localeCompare(b.opt))
      .map((row) => row.opt)
      .slice(0, 8);
  }, [options, value]);

  const chooseOption = (option) => {
    onChange(option);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (event) => {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }

    if (!filtered.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1 >= filtered.length ? 0 : prev + 1));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 < 0 ? filtered.length - 1 : prev - 1));
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      chooseOption(filtered[activeIndex]);
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <label className="autocomplete-wrap">
      {label}
      <input
        name={name}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 120)}
        onKeyDown={onKeyDown}
        autoComplete="off"
      />
      {isOpen && filtered.length > 0 && (
        <ul className="autocomplete-list" role="listbox">
          {filtered.map((opt, index) => (
            <li
              key={opt}
              className={index === activeIndex ? "active" : ""}
              onMouseDown={() => chooseOption(opt)}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </label>
  );
};

export default AutocompleteInput;
