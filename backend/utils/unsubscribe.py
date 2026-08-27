"""Jetons de désabonnement aux récapitulatifs.

Un jeton HMAC opaque, et non un JWT tiré de `utils.security`, pour trois raisons
qui se renforcent.

**Un désabonnement doit toujours fonctionner.** Un JWT sans `exp` serait un jeton
éternel dans une boîte mail ; avec `exp`, un message rouvert deux ans plus tard ne
permettrait plus de se désabonner — exactement au moment où l'on en a besoin. Ici,
le jeton ne périme pas, et la révocation passe par un compteur en base.

**Il ne doit pas dépendre de la rotation de `SECRET_KEY`.** Changer cette clé est
une opération de sécurité normale pour des JWT d'authentification ; elle
invaliderait au passage tous les liens de désabonnement déjà partis. D'où un
secret dérivé, et une variable dédiée pour le figer si besoin.

**Il doit être testable.** `utils.security` lève à l'import quand `SECRET_KEY` est
absente : un module qui en dépendrait rendrait `make test` inexécutable sans
`.env`, ce qu'interdit le README de `backend/tests/`. Le secret est donc un
paramètre, jamais une lecture d'environnement faite ici.

Enfin, un jeton d'une autre forme que les JWT du projet ne peut structurellement
pas être accepté par `get_current_user` : se tromper de jeton n'ouvre pas de
session.
"""

import base64
import hashlib
import hmac

# 16 octets, soit 128 bits : hors de portée d'une recherche exhaustive, et le
# lien reste assez court pour survivre au retour à la ligne des clients mail.
TAILLE_SIGNATURE = 16


def derive_secret(secret_key: str) -> bytes:
    """Dérive le secret de signature depuis la clé applicative.

    Séparation de domaine : la même clé sert aux JWT, et deux usages distincts ne
    doivent jamais partager le même matériel cryptographique.
    """
    return hmac.new(secret_key.encode(), b"recap-unsub", hashlib.sha256).digest()


def make_token(user_id: int, version: int, secret: bytes) -> str:
    """Jeton de désabonnement pour un utilisateur, à une version donnée.

    :param version: `users.recap_unsub_version`. L'incrémenter invalide d'un coup
        tous les liens émis auparavant.
    """
    message = f"{user_id}:{version}".encode()
    signature = hmac.new(secret, message, hashlib.sha256).digest()[:TAILLE_SIGNATURE]
    return base64.urlsafe_b64encode(signature).rstrip(b"=").decode()


def check_token(user_id: int, version: int, token: str, secret: bytes) -> bool:
    """Le jeton correspond-il bien à cet utilisateur et à cette version ?

    Comparaison en temps constant, et toute anomalie de forme est un simple
    `False` : cette fonction est appelée depuis un endpoint public, elle ne doit
    jamais lever.
    """
    if not token or not isinstance(token, str):
        return False
    try:
        attendu = make_token(user_id, version, secret)
    except (TypeError, ValueError):
        return False
    return hmac.compare_digest(attendu, token)
