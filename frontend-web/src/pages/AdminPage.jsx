import Header from "../components/layout/Header";

export default function AdminPage() {
  return (
    <>
    <Header page="admin" />
    <div>
      <h1>Page d'administration</h1>
      <p>Cette page est réservée aux administrateurs pour consulter les statistiques d'utilisation.</p>
    </div>
    </>
  )
}
