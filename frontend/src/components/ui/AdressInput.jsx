import React, { useState, useEffect } from "react";
import { searchAddressAutocomplete } from "../../services/geocodingService";
import "./AdressInput.css";

export default function AdressInput({ placeholder, onSelect, defaultValue, children: icon }) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (defaultValue !== undefined) {
            setQuery(defaultValue);
        }
    }, [defaultValue]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query && query !== defaultValue && query.length >= 3) {
                const results = await searchAddressAutocomplete(query);
                setSuggestions(results);
                setIsOpen(true);
            } else {
                setSuggestions([]);
                setIsOpen(false);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [query, defaultValue]);


    const handleSelect = (place) => {
        if (place.id === "no-result") {
            setQuery("");
            setSuggestions([]);
            setIsOpen(false);
            return;
        }
        setQuery(place.display_name);
        setSuggestions([]);
        setIsOpen(false);

        onSelect({
            lat: parseFloat(place.lat),
            lon: parseFloat(place.lon),
            name: place.display_name
        });
    };

    return (
        <div className="adress-input-and-suggestions">
            <div className="input-with-icon">
                <div className="input-icon">
                    {icon}
                </div>
                <input
                    className="adress-input"
                    type="text"
                    autoComplete="street-address"
                    placeholder={placeholder}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
            </div>
            {isOpen && suggestions.length > 0 && (
                <ul className="autocomplete-list">
                    {suggestions.map((place) => (
                        <li key={place.id} onClick={() => handleSelect(place)}>
                            <strong>{place.name}</strong>
                            <small>{place.postcode} {place.city}</small>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
