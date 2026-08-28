import { useTranslation } from "react-i18next";
import { useState } from "react";
import Button from "../ui/Button";
import { AiFillPlusCircle } from "react-icons/ai";
import { FaCheckCircle, FaBolt } from "react-icons/fa";
import "../ui/Input.css";
import "../ui/Form.css";
import "./Onboarding.css";

const BIKE_TYPES = ["ville", "route", "vtt"];

export default function StepBikes({ addedBikes, onAddBike, onFinish, isFinishing }) {
    const { t } = useTranslation('auth');
    const [name, setName] = useState("");
    const [type, setType] = useState("ville");
    const [isElectric, setIsElectric] = useState(false);
    const [nameError, setNameError] = useState(false);
    const [addError, setAddError] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async (e) => {
        e.preventDefault();
        let finalName = name.trim();
        if (finalName === "") {
            const sameTypeCount = addedBikes.filter((b) => b.type === type).length;
            finalName = t(`velo.${type}`) + (sameTypeCount === 0 ? "" : ` ${sameTypeCount + 1}`);
        } else if (finalName.length < 3 || finalName.length > 30) {
            setNameError(true);
            return;
        }

        setIsAdding(true);
        setAddError(false);
        try {
            await onAddBike({ name: finalName, type, isElectric });
            setName("");
            setType("ville");
            setIsElectric(false);
            setNameError(false);
        } catch {
            setAddError(true);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="form onboarding-form">
            <h2>{t('onboarding.velos.h2')}</h2>
            <p className="onboarding-subtitle">
                Ajoutez vos vélos pour des itinéraires adaptés. Facultatif&nbsp;— vous pourrez en ajouter plus tard depuis votre profil.
            </p>

            {addedBikes.length > 0 && (
                <ul className="onboarding-bike-list">
                    {addedBikes.map((bike) => (
                        <li key={bike.id} className="onboarding-bike-card">
                            <div className="onboarding-bike-info">
                                <span className="onboarding-bike-name">{bike.name}</span>
                                <span className="onboarding-bike-type">
                                    {BIKE_TYPES.includes(bike.type) ? t(`velo.${bike.type}`) : bike.type}
                                    {bike.is_electric ? t('velo.electriqueSuffixePuce') : ""}
                                </span>
                            </div>
                            <FaCheckCircle className="onboarding-bike-check" />
                        </li>
                    ))}
                </ul>
            )}

            <form onSubmit={handleAdd}>
                <div className={`input-group ${nameError ? "input-error" : ""}`}>
                    <label htmlFor="bikeName">{t('velo.nom')}</label>
                    <input
                        className="input"
                        type="text"
                        id="bikeName"
                        placeholder={t('velo.nomPlaceholder')}
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            if (nameError) setNameError(false);
                        }}
                    />
                    {nameError && (
                        <div className="error-text">{t('velo.nomInvalide')}</div>
                    )}
                </div>

                <div className="input-group">
                    <label htmlFor="bikeType">{t('velo.type')}</label>
                    <select className="input" id="bikeType" value={type} onChange={(e) => setType(e.target.value)}>
                        {BIKE_TYPES.map((valeur) => (
                            <option key={valeur} value={valeur}>{t(`velo.${valeur}`)}</option>
                        ))}
                    </select>
                </div>

                <div className="input-group">
                    <div className="form-group-checkbox">
                        <label htmlFor="bikeIsElectric" style={{ margin: 0 }}>
                            <FaBolt /> Électrique
                        </label>
                        <input
                            type="checkbox"
                            id="bikeIsElectric"
                            checked={isElectric}
                            onChange={(e) => setIsElectric(e.target.checked)}
                        />
                    </div>
                </div>

                {addError && <p className="error-text">{t('onboarding.velos.erreurAjout')}</p>}

                <Button type="submit" disabled={isAdding}>
                    <AiFillPlusCircle size={13} /> {isAdding ? t('onboarding.velos.ajout') : t('velo.ajouterCeVelo')}
                </Button>
            </form>

            <div className="onboarding-footer">
                <Button type="button" className="active" onClick={onFinish} disabled={isFinishing}>
                    <FaCheckCircle /> {isFinishing ? "…" : t('actions.terminer')}
                </Button>
            </div>
        </div>
    );
}
