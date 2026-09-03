import Meta from "../components/Meta";
import { useTranslation } from "react-i18next";
import { useLocalizedPath } from '../i18n/useLang';
import LinkButton from "../components/ui/LinkButton"

export default function ErrorPage() {
    const { t } = useTranslation();
    const path = useLocalizedPath();
    return (
        <>
            <Meta title={t('erreur404.titrePage')} description={t('erreur404.metaDescription')} noindex />
            <div>
                <h1>{t('erreur404.h1')}</h1>
                <p>{t('erreur404.introuvable')}</p>
                <p>{t('erreur404.verifier')}</p>
                <LinkButton to={path("home")}>{t('erreur404.retour')}</LinkButton>
            </div>
        </>
    )
}
