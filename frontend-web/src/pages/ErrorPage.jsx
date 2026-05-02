import Meta from "../components/Meta";
import Header from "../components/layout/Header"
import LinkButton from "../components/ui/LinkButton"

export default function ErrorPage() {
    return (
        <>
            <Meta title="Page non trouvée | Sécu'Cycle" description="La page que vous recherchez n'existe pas." noindex />
            <Header page="" />
            <div>
                <h1>Page non trouvée (404)</h1>
                <p>La page que vous recherchez n'existe pas.</p>
                <p>Veuillez vérifier l'URL ou revenir à la page d'accueil.</p>
                <LinkButton to="/">Retour à l'accueil</LinkButton>
            </div>
        </>
    )
}
