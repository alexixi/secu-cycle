import "./Input.css";
import "./CodeInput.css";

export const CODE_LENGTH = 6;

export default function CodeInput({
    value,
    onChange,
    id = "code",
    name = "code",
    length = CODE_LENGTH,
    autoFocus = false,
    required = true,
}) {
    return (
        <input
            className="input code-input"
            type="text"
            inputMode="numeric"
            id={id}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, "").slice(0, length))}
            placeholder={"–".repeat(length)}
            maxLength={length}
            autoComplete="one-time-code"
            autoFocus={autoFocus}
            required={required}
        />
    );
}
