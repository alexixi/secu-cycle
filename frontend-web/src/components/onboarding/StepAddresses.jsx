import { useTranslation } from "react-i18next";
import AdressInput from "../ui/AdressInput";
import StepFooter from "./StepFooter";
import { FaHome } from "react-icons/fa";
import { MdOutlineWork } from "react-icons/md";
import "../ui/Form.css";
import "./Onboarding.css";

export default function StepAddresses({ home, setHome, work, setWork, onNext, onSkip, isLoading }) {
    const { t } = useTranslation('auth');
    return (
        <div className="form onboarding-form">
            <h2>{t('onboarding.adresses.h2')}</h2>
            <p className="onboarding-subtitle">
                {t('onboarding.adresses.intro')}
            </p>

            <div className="input-group">
                <label htmlFor="home-address">{t('adresses.domicile')}</label>
                <AdressInput
                    id="home-address"
                    placeholder={t('adresses.labelDomicile')}
                    defaultValue={home}
                    onSelect={(address) => setHome(address?.name || "")}
                >
                    <FaHome />
                </AdressInput>
            </div>

            <div className="input-group">
                <label htmlFor="work-address">{t('adresses.travail')}</label>
                <AdressInput
                    id="work-address"
                    placeholder={t('adresses.labelTravail')}
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
