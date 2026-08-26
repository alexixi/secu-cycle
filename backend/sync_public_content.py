"""Aligne la FAQ déjà en base sur les textes du code.

`seed_faqs()`, appelé au démarrage depuis `main.py`, ne fait rien si sa table
est non vide : il ne peut donc pas propager une correction de contenu à une
base déjà peuplée. C'est ce que fait ce script, à la demande.

Il est volontairement séparé des seeds. Ceux-ci tournent à chaque démarrage ; les
transformer en upsert écraserait à chaque redéploiement les retouches faites
depuis le dashboard admin.

Les textes doivent rester identiques à ceux codés en dur côté front
(`frontend-web/src/pages/FaqPage.jsx` → `DEFAULT_FAQS`) : c'est le front qui
alimente le pré-rendu react-snap servi aux moteurs de recherche. Une divergence
ferait lire aux crawlers autre chose qu'aux utilisateurs.

Le rapprochement se fait sur la question : ce libellé est donc une clé, le
modifier en base délie l'entrée du code.

Usage :
    python sync_public_content.py --dry-run   # affiche ce qui changerait
    python sync_public_content.py             # applique
"""

import argparse

from database import SessionLocal
from models.faq import Faq
from seed_faqs import DEFAULT_FAQS


def _sync(db, model, defaults, key_field, text_field, extra_new=None):
    """Met à jour les entrées connues, insère les manquantes, renumérote.

    Les entrées ajoutées depuis l'admin ne sont jamais touchées ni supprimées :
    elles sont simplement repoussées après celles portées par le code, pour que
    l'ordre en base corresponde à celui du pré-rendu.
    """
    existing = {getattr(row, key_field): row for row in db.query(model).all()}
    known_keys = {item[key_field] for item in defaults}
    changed = 0

    for index, item in enumerate(defaults):
        key = item[key_field]
        row = existing.get(key)

        if row is None:
            print(f"  + ajout      {key}")
            db.add(model(**{
                key_field: key,
                text_field: item[text_field],
                "position": index,
                **(extra_new or {}),
            }))
            changed += 1
            continue

        if getattr(row, text_field) != item[text_field]:
            print(f"  ~ texte      {key}")
            setattr(row, text_field, item[text_field])
            changed += 1

        if row.position != index:
            row.position = index
            changed += 1

        if getattr(row, "is_published", True) is False:
            print(f"  ! dépubliée en base mais présente dans le pré-rendu : {key}")

    extras = sorted(
        (row for key, row in existing.items() if key not in known_keys),
        key=lambda r: r.position,
    )
    for offset, row in enumerate(extras):
        target = len(defaults) + offset
        if row.position != target:
            row.position = target
            changed += 1
    if extras:
        print(f"  = {len(extras)} entrée(s) hors code conservée(s), placée(s) à la suite")

    return changed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="affiche les changements sans rien écrire",
    )
    args = parser.parse_args()

    db = SessionLocal()
    try:
        print("FAQ :")
        changed = _sync(db, Faq, DEFAULT_FAQS, "question", "answer",
                        extra_new={"is_published": True})

        if args.dry_run:
            db.rollback()
            print(f"\n[dry-run] {changed} changement(s) — rien n'a été écrit.")
        else:
            db.commit()
            print(f"\n{changed} changement(s) appliqué(s).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
