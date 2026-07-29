# Référencer Sécu'Cycle comme réutilisation de données ouvertes

Textes pour inscrire Sécu'Cycle dans les catalogues de réutilisations
des portails open data.

---

## 1. Ce que Sécu'Cycle réutilise réellement

Relevé dans le code, pas dans la plaquette. Toute description publiée doit s'en tenir à ce tableau.

| Source | Usage | Licence / cadre | Référence code |
| --- | --- | --- | --- |
| OpenStreetMap (Overpass) | graphe routier, aménagements cyclables, itinéraires cyclables balisés (relations `route=bicycle` : véloroutes, EuroVelo, RAVeL, réseaux express vélo), revêtement, éclairage, POI | ODbL | `backend/graph/builder.py`, `graph/veloroutes.py`, `pois/sync.py` |
| IGN — altimétrie | dénivelé de chaque tronçon | Licence Ouverte | `backend/graph/elevation.py` |
| « Accidents de vélo » (dérivé BAAC/ONISR, publié par Koumoul) | malus accidentologie sur les arêtes, France | Licence Ouverte 2.0 | `backend/accidents/providers.py` |
| Statbel — géolocalisation des accidents de la circulation 2017-2024 | idem, Belgique | CC BY 4.0 | `backend/accidents/providers.py` |
| Base Adresse Nationale | géocodage et autocomplétion, France | Licence Ouverte | `backend/geocoding/service.py` |
| Trafic temps réel — Bordeaux Métropole (`ci_trafi_l`) | état de circulation des axes | Licence Ouverte | `backend/traffic/config.py` |
| Trafic temps réel — Eurométropole de Strasbourg (`sirac_flux_trafic`) | idem | Licence Ouverte | `backend/traffic/config.py` |
| Trafic temps réel — Rennes Métropole (`etat-du-trafic-en-temps-reel`) | idem | Licence Ouverte | `backend/traffic/config.py` |
| Trafic temps réel — Nantes Métropole (`fluidite-axes-routiers`) | idem | Licence Ouverte | `backend/traffic/config.py` |
| Éclairage public — Bordeaux Métropole (`bor_ptlum`) | densification des points lumineux | Licence Ouverte | `backend/lighting/config.py` |
| Éclairage public — Nantes Métropole (`luminaires-eclairage-public`) | idem | Licence Ouverte | `backend/lighting/config.py` |
| GBFS — 9 systèmes de vélos en libre-service | disponibilité des stations en temps réel | flux ouverts, attribution par système | `backend/bikeshare/config.py` |
| CAMS / Copernicus, via Open-Meteo | indice de qualité de l'air européen le long du trajet | Copernicus (attribution) | `backend/air_quality/config.py` |
| World Air Quality Index (WAQI) | mesures de stations au sol, complément du CAMS | attribution WAQI | `backend/air_quality/config.py` |
| MapTiler | fonds de carte, géocodage hors France | commercial (hors open data) | `backend/geocoding/service.py` |

Systèmes GBFS branchés : **Le Vélo** (Bordeaux Métropole / Keolis), **Vélib' Métropole**
(Smovengo), **V'Lille** (MEL / Ilévia), **LE vélo STAR** (Rennes Métropole), **Naolib** (Nantes
Métropole / JCDecaux), **Vélo'v** (Métropole de Lyon / JCDecaux), **Vélhop** (Eurométropole de
Strasbourg), **Villo!** (Bruxelles-Capitale / JCDecaux), **Blue-bike** (Blue-mobility / De Lijn).

> Le README ne documente que les sources historiques. Le trafic multi-métropoles, le GBFS et la
> qualité de l'air ont été ajoutés depuis — c'est ce tableau qui fait foi pour les fiches.

---

## 2. Les portails, par ordre de rendement

