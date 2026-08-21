const fs = require("fs");
const path = require("path");

const HISTORY_FILE = path.join(
    __dirname,
    "..",
    "historico.json"
);

const TIMEZONE = "America/Sao_Paulo";


async function getCodewarsHonor(username) {

    const url =
        `https://www.codewars.com/api/v1/users/${encodeURIComponent(username)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Erro ao consultar Codewars: ${username} (${response.status})`
        );
    }

    const data = await response.json();

    if (typeof data.honor !== "number") {
        throw new Error(
            `Honor inválido retornado pelo Codewars para ${username}`
        );
    }

    return data.honor;
}


async function main() {

    console.log("======================================");
    console.log(" BotosCodeWars - Fechamento de ciclo");
    console.log("======================================");
    console.log("");

    const data = JSON.parse(
        fs.readFileSync(HISTORY_FILE, "utf8")
    );

    const current = data.current;

    if (!current) {
        throw new Error(
            "Nenhuma temporada atual encontrada."
        );
    }

    if (
        !current.participants ||
        current.participants.length === 0
    ) {
        throw new Error(
            "Nenhum participante cadastrado."
        );
    }

    /*
     * Garante que history sempre exista.
     */
    if (!Array.isArray(data.history)) {
        data.history = [];
    }


    /*
     * Data atual no horário de São Paulo.
     *
     * Isso evita depender do timezone UTC
     * da máquina do GitHub Actions.
     */
    const today = getTodayInTimeZone();


    /*
     * Calcula quando a próxima temporada
     * deve começar.
     *
     * Ex:
     *
     * Atual:
     * 21/08/2026
     *
     * Próxima:
     * 21/09/2026
     */
    const currentStart =
        parseDate(current.startDate);

    const nextCycleStart =
        new Date(
            currentStart.getFullYear(),
            currentStart.getMonth() + 1,
            21
        );


    /*
     * PROTEÇÃO CONTRA EXECUÇÃO DUPLICADA
     *
     * Se a próxima temporada ainda não chegou,
     * simplesmente encerra sem alterar o JSON.
     */
    if (today < nextCycleStart) {

        console.log(
            `Temporada atual: ${formatDate(currentStart)}`
        );

        console.log(
            `Próximo fechamento: ${formatDate(nextCycleStart)}`
        );

        console.log("");
        console.log(
            "A temporada ainda não terminou."
        );

        console.log(
            "Nenhuma alteração será realizada."
        );

        return;
    }


    /*
     * A temporada termina um dia antes
     * da próxima começar.
     *
     * 21/08 → 20/09
     */
    const currentEndDate =
        new Date(nextCycleStart);

    currentEndDate.setDate(
        currentEndDate.getDate() - 1
    );


    console.log(
        `Fechando temporada:`
    );

    console.log(
        `${formatDate(currentStart)} → ${formatDate(currentEndDate)}`
    );

    console.log("");


    /*
     * Consulta Honor atual.
     */
    const finalRanking = [];

    for (const participant of current.participants) {

        console.log(
            `Consultando ${participant.codewarsUsername}...`
        );

        const currentHonor =
            await getCodewarsHonor(
                participant.codewarsUsername
            );

        const initialHonor =
            Number(participant.initialHonor);

        const points =
            Math.max(
                0,
                currentHonor - initialHonor
            );

        finalRanking.push({

            name:
                participant.name,

            username:
                participant.codewarsUsername,

            points,

            initialHonor,

            finalHonor:
                currentHonor
        });


        console.log(
            `  Honor: ${initialHonor} → ${currentHonor} (+${points})`
        );
    }


    /*
     * Ranking do maior para o menor.
     */
    finalRanking.sort(
        (a, b) => b.points - a.points
    );


    /*
     * Salva temporada encerrada.
     */
    const finishedSeason = {

        startDate:
            formatDate(currentStart),

        endDate:
            formatDate(currentEndDate),

        ranking:
            finalRanking.map(
                player => ({

                    name:
                        player.name,

                    username:
                        player.username,

                    points:
                        player.points
                })
            )
    };


    data.history.push(
        finishedSeason
    );


    /*
     * Cria participantes da nova temporada.
     *
     * O Honor atual passa a ser o novo
     * ponto zero.
     */
    const newParticipants =
        finalRanking.map(
            player => ({

                name:
                    player.name,

                codewarsUsername:
                    player.username,

                initialHonor:
                    player.finalHonor
            })
        );


    /*
     * Nova temporada começa oficialmente
     * no dia 21 calculado anteriormente.
     */
    data.current = {

        startDate:
            formatDate(nextCycleStart),

        participants:
            newParticipants
    };


    /*
     * Salva historico.json.
     */
    fs.writeFileSync(
        HISTORY_FILE,
        JSON.stringify(data, null, 2) + "\n"
    );


    /*
     * Log final.
     */
    console.log("");
    console.log("======================================");
    console.log(" Ranking final");
    console.log("======================================");
    console.log("");


    finalRanking.forEach(
        (player, index) => {

            const medal =
                ["🥇", "🥈", "🥉"][index] ||
                `${index + 1}º`;

            console.log(
                `${medal} ${player.name}: ${player.points} pts`
            );
        }
    );


    console.log("");
    console.log(
        `Temporada encerrada: ${formatDate(currentStart)} → ${formatDate(currentEndDate)}`
    );

    console.log(
        `Nova temporada: ${formatDate(nextCycleStart)}`
    );

    console.log("");
    console.log(
        "Atualização concluída com sucesso."
    );
}


/*
 * Retorna a data atual considerando
 * America/Sao_Paulo.
 */
function getTodayInTimeZone() {

    const formatter =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: TIMEZONE,
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        );


    const parts =
        formatter.formatToParts(
            new Date()
        );


    const values = {};

    for (const part of parts) {

        if (part.type !== "literal") {
            values[part.type] =
                Number(part.value);
        }
    }


    return new Date(
        values.year,
        values.month - 1,
        values.day
    );
}


/*
 * Evita problemas de timezone causados por:
 *
 * new Date("2026-08-21")
 *
 * que é interpretado originalmente como UTC.
 */
function parseDate(value) {

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

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


main().catch(error => {

    console.error("");
    console.error("======================================");
    console.error(" ERRO");
    console.error("======================================");

    console.error(
        error.message
    );

    process.exit(1);
});
