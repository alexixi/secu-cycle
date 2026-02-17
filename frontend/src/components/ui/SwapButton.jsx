import { useState } from "react";
import IconButton from "./IconButton";
import "./SwapButton.css";
import { TbArrowsUpDown } from "react-icons/tb";

export default function SwapButton({ onClick }) {
    const [rotated, setRotated] = useState(false);

    return (
        <IconButton
            className={`swap-button${rotated ? " is-rotated" : ""}`}
            onClick={() => {
                setRotated((v) => !v);
                onClick?.();
            }}>
            <TbArrowsUpDown size={24} />
        </IconButton>
    );
}

