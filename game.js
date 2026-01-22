// ============= DONNÉES DU JEU =============

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Ordre de force des cartes au Truco
const CARD_STRENGTH = {
    '3': 14,
    '2': 13,
    'A': 12,
    'K': 11,
    'Q': 10,
    'J': 9,
    '7': 8,
    '6': 7,
    '5': 6,
    '4': 5,
    '8': 4,
    '9': 3,
    '10': 2
};

// Cartes "mauvaises" (cartes faibles de chaque couleur au Truco)
const WEAK_CARDS = {
    '♠': '4', '♥': '4', '♦': '4', '♣': '4'
};

// État global du jeu
let gameState = {
    roomCode: null,
    currentPlayer: null,
    players: {},
    deck: [],
    playerHand: [],
    opponentHand: [],
    gameBoard: { round1: {}, round2: {}, round3: {} },
    currentRound: 1,
    trucValue: 1,
    team1Score: 0,
    team2Score: 0,
    gamePhase: 'waiting', // waiting, playing, showdown, roundEnd, gameEnd
    roundWinner: null,
    playedThisRound: false,
    gameActive: false,
    unsubscribe: null
};

// ============= CRÉATION ET GESTION DE SALLE =============

function createGame() {
    console.log("🎮 Tentative de création de salle...");
    
    // Vérifier que Firebase est initialisé
    if (typeof db === 'undefined' || !db) {
        console.error('❌ db is undefined');
        showStatus('Firebase n\'est pas encore chargé... Veuillez attendre.', 'error');
        return;
    }
    
    const playerName = document.getElementById('playerName').value.trim();
    console.log("👤 Nom joueur:", playerName);
    
    if (!playerName) {
        showStatus('Veuillez entrer un nom', 'error');
        return;
    }

    const roomCode = generateRoomCode();
    console.log("🔑 Code salle généré:", roomCode);
    
    gameState.roomCode = roomCode;
    gameState.currentPlayer = playerName;
    gameState.players[playerName] = {
        name: playerName,
        team: 1,
        hand: [],
        isHost: true
    };

    // Créer la salle dans Firebase
    const roomData = {
        code: roomCode,
        host: playerName,
        players: [playerName],
        status: 'waiting',
        createdAt: Date.now(),
        scores: { team1: 0, team2: 0 },
        currentRound: 1
    };

    console.log("📝 Données salle:", roomData);
    
    // Écrire dans Firebase
    const ref = getRoomRef(roomCode);
    if (ref) {
        ref.set(roomData);
        
        // Afficher immédiatement sans attendre de confirmation
        console.log("✅ Salle créée avec succès!");
        showStatus('Salle créée avec succès!', 'success');
        document.getElementById('roomCodeDisplay').textContent = roomCode;
        document.getElementById('currentPlayerName').textContent = playerName;
        
        setTimeout(() => {
            showScreen('waitingScreen');
            listenForOpponent(roomCode);
        }, 500);
    } else {
        showStatus('Erreur: Firebase non initialisé', 'error');
    }
}

function joinGame() {
    console.log("🎮 Tentative de rejoindre une salle...");
    
    // Vérifier que Firebase est initialisé
    if (typeof db === 'undefined' || !db) {
        console.error('❌ db is undefined');
        showStatus('Firebase n\'est pas encore chargé... Veuillez attendre.', 'error');
        return;
    }
    
    const playerName = document.getElementById('playerName').value.trim();
    const roomCode = document.getElementById('roomCode').value.trim();

    console.log("👤 Nom joueur:", playerName);
    console.log("🔑 Code salle:", roomCode);

    if (!playerName) {
        showStatus('Veuillez entrer un nom', 'error');
        return;
    }

    if (!roomCode) {
        showStatus('Veuillez entrer un code de salle', 'error');
        return;
    }

    gameState.roomCode = roomCode;
    gameState.currentPlayer = playerName;

    // Vérifier que la salle existe
    const ref = getRoomRef(roomCode);
    if (!ref) {
        showStatus('Erreur: Firebase non initialisé', 'error');
        return;
    }

    ref.once('value', (snapshot) => {
        console.log("📊 Données reçues:", snapshot.val());
        
        if (!snapshot.exists()) {
            console.error('❌ Salle non trouvée');
            showStatus('Salle non trouvée', 'error');
            return;
        }

        const room = snapshot.val();
        console.log("✅ Salle trouvée:", room);

        // Vérifier que deux joueurs max
        if (room.players.length >= 2) {
            console.error('❌ La salle est pleine');
            showStatus('La salle est pleine', 'error');
            return;
        }

        // Ajouter le joueur à la salle
        const newPlayers = [...room.players, playerName];
        const ref2 = getRoomRef(roomCode);
        ref2.update({ 
            players: newPlayers,
            status: 'playing'
        }, (error) => {
            if (error) {
                console.error('❌ Erreur:', error);
                showStatus('Erreur: ' + error.message, 'error');
            } else {
                console.log("✅ Joueur ajouté!");
                document.getElementById('roomCodeDisplay').textContent = roomCode;
                document.getElementById('currentPlayerName').textContent = playerName;
                
                setTimeout(() => {
                    showScreen('waitingScreen');
                    startGame(roomCode, room.host);
                }, 500);
            }
        });
    }).catch(err => {
        console.error('❌ Erreur Firebase:', err);
        showStatus('Erreur: ' + err.message, 'error');
    });
}

