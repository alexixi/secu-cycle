"""
Cache LRU thread-safe pour les résultats de calcul d'itinéraire.
Taille via l'env ROUTE_CACHE_SIZE (défaut 256 ; 0 désactive le cache).
"""
import os
import copy
import threading
from collections import OrderedDict


class RouteCache:
    def __init__(self, maxsize):
        self._maxsize = maxsize
        self._store = OrderedDict()
        self._lock = threading.Lock()
        self.hits = 0
        self.misses = 0

    @property
    def enabled(self):
        return self._maxsize > 0

    def get(self, key):
        if self._maxsize <= 0:
            return None
        with self._lock:
            if key in self._store:
                self._store.move_to_end(key)
                self.hits += 1
                return copy.deepcopy(self._store[key])
            self.misses += 1
            return None

    def set(self, key, value):
        if self._maxsize <= 0:
            return
        with self._lock:
            self._store[key] = copy.deepcopy(value)
            self._store.move_to_end(key)
            while len(self._store) > self._maxsize:
                self._store.popitem(last=False)

    def invalidate(self):
        """Vide le cache (appelé sur signalement ou mise à jour trafic)."""
        with self._lock:
            n = len(self._store)
            self._store.clear()
        return n


def _read_size():
    try:
        return int(os.getenv("ROUTE_CACHE_SIZE", "256"))
    except (TypeError, ValueError):
        return 256


# Instance partagée par le worker (un cache par process uvicorn).
route_cache = RouteCache(_read_size())
