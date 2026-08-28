const HISTORY_URL = "./historico.json";
const CODEWARS_API_URL = "https://www.codewars.com/api/v1/users";
const CODEWARS_PROFILE_URL = "https://www.codewars.com/users";

const PODIUM_SIZE = 3;

const elements = {
    ranking:
        document.getElementById("ranking"),

    podium:
        document.getElementById("podium"),

    dailyPenaltyHistory:
        document.getElementById(
            "daily-penalty-history"
        ),

    historyList:
        document.getElementById("history-list"),

    refreshButton:
        document.getElementById("refresh-button"),

    historyToggle:
        document.getElementById("history-toggle"),

    historyContent:
        document.getElementById("history-content"),

    seasonPeriod:
        document.getElementById("season-period"),

    participantsCount:
        document.getElementById("participants-count"),

    leaderName:
        document.getElementById("leader-name"),

    daysLeft:
        document.getElementById("days-left"),

    lastUpdate:
        document.getElementById("last-update")
};


/* =========================
   EVENTS
========================= */

elements.refreshButton.addEventListener(
    "click",
    loadData
);


elements.historyToggle.addEventListener(
    "click",
    toggleHistory
);


function toggleHistory() {

    const isExpanded =
        elements.historyToggle.getAttribute(
            "aria-expanded"
        ) === "true";


    elements.historyToggle.setAttribute(
        "aria-expanded",
        String(!isExpanded)
    );


    elements.historyContent.hidden =
        isExpanded;
}

async function loadData() {

    setLoading(true);

    try {

        const data =
            await fetchCompetitionData();


        renderSeasonInfo(
            data.current
        );


        await renderCurrentSeason(
            data.current,
            data.history
        );


        renderHistory(
            data.history
        );

    } catch (error) {

        console.error(error);

        renderLoadError();

    } finally {

        setLoading(false);
    }
}


async function fetchCompetitionData() {

    const response =
        await fetch(
            `${HISTORY_URL}?v=${Date.now()}`
        );


    if (!response.ok) {

        throw new Error(
            "Não foi possível carregar a competição."
        );
    }


    return response.json();
}


function renderLoadError() {

    elements.podium.innerHTML = "";

    elements.dailyPenaltyHistory.hidden =
        true;


    elements.ranking.innerHTML = `
        <div class="error">
            Não foi possível carregar o ranking.
        </div>
    `;
}

function renderSeasonInfo(current) {

    const startDate =
        parseLocalDate(
            current.startDate
        );


    const endDate =
        getSeasonEndDate(
            startDate
        );


    elements.seasonPeriod.textContent =
        `${formatDate(startDate)} → ${formatDate(endDate)}`;


    elements.participantsCount.textContent =
        current.participants?.length ?? 0;


    elements.daysLeft.textContent =
        formatDaysLeft(
            endDate
        );
}

async function renderCurrentSeason(
    current,
    history
) {

    renderLastDailyLoser(
        history
    );


    if (!hasParticipants(current)) {

        renderEmptyRanking();

        return;
    }


    const players =
        await loadPlayers(
            current.participants
        );


    sortPlayers(
        players
    );


    const validPlayers =
        players.filter(
            player =>
                !player.error
        );


    const podiumPlayers =
        validPlayers.slice(
            0,
            PODIUM_SIZE
        );


    const lastPlayer =
        validPlayers.at(-1);


    renderPodium(
        podiumPlayers
    );


    renderRanking(
        players,
        podiumPlayers,
        lastPlayer
    );


    renderLeader(
        validPlayers[0]
    );


    renderLastUpdate();
}


function hasParticipants(current) {

    return (
        current.participants &&
        current.participants.length > 0
    );
}


function renderEmptyRanking() {

    elements.podium.innerHTML = "";
    elements.podium.hidden = true;

    elements.leaderName.textContent = "-";


    elements.ranking.innerHTML = `
        <div class="empty-state">
            Nenhum participante cadastrado.
        </div>
    `;
}

async function loadPlayers(participants) {

    return Promise.all(
        participants.map(
            getPlayerScore
        )
    );
}


async function getPlayerScore(player) {

    try {

        const user =
            await fetchCodewarsUser(
                player.codewarsUsername
            );


        const currentHonor =
            Number(
                user.honor
            );


        const initialHonor =
            Number(
                player.initialHonor
            );


        return {
            name:
                player.name,

            username:
                player.codewarsUsername,

            currentHonor,
            initialHonor,

            kyu:
                user.ranks?.overall?.name
                ?? "sem rank",

            points:
                Math.max(
                    0,
                    currentHonor -
                    initialHonor
                ),

            error:
                false
        };

    } catch (error) {

        console.error(error);


        return {
            name:
                player.name,

            username:
                player.codewarsUsername,

            kyu:
                "indisponível",

            points:
                0,

            error:
                true
        };
    }
}


