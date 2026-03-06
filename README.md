# Plateforme Data — React + Azure Static Web Apps

Application SPA deux onglets déployable sur **Azure Static Web Apps** avec une API Python (Azure Functions).

- **StatLab** : laboratoire d'analyses statistiques avec système de templates dynamiques
- **Databricks Runs** : simulateur de suivi de jobs Databricks (historique, statuts, téléchargements)

## Structure

```
frontend/                        # Vite + React (app_location)
  src/
    App.jsx                      # Navigation globale deux onglets
    StatLab.jsx                  # Onglet analyses statistiques
    DatabricksApp.jsx            # Onglet simulateur Databricks
    index.css                    # Tous les styles
    main.jsx
  public/
    staticwebapp.config.json     # Règles SPA + exclusion /api/*
  index.html
  package.json
  vite.config.js                 # Proxy /api → localhost:7071 en dev
api/                             # Azure Functions Python v2 (api_location)
  function_app.py                # 5 endpoints (plot, stats, poisson, student, chi2)
  requirements.txt
  host.json
.github/workflows/
  azure-static-web-apps.yml      # CI/CD automatique
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
   - `api_language: python` / `api_version: "3.11"`
4. Ajouter le secret `AZURE_STATIC_WEB_APPS_API_TOKEN` dans les secrets GitHub

Le workflow `.github/workflows/azure-static-web-apps.yml` gère le CI/CD automatiquement.
En production, Azure SWA route `/api/*` vers les Functions sans configuration CORS supplémentaire.

---

## Onglet StatLab

Laboratoire de visualisation de lois statistiques basé sur un **système de templates**.
Chaque template génère automatiquement son formulaire et appelle le endpoint Python correspondant.

### Ajouter une distribution

1. Ajouter un objet dans le tableau `TEMPLATES` dans `StatLab.jsx`
2. Ajouter l'endpoint correspondant dans `api/function_app.py`

Aucune modification du reste de l'UI n'est nécessaire.

### Distributions disponibles

| Template | Endpoint | Paramètres |
|----------|----------|------------|
| Loi Normale | `POST /api/plot` + `POST /api/stats` | μ, σ, régions ±nσ |
| Loi de Poisson | `POST /api/poisson` | λ, k max |
| Loi de Student | `POST /api/student` | degrés de liberté ν, superposition N(0,1) |
| Loi du χ² | `POST /api/chi2` | degrés de liberté k |

### API StatLab

Toutes les routes acceptent `POST` avec un corps JSON et retournent `{ "image": "<base64 PNG>" }`.

```
POST /api/plot     { "mean": 0, "std": 1, "show_fill": true }
POST /api/stats    { "mean": 0, "std": 1 }
                   → { "mean", "std", "variance", "p_1sigma", "p_2sigma", "p_3sigma" }
POST /api/poisson  { "lam": 3, "k_max": 15 }
POST /api/student  { "df": 5, "compare_normal": true }
POST /api/chi2     { "df": 3 }
```

---

## Onglet Databricks Runs

Simulateur de suivi de jobs Databricks — aucune connexion réelle requise.

### Fonctionnalités

- **Historique des runs** : tableau avec statut (PENDING / RUNNING / SUCCESS / FAILED), durée, utilisateur, notebook, cluster
- **Lancement de run** : sélection notebook, cluster, environnement, date planifiée
- **Datasets centraux** : sélection de jeux de données plateforme (ADLS) au lancement
- **Upload de fichiers** : zone drag & drop pour joindre des fichiers au run (fictif, non ingéré)
- **Simulation de cycle de vie** : PENDING → RUNNING (1,5 s) → SUCCESS/FAILED (4–11 s)
- **Panneau de détail** : logs horodatés, sources utilisées, métadonnées du run
- **Téléchargements** : inputs CSV, outputs CSV, outputs XLSX par run (génération côté navigateur)

### Téléchargements

Les fichiers sont générés directement dans le navigateur via l'API `Blob` + `URL.createObjectURL`.
Aucun backend n'est impliqué. Le préfixe BOM (`\uFEFF`) assure la compatibilité UTF-8 avec Excel.
