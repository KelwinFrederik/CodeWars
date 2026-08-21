
const HISTORY_URL = "./historico.json";

async function loadData() {
    try {
        const response = await fetch(HISTORY_URL);

        if (!response.ok) {
            throw new Error("Não foi possível carregar o histórico.");
        }

        const data = await response.json();

        await renderCurrentSeason(data);
        renderHistory(data);

    } catch (error) {
        console.error(error);

        document.getElementById("ranking").innerHTML =
            `<p class="error">${error.message}</p>`;
    }
}


async function renderCurrentSeason(data) {

    const current = data.current;

    const startDate = new Date(current.startDate);

    document.getElementById("season-period").textContent =
        `Início: ${formatDate(startDate)}`;

    const rankingElement = document.getElementById("ranking");

    if (!current.participants || current.participants.length === 0) {
        rankingElement.innerHTML =
            `<p class="loading">Nenhum participante cadastrado.</p>`;

        return;
    }

    const players = await Promise.all(
        current.participants.map(getPlayerScore)
    );

    players.sort((a, b) => b.points - a.points);

    rankingElement.innerHTML = players
        .map((player, index) => createPlayerHtml(player, index))
        .join("");

    document.getElementById("last-update").textContent =
        `Atualizado: ${new Date().toLocaleString("pt-BR")}`;
}


async function getPlayerScore(player) {

    try {

        const response = await fetch(
            `https://www.codewars.com/api/v1/users/${player.codewarsUsername}`
        );

        if (!response.ok) {
            throw new Error(
                `Não foi possível consultar ${player.codewarsUsername}`
            );
        }

        const codewarsUser = await response.json();

        const currentHonor = codewarsUser.honor;

        const points =
            currentHonor - player.initialHonor;

        return {
            name: player.name,
            username: player.codewarsUsername,
            initialHonor: player.initialHonor,
            currentHonor: currentHonor,
            points: Math.max(0, points)
        };

    } catch (error) {

        console.error(error);

        return {
            name: player.name,
            username: player.codewarsUsername,
            initialHonor: player.initialHonor,
            currentHonor: null,
            points: 0,
            error: true
        };
    }
}


function createPlayerHtml(player, index) {

    const medals = ["🥇", "🥈", "🥉"];

    const position =
        medals[index] || `${index + 1}º`;

    const honorText =
        player.error
            ? "Erro ao consultar Codewars"
            : `Honor: ${player.currentHonor}`;

    return `
        <div class="player">

            <div class="player-position">
                ${position}
            </div>

            <div class="player-info">

                <div class="player-name">
                    ${escapeHtml(player.name)}
                </div>

                <div class="player-honor">
                    ${honorText}
                </div>

            </div>

            <div class="player-points">
                ${player.points} pts
            </div>

        </div>
    `;
}


function renderHistory(data) {

    const historyElement =
        document.getElementById("history-list");

    if (!data.history || data.history.length === 0) {

        historyElement.innerHTML =
            `<p class="loading">Nenhuma temporada encerrada.</p>`;

        return;
    }

    historyElement.innerHTML = data.history
        .slice()
        .reverse()
        .map(createHistoryHtml)
        .join("");
}


function createHistoryHtml(season) {

    const startDate =
        formatDate(new Date(season.startDate));

    const endDate =
        formatDate(new Date(season.endDate));

    const ranking = season.ranking
        .map((player, index) => {

            const medals = ["🥇", "🥈", "🥉"];

            const position =
                medals[index] || `${index + 1}º`;

            return `
                <div class="history-player">
                    <span>
                        ${position}
                        ${escapeHtml(player.name)}
                    </span>

                    <strong>
                        ${player.points} pts
                    </strong>
                </div>
            `;
        })
        .join("");

    return `
        <div class="history-item">

            <div class="history-title">
                ${startDate} → ${endDate}
            </div>

            ${ranking}

        </div>
    `;
}


function formatDate(date) {

    return date.toLocaleDateString(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


loadData();