async function fetchCodewarsUser(username) {

    const encodedUsername =
        encodeURIComponent(
            username
        );


    const response =
        await fetch(
            `${CODEWARS_API_URL}/${encodedUsername}`
        );


    if (!response.ok) {

        throw new Error(
            `Erro ao consultar ${username}`
        );
    }


    return response.json();
}


function sortPlayers(players) {

    players.sort(
        (a, b) => {

            if (a.error && !b.error)
                return 1;

            if (!a.error && b.error)
                return -1;

            return (
                b.points -
                a.points
            );
        }
    );
}

function renderPodium(players) {

    if (players.length === 0) {

        elements.podium.innerHTML = "";
        elements.podium.hidden = true;

        return;
    }


    elements.podium.hidden = false;


    const positions = [
        {
            player:
                players[1],

            place:
                2
        },
        {
            player:
                players[0],

            place:
                1
        },
        {
            player:
                players[2],

            place:
                3
        }
    ];


    elements.podium.innerHTML =
        positions
            .filter(
                item =>
                    item.player
            )
            .map(
                createPodiumPlayerHtml
            )
            .join("");
}


function createPodiumPlayerHtml({
    player,
    place
}) {

    const initials =
        getInitials(
            player.name
        );


    const profileUrl =
        getProfileUrl(
            player.username
        );


    const crown =
        place === 1
            ? createCrownHtml()
            : "";


    return `
        <a
            class="podium-player podium-place-${place}"
            href="${profileUrl}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="${place}º lugar: ${escapeHtml(player.name)}"
        >

            <div class="podium-person">

                ${crown}

                <div class="podium-avatar">
                    ${escapeHtml(initials)}
                </div>

                <strong class="podium-name">
                    ${escapeHtml(player.name)}
                </strong>

                <span class="podium-points">
                    +${formatNumber(player.points)} pts
                </span>

            </div>

            <div class="podium-base">

                <span class="podium-number">
                    ${place}
                </span>

                <span class="podium-label">
                    lugar
                </span>

            </div>

        </a>
    `;
}


