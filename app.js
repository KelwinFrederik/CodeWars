const HISTORY_URL = "./historico.json";

const rankingElement =
    document.getElementById("ranking");

const historyElement =
    document.getElementById("history-list");

const refreshButton =
    document.getElementById("refresh-button");

const historyToggle =
    document.getElementById("history-toggle");

const historyContent =
    document.getElementById("history-content");


refreshButton.addEventListener(
    "click",
    loadData
);


historyToggle.addEventListener(
    "click",
    () => {

        const expanded =
            historyToggle.getAttribute(
                "aria-expanded"
            ) === "true";

        historyToggle.setAttribute(
            "aria-expanded",
            String(!expanded)
        );

        historyContent.hidden =
            expanded;
    }
);


async function loadData() {

    setLoading(true);

    try {

        const response =
            await fetch(
                `${HISTORY_URL}?v=${Date.now()}`
            );

        if (!response.ok) {
            throw new Error(
                "Não foi possível carregar a competição."
            );
        }


        const data =
            await response.json();


        renderSeasonInfo(
            data.current
        );


        await renderCurrentSeason(
            data.current
        );


        renderHistory(
            data.history
        );

    } catch (error) {

        console.error(error);

        rankingElement.innerHTML =
            `
            <div class="error">
                Não foi possível carregar o ranking.
            </div>
            `;

    } finally {

        setLoading(false);
    }
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


    document.getElementById(
        "season-period"
    ).textContent =
        `${formatDate(startDate)} → ${formatDate(endDate)}`;


    document.getElementById(
        "participants-count"
    ).textContent =
        current.participants?.length ?? 0;


    document.getElementById(
        "days-left"
    ).textContent =
        formatDaysLeft(
            endDate
        );
}


async function renderCurrentSeason(current) {

    if (
        !current.participants ||
        current.participants.length === 0
    ) {

        rankingElement.innerHTML =
            `
            <div class="empty-state">
                Nenhum participante cadastrado.
            </div>
            `;

        return;
    }


    const players =
        await Promise.all(
            current.participants.map(
                getPlayerScore
            )
        );


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


    rankingElement.innerHTML =
        players
            .map(
                createPlayerHtml
            )
            .join("");


    const leader =
        players.find(
            player =>
                !player.error
        );


    document.getElementById(
        "leader-name"
    ).textContent =
        leader
            ? leader.name
            : "-";


    document.getElementById(
        "last-update"
    ).textContent =
        `Atualizado ${formatTime(new Date())}`;
}


async function getPlayerScore(player) {

    try {

        const username =
            encodeURIComponent(
                player.codewarsUsername
            );


        const response =
            await fetch(
                `https://www.codewars.com/api/v1/users/${username}`
            );


        if (!response.ok) {

            throw new Error(
                `Erro ao consultar ${player.codewarsUsername}`
            );
        }


        const user =
            await response.json();


        const currentHonor =
            Number(user.honor);


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

            error: false
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

            points: 0,

            error: true
        };
    }
}

function createPlayerHtml(
    player,
    index
) {
    const medals = [
        "🥇",
        "🥈",
        "🥉"
    ];

    const position =
        medals[index] ??
        `${index + 1}º`;

    const topClass =
        index < 3
            ? `player-top-${index + 1}`
            : "";

    const initials =
        getInitials(
            player.name
        );

    const profileUrl =
        `https://www.codewars.com/users/${encodeURIComponent(
            player.username
        )}`;

    if (player.error) {
        return `
            <article class="player ${topClass}">

                <div class="player-position">
                    ${position}
                </div>

                <div class="player-avatar">
                    ${escapeHtml(initials)}
                </div>

                <div class="player-info">

                    <div class="player-name-row">

                        <span class="player-name">
                            ${escapeHtml(player.name)}
                        </span>

                        <a
                            class="profile-link"
                            href="${profileUrl}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Perfil ↗
                        </a>

                    </div>

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

    return `
        <article class="player ${topClass}">

            <div class="player-position">
                ${position}
            </div>

            <div class="player-avatar">
                ${escapeHtml(initials)}
            </div>

            <div class="player-info">

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

                    <span class="honor-divider">
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

function renderHistory(history) {

    if (
        !history ||
        history.length === 0
    ) {

        historyElement.innerHTML =
            `
            <div class="empty-state">
                Nenhuma temporada encerrada.
            </div>
            `;

        return;
    }


    historyElement.innerHTML =
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
                (
                    player,
                    index
                ) => {

                    const position =
                        ["🥇", "🥈", "🥉"][index]
                        ?? `${index + 1}º`;


                    return `
                        <div class="history-player">

                            <span>
                                ${position}
                                ${escapeHtml(player.name)}
                            </span>

                            <strong>
                                ${formatNumber(player.points)}
                                pts
                            </strong>

                        </div>
                    `;
                }
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
        words[
            words.length - 1
        ][0]
    ).toUpperCase();
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


    const days =
        Math.max(
            0,
            Math.ceil(
                (
                    target -
                    today
                )
                /
                86400000
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

    return date
        .toLocaleDateString(
            "pt-BR",
            {
                day: "2-digit",
                month: "2-digit"
            }
        );
}


function formatTime(date) {

    return date
        .toLocaleTimeString(
            "pt-BR",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
}


function formatNumber(value) {

    return Number(value)
        .toLocaleString(
            "pt-BR"
        );
}


function setLoading(isLoading) {

    refreshButton.disabled =
        isLoading;


    refreshButton.classList.toggle(
        "loading",
        isLoading
    );
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


loadData();