function listenForOpponent(roomCode) {
    onRoomUpdate(roomCode, (roomData) => {
        if (roomData && roomData.players.length === 2 && roomData.status === 'playing') {
            const opponent = roomData.players.find(p => p !== gameState.currentPlayer);
            gameState.players[opponent] = {
                name: opponent,
                team: 2,
                hand: [],
                isHost: false
            };
            
            // Lancer le jeu
            setTimeout(() => startGame(roomCode, gameState.currentPlayer), 500);
        }
    });
}

// ============= LOGIQUE DU JEU =============

function startGame(roomCode, hostName) {
    gameState.gameActive = true;
    gameState.gamePhase = 'playing';
    
    // Initialiser le jeu
    gameState.deck = createDeck();
    dealCards();
    
    // Déterminer qui commence
    const isHost = gameState.currentPlayer === hostName;
    
    updateRoom(roomCode, {
        status: 'playing',
        currentRound: 1,
        scores: { team1: gameState.team1Score, team2: gameState.team2Score },
        hand1: gameState.playerHand,
        hand2: gameState.opponentHand,
        startingPlayer: hostName
    });

    showScreen('gameScreen');
    updateGameUI();
    listenToGameUpdates(roomCode);
}

function createDeck() {
    const deck = [];
    for (let suit of SUITS) {
        for (let value of VALUES) {
            deck.push(value + suit);
        }
    }
    // Mélanger le deck
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function dealCards() {
    gameState.playerHand = [];
    gameState.opponentHand = [];
    
    // Distribuer 3 cartes à chaque joueur
    for (let i = 0; i < 3; i++) {
        gameState.playerHand.push(gameState.deck.pop());
        gameState.opponentHand.push(gameState.deck.pop());
    }
}

function playCard(cardIndex) {
    if (!gameState.gameActive || gameState.playedThisRound) return;
    
    const card = gameState.playerHand[cardIndex];
    
    // Enregistrer le coup joué
    const roundKey = `round${gameState.currentRound}`;
    gameState.gameBoard[roundKey][gameState.currentPlayer] = card;
    
    // Retirer la carte de la main
    gameState.playerHand.splice(cardIndex, 1);
    gameState.playedThisRound = true;

    // Mettre à jour Firebase
    updateRoom(gameState.roomCode, {
        gameBoard: gameState.gameBoard,
        hand1: gameState.playerHand,
        playedThisRound: true,
        lastMove: {
            player: gameState.currentPlayer,
            card: card,
            timestamp: Date.now()
        }
    });

    updateGameUI();
    
    // L'adversaire joue automatiquement après 1s
    setTimeout(() => opponentPlaysCard(), 1000);
}

function opponentPlaysCard() {
    // IA simple: jouer une carte aléatoire
    if (gameState.opponentHand.length > 0) {
        const cardIndex = Math.floor(Math.random() * gameState.opponentHand.length);
        const card = gameState.opponentHand[cardIndex];
        
        const roundKey = `round${gameState.currentRound}`;
        gameState.gameBoard[roundKey][Object.keys(gameState.players)[1]] = card;
        
        gameState.opponentHand.splice(cardIndex, 1);
        
        updateGameUI();
        
        // Évaluer le round
        setTimeout(() => evaluateRound(), 500);
    }
}

function evaluateRound() {
    const roundKey = `round${gameState.currentRound}`;
    const plays = gameState.gameBoard[roundKey];
    
    if (Object.keys(plays).length < 2) return;

    const playerCard = plays[gameState.currentPlayer];
    const opponentCard = plays[Object.keys(gameState.players)[1]];
    
    const playerStrength = CARD_STRENGTH[playerCard.charAt(0)];
    const opponentStrength = CARD_STRENGTH[opponentCard.charAt(0)];

    let roundWinner;
    if (playerStrength > opponentStrength) {
        roundWinner = gameState.currentPlayer;
    } else if (opponentStrength > playerStrength) {
        roundWinner = Object.keys(gameState.players)[1];
    } else {
        roundWinner = 'tie';
    }

    gameState.roundWinner = roundWinner;

    // Avancer au prochain round
    if (gameState.currentRound < 3 && gameState.playerHand.length > 0) {
        gameState.currentRound++;
        gameState.playedThisRound = false;
        gameState.gameBoard[`round${gameState.currentRound}`] = {};
        updateGameUI();
    } else {
        // Fin de la manche
        determineHandWinner();
    }
}

function determineHandWinner() {
    let player1RoundsWon = 0;
    let player2RoundsWon = 0;

    for (let i = 1; i <= 3; i++) {
        const roundKey = `round${i}`;
        const winner = gameState.roundWinner;
        
        const playerName = gameState.currentPlayer;
        const opponentName = Object.keys(gameState.players)[1];

        if (winner === playerName) player1RoundsWon++;
        else if (winner === opponentName) player2RoundsWon++;
    }

    // Attribuer les points
    let team1Points = gameState.trucValue;
    let team2Points = 0;

    if (player1RoundsWon === 3) {
        gameState.team1Score += team1Points;
    } else if (player2RoundsWon === 3) {
        gameState.team2Score += team1Points;
    } else if (player1RoundsWon === 2) {
        gameState.team1Score += team1Points;
    } else {
        gameState.team2Score += team1Points;
    }

    // Vérifier si le jeu est terminé (jusqu'à 30 points)
    if (gameState.team1Score >= 30 || gameState.team2Score >= 30) {
        endGame();
    } else {
        // Nouvelle manche
        setTimeout(() => {
            gameState.currentRound = 1;
            gameState.trucValue = 1;
            gameState.playerHand = [];
            gameState.opponentHand = [];
            gameState.gameBoard = { round1: {}, round2: {}, round3: {} };
            gameState.playedThisRound = false;
            dealCards();
            updateGameUI();
        }, 2000);
    }
}

function endGame() {
    gameState.gameActive = false;
    gameState.gamePhase = 'gameEnd';
    
    const winner = gameState.team1Score > gameState.team2Score ? 'Équipe 1' : 'Équipe 2';
    document.getElementById('endGameTitle').textContent = winner + ' gagne!';
    document.getElementById('endGameMessage').textContent = `Scores finaux: Équipe 1: ${gameState.team1Score} - Équipe 2: ${gameState.team2Score}`;

    const finalScoresDiv = document.getElementById('finalScores');
    finalScoresDiv.innerHTML = `
        <div class="final-score-item">
            <div class="label">Équipe 1</div>
            <div class="value">${gameState.team1Score}</div>
        </div>
        <div class="final-score-item">
            <div class="label">Équipe 2</div>
            <div class="value">${gameState.team2Score}</div>
        </div>
    `;

    offRoomUpdate(gameState.roomCode);
    deleteRoom(gameState.roomCode);
    
    setTimeout(() => showScreen('endGameScreen'), 500);
}

// ============= DÉCLARATIONS DU TRUCO =============

function declareTruco() {
    if (!gameState.gameActive) return;
    gameState.trucValue = 3;
    updateRoom(gameState.roomCode, { trucValue: 3 });
    document.getElementById('trucoBtn').disabled = true;
    updateGameUI();
}

function declareRetruc() {
    if (!gameState.gameActive) return;
    gameState.trucValue = 6;
    updateRoom(gameState.roomCode, { trucValue: 6 });
    document.getElementById('retrucBtn').disabled = true;
    updateGameUI();
}

function declareVale4() {
    if (!gameState.gameActive) return;
    gameState.trucValue = 12;
    updateRoom(gameState.roomCode, { trucValue: 12 });
    document.getElementById('vale4Btn').disabled = true;
    updateGameUI();
}

// ============= SYNCHRONISATION FIREBASE =============

function listenToGameUpdates(roomCode) {
    gameState.unsubscribe = onRoomUpdate(roomCode, (roomData) => {
        if (!roomData) {
            quitGame();
            return;
        }

        // Mettre à jour l'état du jeu depuis Firebase
        if (roomData.hand2) {
            gameState.opponentHand = roomData.hand2;
        }
        if (roomData.gameBoard) {
            gameState.gameBoard = roomData.gameBoard;
        }
        if (roomData.trucValue) {
            gameState.trucValue = roomData.trucValue;
        }
        if (roomData.scores) {
            gameState.team1Score = roomData.scores.team1;
            gameState.team2Score = roomData.scores.team2;
        }

        updateGameUI();
    });
}

// ============= NAVIGATION =============

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function goHome() {
    offRoomUpdate(gameState.roomCode);
    deleteRoom(gameState.roomCode);
    
    gameState = {
        roomCode: null,
        currentPlayer: null,
        players: {},
        deck: [],
        playerHand: [],
        opponentHand: [],
        gameBoard: { round1: {}, round2: {}, round3: {} },
        currentRound: 1,
        trucValue: 1,
        team1Score: 0,
        team2Score: 0,
        gamePhase: 'waiting',
        roundWinner: null,
        playedThisRound: false,
        gameActive: false,
        unsubscribe: null
    };

    document.getElementById('playerName').value = '';
    document.getElementById('roomCode').value = '';
    document.getElementById('status').textContent = '';
    
    showScreen('homeScreen');
}

function quitGame() {
    if (gameState.roomCode) {
        deleteRoom(gameState.roomCode);
        offRoomUpdate(gameState.roomCode);
    }
    goHome();
}
