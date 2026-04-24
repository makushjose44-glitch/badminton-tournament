let tournament = JSON.parse(localStorage.getItem('tournament')) || { name: '', players: [], rounds: [] };
if (typeof tournament.nightMode === 'undefined') {
    tournament.nightMode = false;
}

normalizeTournament();

function normalizeTournament() {
    if (!Array.isArray(tournament.rounds)) {
        tournament.rounds = [];
        return;
    }
    tournament.rounds.forEach(round => {
        round.forEach(match => {
            if (!match.sets) {
                match.sets = [
                    { p1: match.score1 != null ? match.score1 : null, p2: match.score2 != null ? match.score2 : null },
                    { p1: null, p2: null },
                    { p1: null, p2: null }
                ];
                delete match.score1;
                delete match.score2;
            }
            if (typeof match.winner === 'undefined') {
                match.winner = null;
            }
            if (typeof match.thirdSetAdded === 'undefined') {
                match.thirdSetAdded = false;
            }
        });
    });
}

function save() {
    localStorage.setItem('tournament', JSON.stringify(tournament));
}

function applyTheme() {
    document.body.classList.toggle('night', tournament.nightMode);
    const button = document.getElementById('toggle-theme-btn');
    if (button) {
        button.textContent = tournament.nightMode ? '☀️ Day Mode' : '🌙 Night Mode';
    }
}

function toggleNightMode() {
    tournament.nightMode = !tournament.nightMode;
    save();
    applyTheme();
}

function showDashboard() {
    const section = document.getElementById('dashboard');
    section.style.display = 'block';
    window.requestAnimationFrame(() => section.classList.add('visible'));
    updateDashboard();
}

function showPlayersSection() {
    const section = document.getElementById('add-players');
    const bracket = document.getElementById('tournament-bracket');
    section.style.display = 'block';
    bracket.style.display = 'none';
    section.classList.add('visible');
    bracket.classList.remove('visible');
    updateDashboard();
}

function showBracketSection() {
    const section = document.getElementById('tournament-bracket');
    const players = document.getElementById('add-players');
    players.style.display = 'none';
    section.style.display = 'block';
    section.classList.add('visible');
    players.classList.remove('visible');
    updateDashboard();
}

function resetTournament() {
    localStorage.removeItem('tournament');
    tournament = { name: '', players: [], rounds: [] };
    window.location.reload();
}

function updateDashboard() {
    document.getElementById('dashboard-name').textContent = tournament.name || '-';
    document.getElementById('dashboard-players').textContent = tournament.players.length;
    document.getElementById('dashboard-rounds').textContent = tournament.rounds.length;
    const statusEl = document.getElementById('dashboard-status');
    if (!tournament.name) {
        statusEl.textContent = 'No tournament created';
    } else if (!tournament.rounds.length) {
        statusEl.textContent = 'Waiting to start';
    } else {
        const lastRound = tournament.rounds[tournament.rounds.length - 1];
        const roundComplete = lastRound.every(m => m.winner);
        const winners = lastRound.map(m => m.winner);
        if (winners.length === 1 && roundComplete) {
            statusEl.textContent = `Finished — Winner: ${winners[0]}`;
        } else if (roundComplete) {
            statusEl.textContent = `Round ${tournament.rounds.length} complete`;
        } else {
            statusEl.textContent = `In progress — Round ${tournament.rounds.length}`;
        }
    }
}

document.getElementById('create-btn').addEventListener('click', () => {
    tournament.name = document.getElementById('tournament-name').value;
    if (!tournament.name) return;
    save();
    document.getElementById('create-tournament').style.display = 'none';
    showDashboard();
    showPlayersSection();
});

document.getElementById('add-player-btn').addEventListener('click', () => {
    const name = document.getElementById('player-name').value.trim();
    if (name && !tournament.players.includes(name)) {
        tournament.players.push(name);
        document.getElementById('player-name').value = '';
        updatePlayersList();
        save();
    }
});

function updatePlayersList() {
    const list = document.getElementById('players-list');
    list.innerHTML = '';
    tournament.players.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        list.appendChild(li);
    });
}

document.getElementById('start-tournament-btn').addEventListener('click', () => {
    if (tournament.players.length < 2) {
        alert('Need at least 2 players');
        return;
    }
    generateBracket();
    showBracketSection();
    save();
});

document.getElementById('show-players-btn').addEventListener('click', showPlayersSection);
document.getElementById('show-bracket-btn').addEventListener('click', showBracketSection);
document.getElementById('toggle-theme-btn').addEventListener('click', toggleNightMode);
document.getElementById('reset-btn').addEventListener('click', resetTournament);

