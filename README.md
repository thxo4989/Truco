# 🃏 Truco - Jeu en Ligne

Un jeu de cartes traditionnel latino-américain jouable en ligne avec synchronisation en temps réel via Firebase.

## Fonctionnalités

- ✅ Jeu multijoueur 1v1 en temps réel
- ✅ Interface moderne et responsive
- ✅ Système de mises (Truco, Retruc, Vale 4)
- ✅ Règles authentiques du Truco
- ✅ Hébergement gratuit sans serveur
- ✅ Base de données temps réel avec Firebase

## Structure du Projet

```
Truco/
├── index.html              # Interface du jeu
├── styles.css              # Design et animations
├── game.js                 # Logique du jeu et règles
├── ui.js                   # Gestion de l'interface utilisateur
├── firebase-config.js      # Configuration Firebase
└── README.md              # Ce fichier
```

## Installation et Déploiement

### Étape 1: Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Ajouter un projet"
3. Entrez un nom (exemple: "truco-game")
4. Complétez la configuration du projet

### Étape 2: Créer une application web

1. Dans votre projet Firebase, cliquez sur l'icône web (`</>`)
2. Entrez un surnom d'app (exemple: "Truco Web")
3. Cliquez sur "S'inscrire"
4. **Copiez le code de configuration** qui s'affiche

### Étape 3: Configurer Firebase

1. Ouvrez `firebase-config.js` dans ce projet
2. Remplacez les valeurs suivantes par celles de votre projet:

```javascript
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",                     // Copié de Firebase
    authDomain: "VOTRE_PROJECT.firebaseapp.com",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_PROJECT.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};
```

### Étape 4: Configurer Realtime Database

1. Dans Firebase Console, allez à "Realtime Database"
2. Cliquez sur "Créer une base de données"
3. Sélectionnez "Démarrer en mode test" (pour développement)
4. Sélectionnez votre région
5. Cliquez sur "Activer"

**Important**: En mode test, n'importe qui peut accéder à votre base. Pour la production, configurez les règles de sécurité:

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true,
        ".validate": "newData.hasChildren(['code', 'host', 'players'])"
      }
    }
  }
}
```

### Étape 5: Déployer sur Firebase Hosting

#### Option A: Ligne de commande (Recommandé)

```bash
# 1. Installer Firebase CLI
npm install -g firebase-tools

# 2. Se connecter à Firebase
firebase login

# 3. Initialiser Firebase dans le dossier du projet
firebase init hosting

# 4. Sélectionner le répertoire courant comme répertoire public

# 5. Déployer
firebase deploy
```

#### Option B: GitHub Pages

1. Créez un repository GitHub
2. Poussez les fichiers du projet
3. Allez à Settings → Pages
4. Sélectionnez "Deploy from a branch"
5. Choisissez `main` et `/root`
6. Votre site sera accessible à: `https://votre-username.github.io/repo-name`

#### Option C: Netlify

1. Allez sur [Netlify Drop](https://app.netlify.com/drop)
2. Faites glisser le dossier du projet
3. Votre site est en ligne instantanément!

### Étape 6: Partager le lien

Une fois déployé, partagez l'URL avec vos amis pour jouer ensemble!

**Pour jouer localement avant de déployer:**
- Ouvrez `index.html` directement dans votre navigateur
- Ou utilisez `python -m http.server 8000` et accédez à `http://localhost:8000`

## Comment Jouer

### Règles du Truco

1. **Distribution**: Chaque joueur reçoit 3 cartes
2. **Ordre de force des cartes** (du plus fort au plus faible):
   - 3, 2, As, Roi, Dame, Valet, 7, 6, 5, 4, 8, 9, 10
3. **Manches**: 3 manches au maximum (meilleur de 3 gagne la mise)
4. **Mises**:
   - **Truco**: Augmente la mise de 1 à 3 points
   - **Retruc**: Augmente la mise de 3 à 6 points
   - **Vale 4**: Augmente la mise de 6 à 12 points
5. **Victoire**: Première équipe à atteindre 30 points gagne la partie

### Interface de Jeu

- **Plateau central**: Affiche les cartes jouées
- **Main gauche**: Cartes du adversaire (invisibles)
- **Main droite**: Vos cartes (cliquables)
- **Boutons d'action**: Déclarations de Truco/Retruc/Vale 4
- **Tableau de scores**: Affiche les points en temps réel

## Architecture Technique

### Technos Utilisées

- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Backend**: Firebase Realtime Database
- **Hébergement**: Firebase Hosting / GitHub Pages / Netlify

### Flux de Données

1. Joueur 1 crée une salle → Salle créée dans Firebase
2. Joueur 2 rejoint la salle → Firebase notifie Joueur 1
3. Les deux joueurs jouent leurs cartes → Synchronisation temps réel
4. Résultat de chaque manche → Mise à jour des scores
5. Fin de partie → Suppression de la salle

### États du Jeu

- `waiting`: En attente du second joueur
- `playing`: Manche en cours
- `showdown`: Révélation des cartes
- `roundEnd`: Fin de manche
- `gameEnd`: Fin de partie

## Personnalisation

### Modifier l'apparence

Éditez `styles.css` pour changer:
- Couleurs (variable `#667eea`, `#764ba2`)
- Tailles des cartes
- Animations
- Responsive design

### Modifier les règles

Dans `game.js`, modifiez:
- `CARD_STRENGTH`: Force des cartes
- Points nécessaires pour gagner (actuellement 30)
- Nombre de manches (actuellement 3)

### Ajouter des fonctionnalités

Idées d'améliorations:
- Système d'équipes (4 joueurs, 2v2)
- Chat en direct
- Historique des parties
- Classement des joueurs
- Sons et musique
- Mode hors ligne

## Dépannage

### Le jeu ne se lance pas

1. Vérifiez que Firebase est correctement configuré
2. Ouvrez la console navigateur (F12) pour voir les erreurs
3. Vérifiez que `firebase-config.js` est bien complété

### Les autres joueurs ne se voient pas

1. Vérifiez votre connexion Internet
2. Vérifiez les règles de sécurité de Firebase Realtime Database
3. Vérifiez que vous utilisez le même code de salle

### Erreurs Firebase 403/401

- Vous êtes probablement en mode test avec des restrictions
- Allez à Firebase Console → Realtime Database → Rules
- Mettez temporairement les règles en mode test (`.read: true`, `.write: true`)

## Améliorations Futures

- [ ] Support 4 joueurs (2v2)
- [ ] Système de spectateurs
- [ ] Rejeu de parties
- [ ] Achievements et badges
- [ ] Intégration PWA (jouable hors ligne)
- [ ] Réseau social et amis
- [ ] Crypto-rewards (optional)

## Support et Contribution

Pour toute question ou bug, n'hésitez pas à créer une issue.

Contributions bienvenues! 🎉

## Licence

MIT License - Libre d'utilisation

---

**Bon jeu! 🃏**