function createCrownHtml() {

    return `
        <div
            class="podium-crown"
            aria-hidden="true"
        >
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
}


/* =========================
   RANKING LIST
========================= */

function renderRanking(
    players,
    podiumPlayers,
    lastPlayer
) {

    const podiumUsernames =
        new Set(
            podiumPlayers.map(
                player =>
                    player.username
            )
        );


    const remainingPlayers =
        players.filter(
            player =>
                !podiumUsernames.has(
                    player.username
                )
        );


    if (remainingPlayers.length === 0) {

        elements.ranking.innerHTML = "";

        return;
    }


    elements.ranking.innerHTML =
        remainingPlayers
            .map(
                player => {

                    const position =
                        players.indexOf(player) + 1;


                    const isLast =
                        !player.error &&
                        lastPlayer?.username ===
                        player.username;


                    return createPlayerHtml(
                        player,
                        position,
                        isLast
                    );
                }
            )
            .join("");
}


function createPlayerHtml(
    player,
    position,
    isLast = false
) {

    const initials =
        getInitials(
            player.name
        );


    const profileUrl =
        getProfileUrl(
            player.username
        );


    const lastClass =
        isLast
            ? "player-last"
            : "";


    if (player.error) {

        return createPlayerErrorHtml(
            player,
            position,
            initials,
            profileUrl
        );
    }


    return `
        <article class="player ${lastClass}">

            <div class="player-position">
                ${position}º
            </div>

            <div class="player-avatar">
                ${escapeHtml(initials)}
            </div>

            <div class="player-info">

                ${createPlayerNameHtml(
                    player,
                    profileUrl
                )}

                ${
                    isLast
                        ? createDailyPenaltyBadgeHtml()
                        : ""
                }

                <span class="player-kyu">
                    ${escapeHtml(player.kyu)}
                </span>

                <div class="player-honor">

                    <span>
                        Inicial
                        <strong>
                            ${formatNumber(player.initialHonor)}
                        </strong>
                    </span>

                    <span
                        class="honor-divider"
                        aria-hidden="true"
                    >
                        •
                    </span>

                    <span>
                        Atual
                        <strong>
                            ${formatNumber(player.currentHonor)}
                        </strong>
                    </span>

                </div>

            </div>

            <div class="player-score">

                <strong class="player-points">
                    +${formatNumber(player.points)}
                </strong>

                <span class="player-score-label">
                    pts
                </span>

            </div>

        </article>
    `;
}


function createPlayerErrorHtml(
    player,
    position,
    initials,
    profileUrl
) {

    return `
        <article class="player">

            <div class="player-position">
                ${position}º
            </div>

            <div class="player-avatar">
                ${escapeHtml(initials)}
            </div>

            <div class="player-info">

                ${createPlayerNameHtml(
                    player,
                    profileUrl
                )}

                <span class="player-error">
                    Não foi possível consultar o Codewars
                </span>

            </div>

            <div class="player-score">

                <strong class="player-points">
                    —
                </strong>

            </div>

        </article>
    `;
}


function createPlayerNameHtml(
    player,
    profileUrl
) {

    return `
        <div class="player-name-row">

            <span class="player-name">
                ${escapeHtml(player.name)}
            </span>

            <a
                class="profile-link"
                href="${profileUrl}"
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir perfil no Codewars"
            >
                Perfil ↗
            </a>

        </div>
    `;
}


function createDailyPenaltyBadgeHtml() {

    return `
        <div class="daily-penalty-badge">
            PRÓXIMA DAILY É SUA
        </div>
    `;
}

function renderLeader(leader) {

    elements.leaderName.textContent =
        leader
            ? leader.name
            : "-";
}


function renderLastUpdate() {

    elements.lastUpdate.textContent =
        `Atualizado ${formatTime(new Date())}`;
}

function renderLastDailyLoser(history) {

    const lastSeason =
        history?.at(-1);


    const loser =
        lastSeason?.ranking?.at(-1);


    if (!loser) {

        elements.dailyPenaltyHistory.hidden =
            true;

        elements.dailyPenaltyHistory.innerHTML =
            "";

        return;
    }


    elements.dailyPenaltyHistory.hidden =
        false;


    elements.dailyPenaltyHistory.innerHTML = `
        <div
            class="daily-penalty-icon"
            aria-hidden="true"
        >
            !
        </div>

        <div class="daily-penalty-history-info">

            <span>
                ÚLTIMO A PAGAR A PRENDA
            </span>

            <strong>
                ${escapeHtml(loser.name)}
            </strong>

            <small>
                Apresentou a daily por 1 semana
            </small>

        </div>
    `;
}

function renderHistory(history) {

    if (!history?.length) {

        elements.historyList.innerHTML = `
            <div class="empty-state">
                Nenhuma temporada encerrada.
            </div>
        `;

        return;
    }


    elements.historyList.innerHTML =
        history
            .slice()
            .reverse()
            .map(
                createHistoryHtml
            )
            .join("");
}


function createHistoryHtml(season) {

    const ranking =
        season.ranking
            .map(
                createHistoryPlayerHtml
            )
            .join("");


    return `
        <div class="history-item">

            <div class="history-title">

                ${formatDate(
                    parseLocalDate(
                        season.startDate
                    )
                )}

                →

                ${formatDate(
                    parseLocalDate(
                        season.endDate
                    )
                )}

            </div>

            ${ranking}

        </div>
    `;
}


function createHistoryPlayerHtml(
    player,
    index
) {

    const medals = [
        "🥇",
        "🥈",
        "🥉"
    ];


    const position =
        medals[index]
        ?? `${index + 1}º`;


    return `
        <div class="history-player">

            <span>
                ${position}
                ${escapeHtml(player.name)}
            </span>

            <strong>
                ${formatNumber(player.points)} pts
            </strong>

        </div>
    `;
}

function getProfileUrl(username) {

    return (
        `${CODEWARS_PROFILE_URL}/${encodeURIComponent(
            username
        )}`
    );
}

function getSeasonEndDate(startDate) {

    return new Date(
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        20
    );
}


function formatDaysLeft(endDate) {

    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const target =
        new Date(
            endDate
        );


    target.setHours(
        23,
        59,
        59,
        999
    );


    const millisecondsPerDay =
        86400000;


    const days =
        Math.max(
            0,
            Math.ceil(
                (target - today) /
                millisecondsPerDay
            )
        );


    if (days === 0)
        return "hoje";

    if (days === 1)
        return "1 dia";

    return `${days} dias`;
}


function parseLocalDate(value) {

    const [
        year,
        month,
        day
    ] =
        value
            .split("-")
            .map(Number);


    return new Date(
        year,
        month - 1,
        day
    );
}

function formatDate(date) {

    return date.toLocaleDateString(
        "pt-BR",
        {
            day:
                "2-digit",

            month:
                "2-digit"
        }
    );
}


function formatTime(date) {

    return date.toLocaleTimeString(
        "pt-BR",
        {
            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );
}


function formatNumber(value) {

    return Number(
        value
    ).toLocaleString(
        "pt-BR"
    );
}

function setLoading(isLoading) {

    elements.refreshButton.disabled =
        isLoading;


    elements.refreshButton.classList.toggle(
        "loading",
        isLoading
    );
}

function getInitials(name) {

    const words =
        String(name)
            .trim()
            .split(/\s+/);


    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();
    }


    return (
        words[0][0] +
        words.at(-1)[0]
    ).toUpperCase();
}


function escapeHtml(value) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


/* START */

loadData();