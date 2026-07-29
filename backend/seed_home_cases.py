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
            "équipement. Nous avons d'abord affiné les résultats sur la zone de Bordeaux "
            "et de notre campus universitaire grâce à nos connaissances locales du "
            "terrain, et la couverture s'étend désormais à Lille, Tournai et leurs "
            "environs."
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
            "Sécu'Cycle croise une quinzaine de jeux de données, très majoritairement "
            "ouverts : OpenStreetMap pour le réseau routier, les aménagements "
            "cyclables, le revêtement et l'éclairage, l'IGN pour le dénivelé, les "
            "registres officiels d'accidentologie français et belge, le trafic en "
            "temps réel publié par quatre métropoles, la disponibilité des vélos en "
            "libre-service au format GBFS, l'indice européen de qualité de l'air du "
            "service Copernicus, et la Base Adresse Nationale pour les adresses. Les "
            "fonds de carte sont fournis par MapTiler, eux aussi construits sur les "
            "données d'OpenStreetMap."
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
