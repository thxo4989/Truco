// ============= MISES À JOUR UI =============

function updateGameUI() {
    // Mettre à jour les scores
    document.getElementById('score1').textContent = gameState.team1Score;
    document.getElementById('score2').textContent = gameState.team2Score;

    // Mettre à jour les informations de tour
    document.getElementById('currentTurn').textContent = `Tour: ${gameState.currentPlayer}`;
    document.getElementById('gamePhase').textContent = `Manche ${gameState.currentRound} / 3`;
    document.getElementById('roundNumber').textContent = `Manche ${gameState.currentRound}`;
    document.getElementById('trucValue').textContent = `Mise: ${gameState.trucValue} point${gameState.trucValue > 1 ? 's' : ''}`;

    // Afficher les noms des joueurs
    const opponentName = Object.keys(gameState.players).find(p => p !== gameState.currentPlayer) || 'Adversaire';
    document.getElementById('opponentName').textContent = opponentName;
    document.getElementById('currentPlayerNameGame').textContent = gameState.currentPlayer;

    // Mettre à jour les cartes du joueur
    updatePlayerCards();

    // Mettre à jour le plateau
    updateGameBoard();

    // Mettre à jour les boutons d'action
    updateActionButtons();
}

function updatePlayerCards() {
    // Afficher les cartes du joueur en main
    for (let i = 0; i < 3; i++) {
        const cardElement = document.getElementById(`card${i}`);
        
        if (gameState.playerHand[i]) {
            const card = gameState.playerHand[i];
            cardElement.textContent = formatCard(card);
            cardElement.style.display = 'flex';
            cardElement.className = 'card playable';
            
            if (gameState.playedThisRound) {
                cardElement.style.opacity = '0.5';
                cardElement.style.pointerEvents = 'none';
            } else {
                cardElement.style.opacity = '1';
                cardElement.style.pointerEvents = 'auto';
            }
        } else {
            cardElement.style.display = 'none';
        }
    }

    // Afficher les cartes du adversaire (dos)
    for (let i = 0; i < 3; i++) {
        const cardElement = document.getElementById(`opponentCard${i}`);
        if (gameState.opponentHand[i] || i < gameState.opponentHand.length) {
            cardElement.textContent = '';
            cardElement.style.display = 'flex';
            cardElement.className = 'card back';
        } else {
            cardElement.style.display = 'none';
        }
    }
}

function updateGameBoard() {
    // Afficher les cartes jouées
    for (let round = 1; round <= 3; round++) {
        const roundKey = `round${round}`;
        const plays = gameState.gameBoard[roundKey];

        if (plays && Object.keys(plays).length > 0) {
            let playerIndex = 0;
            for (let player in plays) {
                const card = plays[player];
                const slotId = `round${round}Player${playerIndex + 1}`;
                const slotElement = document.getElementById(slotId);
                
                if (slotElement) {
                    slotElement.innerHTML = `<div class="card played">${formatCard(card)}</div>`;
                }
                playerIndex++;
            }
        }
    }
}

function updateActionButtons() {
    const trucoBtn = document.getElementById('trucoBtn');
    const retrucBtn = document.getElementById('retrucBtn');
    const vale4Btn = document.getElementById('vale4Btn');

    // Les boutons sont actifs seulement si le jeu est actif et que ce n'est pas encore déclaré
    trucoBtn.disabled = !gameState.gameActive || gameState.trucValue > 1 || gameState.playedThisRound;
    retrucBtn.disabled = !gameState.gameActive || gameState.trucValue !== 3;
    vale4Btn.disabled = !gameState.gameActive || gameState.trucValue !== 6;
}

function formatCard(card) {
    // Formater une carte en symbole + valeur
    if (!card || card.length < 2) return '';
    const value = card.substring(0, card.length - 1);
    const suit = card.substring(card.length - 1);
    return `${value}\n${suit}`;
}

function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    
    if (type === 'error') {
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'status-message';
        }, 5000);
    }
}

// Animation des cartes
function animateCardPlay(cardElement) {
    cardElement.style.animation = 'none';
    setTimeout(() => {
        cardElement.style.animation = 'cardFlip 0.3s ease-in-out';
    }, 10);
}

// Ajouter animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes cardFlip {
        0% { transform: rotateY(0deg); }
        50% { transform: rotateY(90deg); }
        100% { transform: rotateY(0deg); }
    }
`;
document.head.appendChild(style);
