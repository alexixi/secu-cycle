import Meta from "../components/Meta";
import { useLocalizedPath } from '../i18n/useLang';
import LinkButton from "../components/ui/LinkButton"

export default function ErrorPage() {
    const path = useLocalizedPath();
    return (
        <>
            <Meta title="Page non trouvée | Sécu'Cycle" description="La page que vous recherchez n'existe pas." noindex />
            <div>
                <h1>Page non trouvée (404)</h1>
                <p>La page que vous recherchez n'existe pas.</p>
                <p>Veuillez vérifier l'URL ou revenir à la page d'accueil.</p>
                <LinkButton to={path("home")}>Retour à l'accueil</LinkButton>
            </div>
        </>
    )
}