function generateBracket() {
    const numPlayers = tournament.players.length;
    if (numPlayers % 2 !== 0) {
        alert('Need even number of players for simplicity');
        return;
    }
    tournament.rounds = [];
    let currentRound = [];
    for (let i = 0; i < numPlayers; i += 2) {
        currentRound.push({
            player1: tournament.players[i],
            player2: tournament.players[i + 1],
            sets: [
                { p1: null, p2: null },
                { p1: null, p2: null },
                { p1: null, p2: null }
            ],
            thirdSetAdded: false,
            winner: null
        });
    }
    tournament.rounds.push(currentRound);
    displayBracket();
}

function showWinnerBanner(name) {
    const banner = document.getElementById('winner-banner');
    const winnerName = document.getElementById('winner-name');
    winnerName.textContent = name;
    banner.style.display = 'flex';
    banner.classList.add('visible');
    displayRanking();
}

function hideWinnerBanner() {
    const banner = document.getElementById('winner-banner');
    banner.style.display = 'none';
    banner.classList.remove('visible');
}

function getFinalRankings() {
    const eliminationDetails = [];
    tournament.rounds.forEach((round, roundIndex) => {
        round.forEach((match, matchIndex) => {
            if (!match.winner) {
                return;
            }
            const loser = match.winner === match.player1 ? match.player2 : match.player1;
            eliminationDetails.push({
                name: loser,
                round: roundIndex + 1,
                order: matchIndex
            });
        });
    });

    const finalRound = tournament.rounds[tournament.rounds.length - 1];
    const winner = finalRound && finalRound[0].winner;
    if (!winner) {
        return [];
    }
    const ranked = [{ name: winner, round: Infinity, order: -1 }, ...eliminationDetails]
        .sort((a, b) => {
            if (a.round !== b.round) {
                return b.round - a.round;
            }
            return a.order - b.order;
        });

    return ranked.map((player, index) => ({ rank: index + 1, name: player.name }));
}

function displayRanking() {
    const rankingPanel = document.getElementById('ranking-panel');
    const rankingList = document.getElementById('ranking-list');
    const lastRound = tournament.rounds[tournament.rounds.length - 1];
    const tournamentComplete = lastRound && lastRound.length === 1 && lastRound[0].winner;

    if (!tournamentComplete) {
        rankingPanel.style.display = 'none';
        return;
    }

    rankingList.innerHTML = '';
    getFinalRankings().forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>#${item.rank}</strong><span>${item.name}</span>`;
        rankingList.appendChild(li);
    });
    rankingPanel.style.display = 'block';
}

function displayBracket() {
    const bracket = document.getElementById('bracket');
    bracket.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'bracket-grid';

    tournament.rounds.forEach((round, roundIndex) => {
        const column = document.createElement('div');
        column.className = 'round-column';

        const header = document.createElement('div');
        header.className = 'round-header';
        header.textContent = `Round ${roundIndex + 1}`;
        column.appendChild(header);

        round.forEach((match, matchIndex) => {
            const matchDiv = document.createElement('div');
            matchDiv.className = 'match';
            const sets = match.sets || [{ p1: null, p2: null }, { p1: null, p2: null }, { p1: null, p2: null }];
            const showThirdSet = match.thirdSetAdded || sets[2].p1 != null || sets[2].p2 != null;

            const firstTwoSets = [0, 1].map(setIndex => {
                const set = sets[setIndex];
                return `
                    <div class="set-row">
                        <label>Set ${setIndex + 1}</label>
                        <input type="number" min="0" placeholder="${match.player1}" id="score1-${roundIndex}-${matchIndex}-${setIndex}" value="${set.p1 != null ? set.p1 : ''}">
                        <span class="score-separator">:</span>
                        <input type="number" min="0" placeholder="${match.player2}" id="score2-${roundIndex}-${matchIndex}-${setIndex}" value="${set.p2 != null ? set.p2 : ''}">
                    </div>`;
            }).join('');

            const thirdSet = `
                <div class="set-row ${showThirdSet ? '' : 'hidden'}">
                    <label>Set 3</label>
                    <input type="number" min="0" placeholder="${match.player1}" id="score1-${roundIndex}-${matchIndex}-2" value="${sets[2].p1 != null ? sets[2].p1 : ''}">
                    <span class="score-separator">:</span>
                    <input type="number" min="0" placeholder="${match.player2}" id="score2-${roundIndex}-${matchIndex}-2" value="${sets[2].p2 != null ? sets[2].p2 : ''}">
                </div>`;

            const addThirdSetButton = !match.winner && !showThirdSet ? `<button class="secondary" onclick="addThirdSet(${roundIndex}, ${matchIndex})">Add Set</button>` : '';

            matchDiv.innerHTML = `
                <div class="match-heading"><p>${match.player1} vs ${match.player2}</p>${match.winner ? `<span class="match-winner">${match.winner}</span>` : ''}</div>
                <div class="match-body">
                    ${firstTwoSets}
                    ${thirdSet}
                </div>
                <div class="match-actions">
                    <button onclick="recordScore(${roundIndex}, ${matchIndex})">Record Score</button>
                    ${addThirdSetButton}
                </div>
                ${match.winner ? `<p>Winner: ${match.winner}</p>` : ''}
            `;
            column.appendChild(matchDiv);
        });

        grid.appendChild(column);
    });

    bracket.appendChild(grid);
    displayRanking();
}

