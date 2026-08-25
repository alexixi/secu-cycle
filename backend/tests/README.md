# Tests du backend

    pip install -r requirements-dev.txt
    PYTHONPATH=. python -m pytest tests/

Contrainte structurante : **ces tests ne portent que sur des fonctions pures**.
Ils n'importent ni `main`, ni la base, ni le graphe — `main.py` charge environ un
gigaoctet de graphe à l'import, un test qui en dépendrait serait inutilisable.

Ils existent parce que l'internationalisation échoue *silencieusement* : une
chaîne servie dans la mauvaise langue ne lève aucune exception. `test_catalog.py`
est celui qui prévient réellement des incidents — il attrape la contribution à
moitié traduite avant qu'elle n'atteigne la production.
