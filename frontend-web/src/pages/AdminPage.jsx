import Meta from "../components/Meta";
import Header from "../components/layout/Header";

export default function AdminPage() {
  return (
    <>
    <Meta title="Admin | Sécu'Cycle" description="Page d'administration de Sécu'Cycle" noindex />
    <Header page="admin" />
    <div>
      <h1>Page d'administration</h1>
      <p>Cette page est réservée aux administrateurs pour consulter les statistiques d'utilisation.</p>
    </div>
    </>
  )
}
