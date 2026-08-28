"""Accès aux données du récapitulatif.

Deux règles gouvernent tout ce fichier.

**La source est `routes`, jamais `user_history`.** L'historique est supprimable
par l'utilisateur (`DELETE /history/`) alors que les trajets, eux, restent : un
récapitulatif bâti sur l'historique donnerait des totaux différents de ceux des
badges, et diminuerait sans raison apparente pour qui a fait le ménage.

**Toujours borner sur `completed_at`.** Un calcul d'itinéraire insère 2 à 3
variantes par recherche et seule celle réellement parcourue est complétée : sans
ce filtre, les distances seraient multipliées par près de trois. Le comparateur
s'en charge de lui-même — toute comparaison avec `NULL` vaut `UNKNOWN` — mais
c'est un point trop coûteux à découvrir en production pour ne pas être écrit.
"""

from sqlalchemy import bindparam, text

# Agrégats de la période, comparaison avec la précédente, et sélection des
# destinataires, en une seule requête. Les utilisateurs sans trajet terminé sur la
# période ne produisent aucune ligne dans le CTE : la jointure les écarte
# d'elle-même, ce qui règle le cas « rien à raconter » sans une ligne de code.
_DESTINATAIRES = text("""
WITH periode AS (
    SELECT r.user_id,
           count(*)                                        AS trajets,
           COALESCE(sum(r.distance_km), 0)                 AS km,
           COALESCE(sum(r.duration_min), 0)                AS minutes,
           COALESCE(sum(r.elevation_gain_m), 0)            AS denivele,
           count(r.elevation_gain_m)                       AS trajets_avec_denivele,
           max(r.distance_km)                              AS plus_long_km,
           count(*) FILTER (WHERE r.route_type = 'safe')   AS trajets_surs,
           count(*) FILTER (WHERE r.was_rainy)             AS trajets_pluie
    FROM routes r
    WHERE r.user_id IS NOT NULL
      AND r.completed_at >= :debut AND r.completed_at < :fin
    GROUP BY r.user_id
),
precedente AS (
    SELECT r.user_id, COALESCE(sum(r.distance_km), 0) AS km
    FROM routes r
    WHERE r.user_id IS NOT NULL
      AND r.completed_at >= :debut_precedent AND r.completed_at < :debut
    GROUP BY r.user_id
)
SELECT u.id, u.email, u.first_name, u.language, u.recap_unsub_version,
       p.trajets, p.km, p.minutes, p.denivele, p.trajets_avec_denivele,
       p.plus_long_km, p.trajets_surs, p.trajets_pluie,
       COALESCE(pr.km, 0) AS km_precedent
FROM periode p
JOIN users u ON u.id = p.user_id
LEFT JOIN precedente pr ON pr.user_id = p.user_id
WHERE u.recap_emails
  AND u.is_verified
  AND NOT u.is_banned
  AND (
      NOT :exclure_servis
      OR NOT EXISTS (
          SELECT 1 FROM recap_sends s
          WHERE s.user_id = u.id AND s.kind = :genre AND s.period_start = :periode
      )
  )
ORDER BY u.id
LIMIT :lot
""")

_BADGES = text("""
SELECT ub.user_id, b.code, b.name, b.description
FROM user_badges ub
JOIN badges b ON b.id = ub.badge_id
WHERE ub.user_id IN :ids
  AND ub.obtained_at >= :debut AND ub.obtained_at < :fin
ORDER BY ub.user_id, ub.obtained_at, b.id
""").bindparams(bindparam("ids", expanding=True))


def destinataires(db, genre, periode, debut, fin, debut_precedent, lot,
                  exclure_servis: bool = True):
    """Prochain lot de destinataires, avec leurs agrégats.

    Un lot borné plutôt que la liste entière : la campagne avance par tranches et
    rend la main entre chacune, sur un serveur qui ne dispose que d'un worker et
    qui doit continuer à calculer des itinéraires pendant ce temps.

    :param genre: `monthly` ou `yearly`.
    :param periode: date de début de la période, telle qu'elle est stockée dans
        `recap_sends.period_start`.
    :param exclure_servis: écarte ceux qui ont déjà une ligne pour la période.
        C'est ce qui fait avancer la campagne d'un lot à l'autre, et l'envoi ne
        doit jamais s'en passer. La prévisualisation administrateur, elle, met ce
        drapeau à `False` : elle ne consomme rien, et sert précisément à relire ce
        qui vient d'être envoyé.
    """
    lignes = db.execute(_DESTINATAIRES, {
        "debut": debut,
        "fin": fin,
        "debut_precedent": debut_precedent,
        "genre": genre,
        "periode": periode,
        "lot": lot,
        "exclure_servis": exclure_servis,
    }).mappings().all()
    return [dict(ligne) for ligne in lignes]


def badges_par_utilisateur(db, user_ids, debut, fin) -> dict:
    """Badges débloqués pendant la période, groupés par utilisateur.

    `obtained_at` date l'évaluation du badge, faite à l'arrivée d'un trajet, et
    non le trajet qui l'a déclenché — d'où la formulation « badges débloqués en
    juillet » dans le gabarit. Un badge tombe toujours dans la même transaction
    qu'un trajet terminé : un utilisateur présent ici l'est forcément aussi dans
    la requête principale.
    """
    if not user_ids:
        return {}

    groupes: dict = {}
    lignes = db.execute(_BADGES, {"ids": list(user_ids), "debut": debut, "fin": fin})
    for ligne in lignes.mappings():
        groupes.setdefault(ligne["user_id"], []).append({
            # `code` est la clé de traduction, `name` et `description` le repli
            # pour un badge que le catalogue ne connaîtrait pas encore.
            "code": ligne["code"],
            "name": ligne["name"],
            "description": ligne["description"],
        })
    return groupes
