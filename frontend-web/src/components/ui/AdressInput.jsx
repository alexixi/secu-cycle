import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useRef } from "react";
import { searchAddressAutocomplete, getCoordinatesFromAddress } from "../../services/geocodingService";
import { isCovered } from "../../services/apiBack";
import { trackEvent } from "../../services/analytics";
import { useAuth } from "../../context/AuthContext";
import "./AdressInput.css";
import "./Input.css"

export default function AdressInput({ id, placeholder, onSelect, defaultValue, autoFocus = false, showFavorite = false, checkCoverage = false, children: icon }) {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [outOfZone, setOutOfZone] = useState(false);
    const [isValidated, setIsValidated] = useState(false);
    const [noResults, setNoResults] = useState(false);
    const [cursor, setCursor] = useState(-1);

    const suggestionRefs = useRef([]);

    const getFavorites = () => {
        if (!user) return [];
        const favs = [];

        if (user.home_address) {
            favs.push({
                id: "fav-home",
                name: t('adresses.domicile'),
                display_name: user.home_address,
                isFavorite: true
            });
        }

        if (user.work_address) {
            favs.push({
                id: "fav-work",
                name: t('adresses.travail'),
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
                setNoResults(results.length === 0);
                setIsOpen(true);
                setCursor(-1);
            } else if (!showFavorite && (!query || query.length < 3)) {
                setSuggestions([]);
                setNoResults(false);
                setIsOpen(false);
            }
        }, 400);
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

    const warnIfOutOfZone = async ({ lat, lon, city, postcode }) => {
        if (!checkCoverage) return;
        const covered = await isCovered(lat, lon);
        setOutOfZone(!covered);
        if (!covered) {
            trackEvent("address_out_of_zone", { city: city || "inconnue", postcode: postcode || "" });
        }
    };

    const handleSelect = async (place) => {
        if (!place) {
            setQuery("");
            setSuggestions([]);
            setIsOpen(false);
            setHasError(true);
            setIsValidated(false);
            return;
        }
        setQuery(place.display_name);
        setSuggestions([]);
        setNoResults(false);
        setIsOpen(false);
        setHasError(false);
        setOutOfZone(false);
        setIsValidated(true);

        if (place.isFavorite) {
            const coords = await getCoordinatesFromAddress(place.display_name);

            if (coords) {
                onSelect(coords);
                warnIfOutOfZone(coords);
            } else {
                setHasError(true);
            }
        } else {
            onSelect({
                lat: parseFloat(place.lat),
                lon: parseFloat(place.lon),
                name: place.display_name,
                city: place.city,
                postcode: place.postcode
            });
            warnIfOutOfZone(place);
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
        if (outOfZone) setOutOfZone(false);

        if (e.target.value.trim() === "") {
            onSelect(null);
            setIsValidated(true);
            setSuggestions([]);
            setNoResults(false);
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
            <div className={`input-with-icon ${hasError ? "input-error" : ""} ${outOfZone ? "input-warning" : ""}`}>
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
                    {t('adresses.adresseInvalide')}
                </div>
            )}

            {outOfZone && !hasError && (
                <div className="warning-text">
                    {t('adresses.adresseHorsZone')}
                </div>
            )}

            {isOpen && noResults && suggestions.length === 0 && (
                <ul className="autocomplete-list">
                    <li className="autocomplete-empty" aria-disabled="true">
                        {t('adresses.aucunResultat')}
                    </li>
                </ul>
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
