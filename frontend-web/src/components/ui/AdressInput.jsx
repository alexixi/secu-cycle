import React, { useState, useEffect, useRef } from "react";
import { searchAddressAutocomplete, getCoordinatesFromAddress } from "../../services/geocodingService";
import { useAuth } from "../../context/AuthContext";
import "./AdressInput.css";
import "./Input.css"

export default function AdressInput({ id, placeholder, onSelect, defaultValue, autoFocus = false, showFavorite = false, children: icon }) {
    const { user } = useAuth();
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isValidated, setIsValidated] = useState(false);
    const [cursor, setCursor] = useState(-1);

    const suggestionRefs = useRef([]);

    const getFavorites = () => {
        if (!user) return [];
        const favs = [];

        if (user.home_address) {
            favs.push({
                id: "fav-home",
                name: "🏠 Domicile",
                display_name: user.home_address,
                isFavorite: true
            });
        }

        if (user.work_address) {
            favs.push({
                id: "fav-work",
                name: "💼 Travail",
                display_name: user.work_address,
                isFavorite: true
            });
        }
        return favs;
    };

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
            } else if (!showFavorite && (!query || query.length < 3)) {
                setSuggestions([]);
                setIsOpen(false);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [query, isValidated, showFavorite]);

    useEffect(() => {
        if (cursor >= 0 && suggestionRefs.current[cursor]) {
            suggestionRefs.current[cursor].scrollIntoView({
                behavior: "smooth",
                block: "nearest",
            });
        }
    }, [cursor]);

    const handleSelect = async (place) => {
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

        if (place.isFavorite) {
            const coords = await getCoordinatesFromAddress(place.display_name);

            if (coords) {
                onSelect(coords);
            } else {
                setHasError(true);
            }
        } else {
            onSelect({
                lat: parseFloat(place.lat),
                lon: parseFloat(place.lon),
                name: place.display_name
            });
        }
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

        if (e.target.value.trim() === "") {
            onSelect(null);
            setIsValidated(true);
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        if (showFavorite && e.target.value.length < 3) {
            setSuggestions(getFavorites());
            setIsOpen(true);
        }
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
        if (showFavorite && (!query || query.length < 3)) {
            setSuggestions(getFavorites());
            setIsOpen(true);
        } else if (query && query.length >= 3) {
            setIsOpen(true);
        }
    };

    return (
        <div className="adress-input-and-suggestions">
            <div className={`input-with-icon ${hasError ? "input-error" : ""}`}>
                <label htmlFor={id} className="input-icon">
                    {icon}
                </label>
                <input
                    id={id}
                    className="input"
                    type="text"
                    autoComplete="street-address"
                    placeholder={placeholder}
                    value={query}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    autoFocus={autoFocus}
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
