"""Jetons de désabonnement.

Ce jeton protège une action publique, sans authentification : le faire valider
trop largement laisserait n'importe qui désabonner n'importe qui, et le faire
valider trop étroitement priverait quelqu'un du droit de partir.

Ce fichier vérifie au passage que le module ne dépend d'aucune variable
d'environnement — il reçoit son secret en paramètre. Sans cela, importer
`utils.security` ferait échouer toute la suite de tests en l'absence de `.env`.
"""

from utils.unsubscribe import check_token, derive_secret, make_token

SECRET = derive_secret("clef-de-test-sans-valeur")
AUTRE_SECRET = derive_secret("une-autre-clef")


def test_un_jeton_valide_est_accepte():
    assert check_token(42, 0, make_token(42, 0, SECRET), SECRET)


def test_le_jeton_est_stable():
    """Deux appels donnent le même lien : un mail réémis reste cohérent."""
    assert make_token(42, 0, SECRET) == make_token(42, 0, SECRET)


def test_le_jeton_d_un_autre_utilisateur_est_refuse():
    """Le cas qui compte : on ne désabonne pas son voisin."""
    assert not check_token(43, 0, make_token(42, 0, SECRET), SECRET)


def test_une_autre_version_est_refusee():
    """Incrémenter `recap_unsub_version` invalide les liens déjà envoyés."""
    assert not check_token(42, 1, make_token(42, 0, SECRET), SECRET)


def test_un_autre_secret_est_refuse():
    assert not check_token(42, 0, make_token(42, 0, AUTRE_SECRET), SECRET)


def test_les_jetons_mal_formes_sont_refuses_sans_lever():
    """L'endpoint est public : aucune entrée ne doit produire d'exception."""
    bon = make_token(42, 0, SECRET)
    for mauvais in (None, "", "   ", bon[:-2], bon + "xx", "pas du base64 !", "=" * 22, 12345, []):
        assert not check_token(42, 0, mauvais, SECRET)


def test_le_jeton_ne_contient_rien_de_lisible():
    """Ni adresse, ni identifiant en clair : un lien fuité ne dit rien de plus."""
    jeton = make_token(42, 0, SECRET)
    assert "42" not in jeton
    assert "@" not in jeton


def test_le_jeton_passe_dans_une_url_sans_encodage():
    """base64url sans remplissage : aucun caractère à échapper dans un lien mail."""
    jeton = make_token(123456, 7, SECRET)
    assert "=" not in jeton
    assert "+" not in jeton and "/" not in jeton


def test_deux_clefs_applicatives_donnent_deux_secrets():
    assert SECRET != AUTRE_SECRET