| # | Portail | Mécanisme | Effort |
| --- | --- | --- | --- |
| 1 | **data.gouv.fr** | formulaire libre-service, 1 fiche → N jeux de données | 30 min |
| 2 | transport.data.gouv.fr | automatique depuis data.gouv.fr | 0 |
| 3 | data.europa.eu | formulaire de contact | 20 min |
| 4 | data.gov.be | page contact (« Publish an application ») | 20 min |
| 5 | ODWB (Wallonie-Bruxelles) | page contact | 15 min |
| 6-10 | portails métropolitains Opendatasoft | page contact du portail | 10 min chacun |
| 11 | Wiki OpenStreetMap | édition directe, sans modération | 30 min |

### 2.1 data.gouv.fr

Compte perso ou organisation → **« Publier une réutilisation »**.
Champs obligatoires : titre, URL, type, description. Optionnels : mots-clés, image, brouillon.

**Le point qui change tout :** une seule fiche se rattache à **plusieurs jeux de données**, et
apparaît ensuite sur la page de chacun. Jeux à rattacher :

- https://www.data.gouv.fr/datasets/accidents-de-velo — le plus visible, 23 réutilisations déjà listées
- https://www.data.gouv.fr/datasets/base-adresse-nationale
- les jeux GBFS « vélos en libre-service » de Bordeaux, Lille, Rennes, Nantes, Lyon, Strasbourg
- les jeux « trafic temps réel » des quatre métropoles moissonnées

