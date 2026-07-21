"""Géocodage multi-pays : recherche d'adresses et de lieux, quel que soit le pays.

L'app a longtemps interrogé la BAN directement depuis les clients. Ce paquet
regroupe cette logique côté serveur pour trois raisons : la BAN est franco-
française et ne connaît pas Tournai, la clé MapTiler n'a rien à faire dans un
bundle client, et un cache partagé vaut mieux que deux implémentations sans
cache.

Point d'entrée : `service.search` et `service.reverse`.
"""
