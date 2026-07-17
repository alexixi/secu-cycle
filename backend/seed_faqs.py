"""Seed idempotent de la foire aux questions (FAQ).

Contenu de départ pour la page FAQ dédiée du site public (`/faq`), éditable
ensuite depuis le dashboard admin. Ces mêmes questions/réponses sont codées en
dur côté front (`frontend-web/src/pages/FaqPage.jsx`, `DEFAULT_FAQS`) afin que le
pré-rendu react-snap dispose d'un contenu réel et du balisage JSON-LD `FAQPage`,
même si l'API n'est pas interrogée au moment du build.
"""

from database import SessionLocal
from models.faq import Faq

DEFAULT_FAQS = [
    {
        "question": "Qu'est-ce que Sécu'Cycle ?",
        "answer": (
            "Sécu'Cycle est un service gratuit, composé d'un site web et d'une "
            "application mobile, qui aide les cyclistes à trouver des itinéraires "
            "sécurisés. Plutôt que de proposer le trajet le plus court, Sécu'Cycle "
            "calcule un itinéraire qui privilégie la sécurité selon votre profil, "
            "vos préférences et votre équipement. Le projet a été développé par six "
            "étudiants de l'ENSEIRB-MATMECA (Bordeaux INP) dans le cadre d'un projet "
            "de fin d'année, avec un focus sur la métropole de Bordeaux."
        ),
    },
    {
        "question": "Comment est calculé un itinéraire sécurisé ?",
        "answer": (
            "Sécu'Cycle s'appuie sur un graphe routier construit à partir "
            "d'OpenStreetMap et enrichi de données topographiques de l'IGN (dénivelé) "
            "et de données de trafic. Chaque tronçon reçoit un coût qui tient compte "
            "de la présence de pistes cyclables, du type de route, du trafic "
            "automobile et de la pente. L'itinéraire proposé est celui qui minimise "
            "ce coût global de sécurité, et pas seulement la distance."
        ),
    },
    {
        "question": "Sécu'Cycle est-il gratuit ?",
        "answer": (
            "Oui. Le site web et l'application mobile sont entièrement gratuits et "
            "sans publicité. Sécu'Cycle est un projet étudiant."
        ),
    },
    {
        "question": "Dans quelles villes Sécu'Cycle fonctionne-t-il ?",
        "answer": (
            "Le service est aujourd'hui optimisé pour la métropole de Bordeaux et ses "
            "environs, la zone sur laquelle nous avons affiné les données grâce à "
            "notre connaissance du terrain. La couverture sera étendue à d'autres villes "
            "et régions dans le futur, en fonction des besoins. Actuellement, nous testons "
            "l'ouverture dans la région du Hainaut en Belgique."
        ),
    },
    {
        "question": "Ai-je besoin d'un compte pour utiliser Sécu'Cycle ?",
        "answer": (
            "Vous pouvez calculer un itinéraire sans compte. La création d'un compte "
            "gratuit permet d'enregistrer votre profil et votre équipement, de "
            "conserver l'historique de vos trajets et de personnaliser davantage vos "
            "itinéraires."
        ),
    },
    {
        "question": "Existe-t-il une application mobile ?",
        "answer": (
            "Oui, une application mobile Sécu'Cycle est disponible en complément du "
            "site web. Elle offre une expérience optimisée pour la navigation en "
            "temps réel pendant vos trajets à vélo."
        ),
    },
    {
        "question": "D'où proviennent les données utilisées ?",
        "answer": (
            "Sécu'Cycle combine plusieurs sources ouvertes : OpenStreetMap "
            "(openstreetmap.fr) pour la carte des routes et pistes cyclables, l'IGN "
            "(ign.fr) pour les données topographiques, la Base Adresse Nationale "
            "(adresse.data.gouv.fr) pour les adresses, le projet AVATAR du Cerema "
            "(avatar.cerema.fr) pour le trafic routier, et MapTiler (maptiler.com) "
            "pour l'affichage des fonds de carte."
        ),
    },
    {
        "question": "Comment signaler un problème ou un danger sur un itinéraire ?",
        "answer": (
            "Vous pouvez signaler un danger ou un problème directement depuis "
            "l'application mobile. Ces signalements aident à améliorer la qualité des "
            "itinéraires proposés. Pour toute autre question, contactez-nous à "
            "l'adresse contact@secu-cycle.fr."
        ),
    },
]


def seed_faqs():
    """Insère les questions/réponses par défaut si la table est vide (idempotent)."""
    db = SessionLocal()
    try:
        if db.query(Faq).count() > 0:
            return
        for index, item in enumerate(DEFAULT_FAQS):
            db.add(
                Faq(
                    question=item["question"],
                    answer=item["answer"],
                    position=index,
                    is_published=True,
                )
            )
        db.commit()
    finally:
        db.close()