Recommandations : **type** = application ; **image** = capture d'écran de la carte, jamais le logo
(les guides du portail l'indiquent explicitement) ; publier **en brouillon**, relire, puis publier.

À faire d'abord : créer l'**organisation** « Sécu'Cycle » plutôt que publier sous un compte
personnel. C'est une page indexée supplémentaire, avec description et lien sortant.

### 2.2 transport.data.gouv.fr — rien à faire

Vérifié : le Point d'Accès National renvoie vers « Publiez votre ressource sur data.gouv.fr » et
reprend les réutilisations de là. Rattacher la fiche aux jeux « Aménagements cyclables » et GBFS
suffit à y apparaître.

### 2.3 data.europa.eu — la fiche la plus valorisante

Catalogue : https://data.europa.eu/en/publications/use-cases
Soumission : https://data.europa.eu/contact-us (le formulaire dédié n'est pas exposé publiquement).

En anglais. Deux angles que peu de candidats peuvent revendiquer : le croisement de **deux
référentiels nationaux d'accidentologie** de part et d'autre d'une frontière, et l'usage de
**Copernicus/CAMS**, programme européen que le portail met volontiers en avant.

### 2.4 data.gov.be — portail fédéral belge

Catalogue : https://data.gov.be/fr/applications
Soumission : https://data.gov.be/fr/contact

Centrer sur **Statbel**, **Villo!**, **Blue-bike** et la couverture Tournai/Mouscron.
Prévoir FR + NL + EN (§ 3.3 et 3.4).

### 2.5 ODWB — Open Data Wallonie-Bruxelles

Réutilisations : https://www.odwb.be/pages/reuse_visualisationv01/
Contact : https://www.odwb.be/pages/contact/

Portail Opendatasoft, pas de dépôt libre-service : passer par le contact. Angle Wallonie picarde.

### 2.6 → 2.10 Portails métropolitains

Tous sous Opendatasoft, avec une page « Réutilisations » et un dépôt par formulaire de contact.
Le slug varie d'un portail à l'autre — vérifier au moment du dépôt.

| Portail | Page réutilisations | Angle à mettre en avant |
| --- | --- | --- |
| Bordeaux Métropole | `/pages/reutilisation/` | trafic `ci_trafi_l` + Le Vélo |
| MEL Lille | `/pages/reutilisations/` | V'Lille + versant français du profil transfrontalier |
| Nantes Métropole | `/pages/reutilisations/` | fluidité des axes + Naolib |
| Rennes Métropole | à vérifier | trafic temps réel + LE vélo STAR |
| Eurométropole de Strasbourg | à vérifier | SIRAC + Vélhop |

Bordeaux est le territoire principal et le plus rentable des cinq : c'est le seul où l'origine
locale du projet est un argument plutôt qu'une réserve.

### 2.11 Wiki OpenStreetMap

Créer `wiki.openstreetmap.org/wiki/Secu'Cycle` (prendre `Cycle.travel` pour patron), puis
s'inscrire dans les listes existantes `Routing/online_routers` et `Bicycle`. Aucune modération
préalable, et les pages du wiki sont remarquablement stables dans le temps.

### 2.12 Compléments à faible coût

Vitrine des usages de la Géoplateforme IGN · Framalibre si le dépôt est ouvert · OpenDataFrance ·
un message d'attribution aux producteurs (Koumoul, Statbel, WAQI) : ils relaient volontiers les
réutilisations de leurs jeux.

---

## 3. Les textes

### 3.1 Titre

Les guides data.gouv.fr demandent un titre décrivant **l'usage des données**, pas le nom du site :

> **Calculateur d'itinéraires vélo pondérés par les aménagements cyclables, l'accidentologie, l'éclairage public et la qualité de l'air.**

Variantes locales : ajouter « — Bordeaux Métropole », « — Métropole Européenne de Lille », etc.

### 3.2 Description maître (FR) — data.gouv.fr, portails métropolitains

Sécu'Cycle calcule des itinéraires vélo optimisés pour la sécurité plutôt que pour la seule
distance. Le service construit un graphe routier à partir d'OpenStreetMap, puis attribue à chaque
tronçon un score de sécurité sur 10 croisant plusieurs jeux de données ouverts.

**Infrastructure** — type d'aménagement cyclable, hiérarchie de la voie, revêtement, éclairage
public et sens de circulation, extraits d'OpenStreetMap (ODbL) via Overpass. L'éclairage est
densifié, là où les jeux existent, par les points lumineux publiés par Bordeaux Métropole et
Nantes Métropole.

**Dénivelé** — les altitudes IGN sont interrogées sur chaque nœud du graphe ; la pente d'un
tronçon est calculée par différence entre ses extrémités.

**Accidentologie** — le jeu « Accidents de vélo » (dérivé des BAAC de l'ONISR, Licence Ouverte
2.0) est rattaché aux arêtes du graphe avec un rayon de tolérance de 25 mètres. Chaque accident
est pondéré par une décroissance exponentielle de demi-vie 5 ans ; le malus obtenu est normalisé
par la longueur du tronçon, compressé logarithmiquement et plafonné à 1,5 point sur 10. Ce
plafond est délibéré : ces bases ne comportent aucun dénominateur d'exposition, si bien qu'un axe
cyclable très fréquenté cumule mécaniquement des accidents sans être plus dangereux au kilomètre
parcouru. Le malus est en outre strictement soustractif — un tronçon sans accident recensé
conserve sa note d'infrastructure, pour ne pas avantager les zones que les données couvrent mal.

**Trafic** — les flux temps réel publiés par Bordeaux Métropole, l'Eurométropole de Strasbourg,
Rennes Métropole et Nantes Métropole renseignent l'état de circulation des axes.

**Vélos en libre-service** — la disponibilité des stations est collectée en GBFS auprès de neuf
systèmes français et belges, par auto-découverte des flux.

**Qualité de l'air** — l'indice européen issu du CAMS (Copernicus Atmosphere Monitoring Service)
est échantillonné le long du trajet, complété par les mesures de stations au sol du World Air
Quality Index.

**Adresses** — la Base Adresse Nationale assure l'autocomplétion et le géocodage sur le
territoire français.

**Points d'intérêt** — points d'eau, toilettes, stationnements vélo et ateliers de réparation,
extraits d'OpenStreetMap.

Le poids relatif de ces critères est ajustable selon le profil du cycliste et son équipement. Le
service couvre Bordeaux Métropole ainsi que la zone transfrontalière Lille–Tournai–Mouscron, où
l'accidentologie s'appuie sur les données Statbel (CC BY 4.0). Interface web, application mobile
et API publique.

Limite assumée et signalée dans l'interface : ces bases ne recensent que les accidents corporels
déclarés aux forces de l'ordre. Les chutes sans tiers y sont très largement sous-représentées et
le géocodage est plus lacunaire hors agglomération ; le signal est donc structurellement plus
fiable en ville.

> Ne pas retirer le dernier paragraphe pour « faire plus vendeur ». Sur data.gouv.fr, énoncer les
> limites d'un jeu de données est le registre attendu et distingue une fiche sérieuse d'une
> plaquette — les guides avertissent qu'un ton promotionnel expose à la suppression.

### 3.3 Version courte (FR) — champs contraints, ~350 caractères

Sécu'Cycle calcule des itinéraires vélo optimisés pour la sécurité plutôt que pour la distance.
Chaque tronçon reçoit un score croisant les aménagements cyclables et l'éclairage
(OpenStreetMap), la pente (IGN), le trafic temps réel, la qualité de l'air (CAMS) et
l'accidentologie officielle.

### 3.4 Version anglaise — data.europa.eu, data.gov.be

Sécu'Cycle computes cycling routes optimised for safety rather than distance alone. The service
builds a road graph from OpenStreetMap and assigns every segment a safety score out of 10,
combining several open datasets.

Cycling infrastructure, road hierarchy, surface and street lighting come from OpenStreetMap
(ODbL). Gradient is derived from IGN elevation data. Real-time traffic is read from the open data
portals of four French metropolitan areas, and bike-share availability is collected in GBFS from
nine French and Belgian systems. Air quality along the route uses the European air quality index
from CAMS (Copernicus Atmosphere Monitoring Service), complemented by ground station
measurements from the World Air Quality Index.

The distinctive part is the crash layer, which combines **two national road-safety registers
across a border**. In France, the "Accidents de vélo" dataset derived from the ONISR BAAC files
(Licence Ouverte 2.0); in Belgium, Statbel's geolocated road crash data 2017-2024 (CC BY 4.0),
published in Lambert 72 and reprojected to WGS84 on ingestion. Crashes are snapped to graph edges
within 25 metres and weighted by exponential decay with a five-year half-life. The resulting
penalty is normalised by segment length, logarithmically compressed and capped at 1.5 points out
of 10 — deliberately, since neither register carries an exposure denominator: a busy cycle
corridor accumulates crashes without being more dangerous per kilometre travelled. The penalty is
strictly subtractive, so a segment with no recorded crash keeps its infrastructure score and
poorly covered areas gain no advantage.

The service covers Bordeaux Métropole and the cross-border Lille–Tournai–Mouscron area, with a
web interface, a mobile application and a public API.

A documented caveat, surfaced in the interface: both registers only record injury crashes
reported to the police. Single-bicycle falls are heavily under-reported and geocoding is patchier
outside urban areas, so the signal is structurally more reliable in cities.

### 3.5 Version néerlandaise — data.gov.be

Sécu'Cycle berekent fietsroutes die geoptimaliseerd zijn voor veiligheid in plaats van enkel voor
afstand. De dienst bouwt een wegennetgraaf op basis van OpenStreetMap en kent elk wegsegment een
veiligheidsscore op 10 toe, waarbij verschillende open datasets worden gecombineerd:
fietsinfrastructuur, wegtype, wegdek en openbare verlichting uit OpenStreetMap (ODbL), hoogte­
gegevens van het IGN voor de helling, realtime verkeersgegevens, deelfietsbeschikbaarheid via
GBFS (waaronder Villo! en Blue-bike), en de Europese luchtkwaliteitsindex van CAMS (Copernicus).

Het onderscheidende element is de ongevallenlaag, die **twee nationale registers over de grens
heen** combineert: in Frankrijk de dataset "Accidents de vélo" afgeleid van de BAAC-bestanden van
het ONISR (Licence Ouverte 2.0), en in België de gegeorefereerde verkeersongevallen 2017-2024 van
Statbel (CC BY 4.0), gepubliceerd in Lambert 72 en bij verwerking geherprojecteerd naar WGS84.
Ongevallen worden binnen 25 meter aan de graafranden gekoppeld en gewogen met een exponentieel
verval met een halfwaardetijd van vijf jaar. De strafpunten worden genormaliseerd op de
segmentlengte, logaritmisch samengedrukt en afgetopt op 1,5 punt op 10 — bewust, omdat geen van
beide registers een blootstellingsnoemer bevat.

De dienst dekt Bordeaux Métropole en het grensoverschrijdende gebied Lille–Doornik–Moeskroen, met
een webinterface, een mobiele applicatie en een publieke API.

Voorbehoud, ook zichtbaar in de interface: beide registers bevatten enkel ongevallen met
lichamelijk letsel die aan de politie werden gemeld. Eenzijdige valpartijen zijn sterk
ondergerapporteerd en de geocodering is buiten stedelijk gebied onvollediger.

### 3.6 Accroches par portail

À placer en tête de la description, avant le texte maître.

**Bordeaux Métropole** — Sécu'Cycle réutilise le flux de trafic temps réel `ci_trafi_l` et le
GBFS du réseau Le Vélo pour calculer des itinéraires cyclables sécurisés sur la métropole. Le
service est né d'un projet de fin d'études à l'ENSEIRB-MATMECA, sur le campus de Talence.

**MEL Lille** — Sécu'Cycle réutilise le GBFS de V'Lille et les aménagements cyclables de la
métropole pour un calcul d'itinéraires vélo transfrontalier couvrant Lille, Roubaix, Tournai et
Mouscron, avec une accidentologie croisant les registres français et belge.

**Nantes / Rennes / Strasbourg** — Sécu'Cycle réutilise le flux de fluidité des axes routiers et
le GBFS du réseau de vélos en libre-service pour pondérer ses itinéraires cyclables sur la
sécurité plutôt que sur la distance.

**ODWB / data.gov.be** — Sécu'Cycle réutilise les données géolocalisées d'accidents de la
circulation de Statbel (CC BY 4.0) pour évaluer la sécurité des rues de la Wallonie picarde, en
les croisant avec le registre français équivalent sur la zone transfrontalière
Tournai–Mouscron–Lille.

**data.europa.eu** — A cross-border cycling safety router combining the French and Belgian
national road-crash registers with Copernicus CAMS air quality data.

### 3.7 Mots-clés

`vélo` · `cyclabilité` · `sécurité routière` · `accidentologie` · `itinéraire` · `mobilité douce` ·
`openstreetmap` · `BAAC` · `GBFS` · `qualité de l'air` · `routage` · `transfrontalier`

Anglais : `cycling` · `bicycle routing` · `road safety` · `crash data` · `openstreetmap` ·
`GBFS` · `air quality` · `cross-border`

---

## 4. Suivi des dépôts

| Portail | URL de dépôt | Date | Statut | Fiche publiée |
| --- | --- | --- | --- | --- |
| data.gouv.fr (organisation) | | | à faire | |
| data.gouv.fr (réutilisation) | | | à faire | |
| transport.data.gouv.fr | — (automatique) | | à faire | |
| data.europa.eu | https://data.europa.eu/contact-us | | à faire | |
| data.gov.be | https://data.gov.be/fr/contact | | à faire | |
| ODWB | https://www.odwb.be/pages/contact/ | | à faire | |
| Bordeaux Métropole | | | à faire | |
| MEL Lille | | | à faire | |
| Nantes Métropole | | | à faire | |
| Rennes Métropole | | | à faire | |
| Eurométropole de Strasbourg | | | à faire | |
| Wiki OpenStreetMap | | | à faire | |
