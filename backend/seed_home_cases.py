"""Seed idempotent des cases de la page d'accueil.

Reprend le contenu historiquement codé en dur dans le front public
(`frontend-web/src/pages/HomePage.jsx`). Le texte est en clair : les liens et
emphases d'origine sont aplatis, les URLs conservées entre parenthèses.
"""

from database import SessionLocal
from models.home_case import HomeCase

DEFAULT_HOME_CASES = [
    {
        "title": "Qu'est-ce que Sécu'Cycle ?",
        "text": (
            "Sécu'Cycle est un projet développé par 6 étudiants de l'ENSEIRB-MATMECA "
            "dans le cadre d'un PFA. L'objectif de ce projet est de créer un site web "
            "et une application mobile qui aide les cyclistes à trouver des itinéraires "
            "sécurisés en fonction de leurs préférences, de leur profil et de leur "
            "équipement. Nous nous sommes focalisés sur la zone de Bordeaux et de notre "
            "campus universitaire pour affiner les résultats avec nos connaissances "
            "locales du terrain."
        ),
    },
    {
        "title": "Problématiques",
        "text": (
            "Dans les nombreux freins à l'utilisation du vélo, la sécurité est un "
            "facteur déterminant. Les cyclistes sont souvent confrontés à des routes "
            "dangereuses ou à un manque d'infrastructures adaptées. Sécu'Cycle répond "
            "à ces problématiques en proposant des itinéraires optimisés pour la "
            "sécurité, en tenant compte des préférences et du profil de chaque "
            "utilisateur."
        ),
    },
    {
        "title": "Pourquoi Sécu'Cycle ?",
        "text": (
            "Sécu'Cycle a pour but de palier ces problèmes. Il s'inscrit dans une "
            "démarche de promotion des mobilités douces et de la sécurité des "
            "cyclistes. En fournissant des itinéraires adaptés, Sécu'Cycle vise à "
            "encourager davantage de personnes à adopter le vélo comme moyen de "
            "transport quotidien à la place de la voiture ou des transports en commun."
        ),
    },
    {
        "title": "Sources des données",
        "text": (
            "Sécu'Cycle combine différentes sources de données, principalement les "
            "données d'OpenStreetMap (openstreetmap.fr) pour la carte des routes et "
            "pistes cyclables. Nous ajoutons à cette carte des données topographiques "
            "de l'IGN (ign.fr). Pour la complétion des adresses françaises nous "
            "utilisons la BAN (Base Adresse Nationale, adresse.data.gouv.fr), complétée "
            "par MapTiler (maptiler.com) pour les lieux et les adresses situés hors de "
            "France, en Belgique notamment. Pour avoir des données de "
            "trafic de la circulation routière nous utilisons l'open data de Bordeaux "
            "Métropole (opendata.bordeaux-metropole.fr), qui publie l'état des axes en "
            "temps réel. Enfin pour l'affichage de la carte, "
            "nous utilisons les tuiles cartographiques de MapTiler, elles aussi "
            "basées sur les données d'OpenStreetMap."
        ),
    },
]


def seed_home_cases():
    """Insère les cases par défaut si la table est vide (idempotent)."""
    db = SessionLocal()
    try:
        if db.query(HomeCase).count() > 0:
            return
        for index, case in enumerate(DEFAULT_HOME_CASES):
            db.add(HomeCase(title=case["title"], text=case["text"], position=index))
        db.commit()
    finally:
        db.close()