function validateBadmintonSet(p1, p2) {
    if (p1 == null && p2 == null) {
        return null;
    }
    if (p1 == null || p2 == null) {
        return 'Each set must have a score for both players.';
    }
    if (p1 === p2) {
        return 'Each set must have a clear winner. Ties are not allowed.';
    }
    const winner = Math.max(p1, p2);
    const loser = Math.min(p1, p2);
    if (winner < 21) {
        return 'A winning score must be at least 21 points.';
    }
    if (winner === 21 && winner - loser >= 2) {
        return null;
    }
    if (winner > 21 && winner <= 29 && winner - loser >= 2) {
        return null;
    }
    if (winner === 30 && loser === 29) {
        return null;
    }
    return 'A set must be won by 2 points, except when the score reaches 30-29.';
}

function addThirdSet(roundIndex, matchIndex) {
    const match = tournament.rounds[roundIndex][matchIndex];
    match.thirdSetAdded = true;
    save();
    displayBracket();
}

function recordScore(roundIndex, matchIndex) {
    const sets = [];
    for (let setIndex = 0; setIndex < 3; setIndex++) {
        const p1Input = document.getElementById(`score1-${roundIndex}-${matchIndex}-${setIndex}`);
        const p2Input = document.getElementById(`score2-${roundIndex}-${matchIndex}-${setIndex}`);
        const p1 = p1Input && p1Input.value.trim() === '' ? null : p1Input && parseInt(p1Input.value, 10);
        const p2 = p2Input && p2Input.value.trim() === '' ? null : p2Input && parseInt(p2Input.value, 10);
        sets.push({ p1: Number.isFinite(p1) ? p1 : null, p2: Number.isFinite(p2) ? p2 : null });
    }

    const match = tournament.rounds[roundIndex][matchIndex];
    let wins1 = 0;
    let wins2 = 0;
    let completedSets = 0;

    for (let setIndex = 0; setIndex < 3; setIndex++) {
        const set = sets[setIndex];
        const validation = validateBadmintonSet(set.p1, set.p2);
        if (validation === null) {
            completedSets += 1;
            if (set.p1 > set.p2) {
                wins1 += 1;
            } else {
                wins2 += 1;
            }
        } else if (set.p1 != null || set.p2 != null) {
            alert(`Set ${setIndex + 1}: ${validation}`);
            return;
        }
    }

    if (completedSets < 2) {
        alert('Please enter at least two completed sets.');
        return;
    }

    if (wins1 < 2 && wins2 < 2) {
        if (completedSets < 3) {
            alert('The first two sets are split. Enter the third set score to decide the match.');
            return;
        }
        alert('The match must have a winner after three sets.');
        return;
    }

    match.sets = sets;
    match.winner = wins1 > wins2 ? match.player1 : match.player2;
    save();
    displayBracket();
    if (tournament.rounds[roundIndex].every(m => m.winner)) {
        generateNextRound();
    }
}

function generateNextRound() {
    const lastRound = tournament.rounds[tournament.rounds.length - 1];
    const winners = lastRound.map(m => m.winner);
    if (winners.length === 1) {
        showWinnerBanner(winners[0]);
        alert(`Tournament winner: ${winners[0]}`);
        return;
    }
    const nextRound = [];
    for (let i = 0; i < winners.length; i += 2) {
        nextRound.push({
            player1: winners[i],
            player2: winners[i + 1],
            sets: [
                { p1: null, p2: null },
                { p1: null, p2: null },
                { p1: null, p2: null }
            ],
            winner: null
        });
    }
    tournament.rounds.push(nextRound);
    displayBracket();
    save();
}

// On load
applyTheme();
hideWinnerBanner();
if (tournament.name) {
    document.getElementById('create-tournament').style.display = 'none';
    showDashboard();
    if (tournament.rounds.length) {
        showBracketSection();
        displayBracket();
        const lastRound = tournament.rounds[tournament.rounds.length - 1];
        const winners = lastRound.map(m => m.winner);
        if (winners.length === 1 && lastRound.every(m => m.winner)) {
            showWinnerBanner(winners[0]);
        }
    } else {
        showPlayersSection();
    }
}
updatePlayersList();
updateDashboard();