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
            "d'OpenStreetMap, enrichi de données topographiques de l'IGN pour le "
            "dénivelé, de l'accidentologie officielle, de l'éclairage public, du "
            "trafic routier en temps réel et de la qualité de l'air. Chaque tronçon "
            "reçoit un score de sécurité sur 10 qui tient compte de la présence "
            "d'aménagements cyclables, du type de route, du revêtement, de "
            "l'éclairage, de la pente, du trafic automobile et des accidents recensés "
            "à proximité. L'itinéraire proposé est celui qui minimise ce coût global "
            "de sécurité, et pas seulement la distance. Le poids relatif de ces "
            "critères s'ajuste selon votre profil et votre équipement."
        ),
    },
    {
        "question": "Sécu'Cycle est-il gratuit ?",
        "answer": (
            "Oui. Le site web et l'application mobile sont entièrement gratuits et "
            "sans publicité. Sécu'Cycle est un projet étudiant à but non lucratif."
        ),
    },
    {
        "question": "Dans quelles villes Sécu'Cycle fonctionne-t-il ?",
        "answer": (
            "Le service couvre Bordeaux Métropole et le sud de Bordeaux, ainsi que "
            "Lille, Tournai, Mouscron et leurs communes environnantes, dans la zone "
            "transfrontalière entre la France et la Belgique. Ce sont les zones sur "
            "lesquelles nous avons affiné les données grâce à notre connaissance du "
            "terrain. La couverture peut être étendue à d'autres communes ; en dehors "
            "de la zone couverte, aucun itinéraire ne peut être calculé."
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
            "Sécu'Cycle combine une quinzaine de jeux de données, très "
            "majoritairement ouverts : OpenStreetMap (ODbL) pour le réseau routier, "
            "les aménagements cyclables, le revêtement et l'éclairage ; l'IGN pour le "
            "dénivelé ; le jeu « Accidents de vélo » dérivé des fichiers BAAC de "
            "l'ONISR en France et les données de Statbel en Belgique pour "
            "l'accidentologie ; les portails open data de Bordeaux Métropole, de "
            "l'Eurométropole de Strasbourg, de Rennes Métropole et de Nantes "
            "Métropole pour le trafic en temps réel ; les flux GBFS de neuf systèmes "
            "de vélos en libre-service ; l'indice européen de qualité de l'air du "
            "service Copernicus (CAMS), complété par le World Air Quality Index ; la "
            "Base Adresse Nationale pour les adresses françaises ; et MapTiler pour "
            "les fonds de carte et le géocodage hors de France. Le détail de chaque "
            "source, son usage, sa licence et son producteur sont listés sur la page "
            "Sources des données : secu-cycle.fr/donnees"
        ),
    },
    {
        "question": "Les données d'accidents sont-elles fiables ?",
        "answer": (
            "Elles proviennent des registres officiels : les fichiers BAAC de l'ONISR "
            "en France, les données géolocalisées de Statbel en Belgique. Ces "
            "registres ne recensent toutefois que les accidents corporels déclarés "
            "aux forces de l'ordre : les chutes sans tiers y sont très largement "
            "sous-représentées, et le géocodage est plus lacunaire hors "
            "agglomération. Nous en tenons compte dans le calcul : le malus "
            "d'accidentologie est plafonné à 1,5 point sur 10 et reste strictement "
            "soustractif, si bien qu'un tronçon sans accident recensé conserve sa "
            "note d'infrastructure et qu'une zone mal couverte par les données n'est "
            "jamais avantagée. Un tronçon sans accident recensé n'est pas pour autant "
            "un tronçon sûr."
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
