import { normalizeToIsoDate } from "../util/dateInput.js";

const DateInput = ({
  value,
  onChange,
  className = "",
  placeholder = "dd/mm/yyyy",
  id,
  name,
  disabled = false,
  required = false,
  ...rest
}) => {
  const isoValue = normalizeToIsoDate(value);

  const handleChange = (event) => {
    const nextValue = event.target.value;
    onChange?.({
      target: {
        value: nextValue,
        name,
        id,
      },
    });
  };

  return (
    <input
      {...rest}
      id={id}
      name={name}
      type="date"
      value={isoValue}
      onChange={handleChange}
      className={className}
      disabled={disabled}
      required={required}
    />
  );
};

export default DateInput;
