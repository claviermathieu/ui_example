# Loi Normale — React + Azure Static Web Apps

Application pour visualiser une loi normale avec paramètres ajustables.
Déployable sur **Azure Static Web Apps** avec une API Python (Azure Functions).

## Structure

```
frontend/          # Vite + React (app_location)
  src/
    App.jsx
    index.css
    main.jsx
  public/
    staticwebapp.config.json
  index.html
  package.json
  vite.config.js
api/               # Azure Functions Python v2 (api_location)
  function_app.py  # Endpoints /api/plot et /api/stats
  requirements.txt
  host.json
.github/workflows/
  azure-static-web-apps.yml
```

## Développement local

### 1. API — Azure Functions Python

Prérequis : [Azure Functions Core Tools](https://learn.microsoft.com/azure/azure-functions/functions-run-local) + Python 3.11

```bash
cd api
pip install -r requirements.txt
func start
# API sur http://localhost:7071/api/
```

### 2. Frontend — Vite React

```bash
cd frontend
npm install
npm run dev
# App sur http://localhost:5173 (proxy /api → localhost:7071)
```

## Déploiement Azure Static Web Apps

1. Créer une ressource **Static Web App** dans le portail Azure
2. Lier ce dépôt GitHub
3. Configurer le workflow avec :
   - `app_location: frontend`
   - `api_location: api`
   - `output_location: dist`
4. Ajouter le secret `AZURE_STATIC_WEB_APPS_API_TOKEN` dans les secrets GitHub

Le workflow `.github/workflows/azure-static-web-apps.yml` gère le CI/CD automatiquement.

## Paramètres disponibles

| Paramètre | Description |
|-----------|-------------|
| μ (mean)  | Moyenne de la distribution |
| σ (std)   | Écart-type (doit être > 0) |
| x min/max | Bornes du graphe (auto si non modifiées) |
| Régions σ | Affiche les zones ±1σ / ±2σ / ±3σ |

## API

`POST /api/plot` — Retourne le graphe en base64 PNG
`POST /api/stats` — Retourne les statistiques clés (variance, probabilités σ)

```json
{ "mean": 0, "std": 1, "x_min": -4, "x_max": 4, "show_fill": true }
```
