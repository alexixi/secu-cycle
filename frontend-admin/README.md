# Sécu'Cycle — Admin

Dashboard d'administration **indépendant** (React + Vite), séparé de l'app publique
`frontend-web`. Il consomme la même API FastAPI (`backend`) via les endpoints
`/users/*` réservés aux administrateurs.

Première fonctionnalité : **gestion des utilisateurs** (lister, rechercher, éditer,
promouvoir/révoquer admin, supprimer).

## Prérequis

- Le backend doit tourner (par défaut `http://127.0.0.1:8000`).
- Au moins un compte **administrateur** doit exister. Deux façons :

  1. **Recommandé** — via la variable d'environnement backend `ADMIN_EMAILS`
     (liste d'e-mails séparés par des virgules) dans `backend/.env` :

     ```
     ADMIN_EMAILS=toi@example.com,collegue@example.com
     ```

     Tout compte dont l'e-mail y figure devient admin (sans toucher la base).

  2. Ou en positionnant le flag en base :

     ```sql
     UPDATE users SET is_admin = true WHERE email = 'ton@email';
     ```

## Configuration

Copier `.env.example` en `.env` et ajuster si besoin :

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### CORS (dev)

Le serveur de dev tourne sur le port **5174**. Le backend n'autorise par défaut que
`5173`. Ajouter l'origine de l'admin à `CORS_ORIGINS` dans `backend/.env` :

```
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174
```

## Développement

```bash
make install   # npm install
make dev       # vite, http://localhost:5174
```

Seuls les comptes `is_admin = true` peuvent se connecter ; les autres sont refusés
à la connexion.

## Build / déploiement

```bash
make build     # génère dist/
```

Un `Dockerfile` (build Vite + service nginx) et un `nginx.conf` sont fournis pour un
déploiement conteneurisé indépendant, sur le modèle de `frontend-web`.

## Structure

```
src/
  context/     AuthContext (admin), ThemeContext
  services/    apiBack.js (client API + refresh token)
  components/
    ui/        Button, ThemeToggle, PopUp (repris de frontend-web)
    layout/    AdminLayout (sidebar + topbar), ProtectedRoute
    admin/     UsersManager, UserDetailModal, ConfirmDeleteModal
  pages/       LoginPage, UsersPage, NotFoundPage
```
