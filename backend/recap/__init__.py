"""Récapitulatifs périodiques d'activité envoyés par e-mail.

Le découpage des modules suit une seule contrainte, mais elle est structurante :
`backend/tests/` n'accepte que des fonctions pures (importer `main` chargerait
environ un gigaoctet de graphe), et `preview_emails.py` promet de rendre les
gabarits sans base ni réseau. D'où trois couches nettement séparées :

    periodes.py   quelle période est due, et quand          — pur, testé
    requetes.py   SQL : destinataires et agrégats           — impur
    stats.py      chiffres bruts → chiffres présentables    — pur, testé
    runner.py     réservation, envoi, traçabilité           — impur

Tout ce qui décide et tout ce qui met en forme est testable ; seul ce qui touche
la base ou Resend ne l'est pas.
"""
