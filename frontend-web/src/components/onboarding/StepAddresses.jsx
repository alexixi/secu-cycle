import AdressInput from "../ui/AdressInput";
import StepFooter from "./StepFooter";
import { FaHome } from "react-icons/fa";
import { MdOutlineWork } from "react-icons/md";
import "../ui/Form.css";
import "./Onboarding.css";

export default function StepAddresses({ home, setHome, work, setWork, onNext, onSkip, isLoading }) {
    return (
        <div className="form onboarding-form">
            <h2>Vos adresses</h2>
            <p className="onboarding-subtitle">
                Enregistrez votre domicile et votre travail pour des itinéraires plus rapides. Facultatif.
            </p>

            <div className="input-group">
                <label htmlFor="home-address">Domicile</label>
                <AdressInput
                    id="home-address"
                    placeholder="Adresse du domicile"
                    defaultValue={home}
                    onSelect={(address) => setHome(address?.name || "")}
                >
                    <FaHome />
                </AdressInput>
            </div>

            <div className="input-group">
                <label htmlFor="work-address">Travail</label>
                <AdressInput
                    id="work-address"
                    placeholder="Adresse du travail"
                    defaultValue={work}
                    onSelect={(address) => setWork(address?.name || "")}
                >
                    <MdOutlineWork />
                </AdressInput>
            </div>

            <StepFooter onNext={onNext} onSkip={onSkip} isLoading={isLoading} />
        </div>
    );
}
