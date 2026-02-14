import "./AdressInput.css";

const adressAutocomplete = (input) => {
    console.log(`Autocomplete for: ${input}`);
}

export default function AdressInput({ placeholder }) {
    return (
        <input
            className="adress-input"
            type="text"
            autocomplete="street-address"
            placeholder={placeholder}
            onChange={e => adressAutocomplete(e.target.value)}
        />
    );
}
