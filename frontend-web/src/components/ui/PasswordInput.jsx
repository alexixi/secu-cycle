import "./Input.css";
import { useState } from "react";
import IconButton from "./IconButton";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function PasswordInput({ value, onChange, name, onBlur, autoFocus = false, autoComplete }) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
        <div className="password-container">
            <input
                className="input"
                type={showPassword ? "text" : "password"}
                name={name}
                id={name}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                required
                autoFocus={autoFocus}
                autoComplete={autoComplete}
            />
            <IconButton type="button" className="show-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
            </IconButton>
        </div>
        </>
    );
}
