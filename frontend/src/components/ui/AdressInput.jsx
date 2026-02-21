import React, { useState, useEffect, useRef } from "react";
import { searchAddressAutocomplete } from "../../services/geocodingService";
import "./AdressInput.css";

export default function AdressInput({ placeholder, onSelect, defaultValue, children: icon }) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isValidated, setIsValidated] = useState(false);
    const [cursor, setCursor] = useState(-1);

    const suggestionRefs = useRef([]);

    useEffect(() => {
        if (defaultValue !== undefined) {
            setQuery(defaultValue);
            setIsValidated(true);
        }
    }, [defaultValue]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query && !isValidated && query.length >= 3) {
                const results = await searchAddressAutocomplete(query);
                setSuggestions(results);
                setIsOpen(true);
                setCursor(-1);
            } else {
                setSuggestions([]);
                setIsOpen(false);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [query, isValidated]);

    useEffect(() => {
        if (cursor >= 0 && suggestionRefs.current[cursor]) {
            suggestionRefs.current[cursor].scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        }
    }, [cursor]);


    const handleSelect = (place) => {
        if (!place || place.id === "no-result") {
            setQuery("");
            setSuggestions([]);
            setIsOpen(false);
            setHasError(true);
            setIsValidated(false);
            return;
        }
        setQuery(place.display_name);
        setSuggestions([]);
        setIsOpen(false);
        setHasError(false);
        setIsValidated(true);

        onSelect({
            lat: parseFloat(place.lat),
            lon: parseFloat(place.lon),
            name: place.display_name
        });
    };
    
    const handleBlur = () => {
        setTimeout(() => {
            setIsOpen(false);
            if (query.length > 0 && !isValidated) {
                setHasError(true);
            }
        }, 200);
    };

    const handleChange = (e) => {
        setQuery(e.target.value);
        setIsValidated(false);
        if (hasError) setHasError(false);
    };

    const handleKeyDown = (e) => {
        if (isOpen && suggestions.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor(prev => (prev > 0 ? prev - 1 : prev));
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (cursor >= 0) handleSelect(suggestions[cursor]);
            } else if (e.key === "Escape") {
                setIsOpen(false);
            }
        }
    };

    const handleFocus = () => {
        setHasError(false);
    };

    return (
        <div className="adress-input-and-suggestions">
            <div className={`input-with-icon ${hasError ? "input-error" : ""}`}>
                <div className="input-icon">
                    {icon}
                </div>
                <input
                    className="adress-input"
                    type="text"
                    autoComplete="street-address"
                    placeholder={placeholder}
                    value={query}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown} 
                    onFocus={handleFocus}                   
                />
            </div>

            {hasError && (
                <div className="error-text">
                    Adresse invalide. Veuillez choisir dans la liste.
                </div>
            )}

            {isOpen && suggestions.length > 0 && (
                <ul className="autocomplete-list">
                    {suggestions.map((place, i) => (
                        <li 
                            key={place.id} 
                            ref={el => suggestionRefs.current[i] = el}
                            onMouseDown={() => handleSelect(place)}
                            className={cursor === i ? "active" : ""}
                        >
                            <strong>{place.name}</strong>
                            <small>{place.postcode} {place.city}</small>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
