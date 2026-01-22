// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAZs0JvS8kFkJ-eKD-tX9Qn6RBBXlQRwUo",
    authDomain: "jeu-du-truco.firebaseapp.com",
    projectId: "jeu-du-truco",
    storageBucket: "jeu-du-truco.firebasestorage.app",
    messagingSenderId: "950818319624",
    appId: "1:950818319624:web:99aa2adf7082e859f850bd"
};

// Variables globales
let db;
let app;

// Initialiser Firebase avec délai pour s'assurer que le SDK est chargé
function initializeFirebase() {
    if (typeof firebase !== 'undefined') {
        try {
            app = firebase.initializeApp(firebaseConfig);
            db = firebase.database();
            console.log("✅ Firebase initialisé correctement!");
            return true;
        } catch (error) {
            if (error.code !== 'app/duplicate-app') {
                console.error("❌ Erreur Firebase:", error);
                return false;
            }
            db = firebase.database();
            console.log("✅ Firebase déjà initialisé");
            return true;
        }
    } else {
        console.warn("Firebase SDK pas encore chargé, nouvelle tentative...");
        setTimeout(initializeFirebase, 500);
        return false;
    }
}

// Initialiser au chargement
setTimeout(initializeFirebase, 100);

// Obtenir une référence pour les salles de jeu
function getRoomsRef() {
    if (!db) {
        console.error("❌ db n'est pas défini!");
        return null;
    }
    return db.ref('rooms');
}

// Obtenir une référence pour une salle spécifique
function getRoomRef(roomCode) {
    if (!db) {
        console.error("❌ db n'est pas défini!");
        return null;
    }
    return db.ref(`rooms/${roomCode}`);
}

// Créer un code de salle unique
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Écouter les changements d'une salle
function onRoomUpdate(roomCode, callback) {
    return getRoomRef(roomCode).on('value', snapshot => {
        callback(snapshot.val());
    });
}

// Arrêter d'écouter les changements
function offRoomUpdate(roomCode) {
    getRoomRef(roomCode).off('value');
}

// Mettre à jour l'état d'une salle
function updateRoom(roomCode, updates) {
    return getRoomRef(roomCode).update(updates);
}

// Supprimer une salle
function deleteRoom(roomCode) {
    return getRoomRef(roomCode).remove();
}
