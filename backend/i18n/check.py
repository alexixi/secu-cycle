"""Vérification de parité des catalogues, exécutable sans pytest.

    python -m i18n.check

Sert de filet minimal là où la suite de tests n'est pas installée — par exemple
appelé depuis entrypoint.sh pour faire échouer le démarrage plutôt que de servir
une production à moitié traduite. La défaillance que l'on cherche à rendre
bruyante est silencieuse par nature : une clé absente se voit servie telle
quelle, sans exception ni code d'erreur.
"""

import re
import sys

from i18n.catalog import CATALOGS
from i18n.negotiation import DEFAULT_LOCALE, SUPPORTED

_PLACEHOLDER = re.compile(r"\{(\w+)")


def verifier() -> list[str]:
    """Renvoie la liste des anomalies. Vide = catalogues cohérents."""
    anomalies: list[str] = []
    reference = CATALOGS.get(DEFAULT_LOCALE, {})

    for locale in SUPPORTED:
        if locale == DEFAULT_LOCALE:
            continue
        autre = CATALOGS.get(locale, {})

        for cle in sorted(set(reference) - set(autre)):
            anomalies.append(f"{locale}.json : clé absente — {cle}")
        for cle in sorted(set(autre) - set(reference)):
            anomalies.append(f"{locale}.json : clé sans équivalent {DEFAULT_LOCALE} — {cle}")

        for cle in sorted(set(reference) & set(autre)):
            attendus = set(_PLACEHOLDER.findall(reference[cle]))
            trouves = set(_PLACEHOLDER.findall(autre[cle]))
            if attendus != trouves:
                anomalies.append(
                    f"{locale}.json : paramètres divergents pour {cle} — "
                    f"{DEFAULT_LOCALE}{sorted(attendus)} vs {locale}{sorted(trouves)}"
                )

    return anomalies


def main() -> int:
    anomalies = verifier()
    if anomalies:
        print(f"Catalogues incohérents : {len(anomalies)} anomalie(s).", file=sys.stderr)
        for ligne in anomalies:
            print(f"  {ligne}", file=sys.stderr)
        return 1

    total = len(CATALOGS.get(DEFAULT_LOCALE, {}))
    print(f"Catalogues cohérents : {total} clé(s) × {len(SUPPORTED)} langue(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
