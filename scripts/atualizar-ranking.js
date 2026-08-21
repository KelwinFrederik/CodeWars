const fs = require("fs");
const path = require("path");

const HISTORY_FILE = path.join(
    __dirname,
    "..",
    "historico.json"
);

async function getCodewarsHonor(username) {

    const url =
         `https://www.codewars.com/api/v1/users/${encodeURIComponent(username)}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Erro ao consultar Codewars: ${username}`
        );
    }

    const data = await response.json();

    return data.honor;
}


async function main() {

    console.log("Iniciando atualização do ranking...");

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

    console.log(
        `Temporada iniciada em: ${current.startDate}`
    );

    const finalRanking = [];

    /*
     * Consulta o Honor atual de cada participante.
     */
    for (const participant of current.participants) {

        console.log(
            `Consultando ${participant.codewarsUsername}...`
        );

        const currentHonor =
            await getCodewarsHonor(
                participant.codewarsUsername
            );

        const points =
            currentHonor - participant.initialHonor;

        finalRanking.push({
            name: participant.name,
            username: participant.codewarsUsername,
            points: Math.max(0, points),
            initialHonor: participant.initialHonor,
            finalHonor: currentHonor
        });
    }

    /*
     * Maior pontuação primeiro.
     */
    finalRanking.sort(
        (a, b) => b.points - a.points
    );

    /*
     * O ciclo termina no dia anterior ao novo ciclo.
     */
    const newStartDate =
        new Date(current.startDate);

    const newEndDate =
        new Date(newStartDate);

    newEndDate.setDate(
        newEndDate.getDate() - 1
    );

    /*
     * Salva a temporada encerrada.
     */
    const finishedSeason = {

        startDate: current.startDate,

        endDate:
            formatDate(newEndDate),

        ranking:
            finalRanking.map(player => ({
                name: player.name,
                username: player.username,
                points: player.points
            }))
    };

    data.history.push(
        finishedSeason
    );

    /*
     * Cria a nova temporada.
     *
     * O Honor final da temporada anterior
     * vira o Honor inicial da nova temporada.
     */
    const newParticipants =
        finalRanking.map(player => ({

            name: player.name,

            codewarsUsername:
                player.username,

            initialHonor:
                player.finalHonor
        }));

    data.current = {

        startDate:
            formatDate(new Date()),

        participants:
            newParticipants
    };

    /*
     * Salva o arquivo.
     */
    fs.writeFileSync(
        HISTORY_FILE,
        JSON.stringify(data, null, 2) + "\n"
    );

    console.log("");
    console.log("Temporada encerrada!");

    console.log("");

    console.log("Ranking:");

    finalRanking.forEach(
        (player, index) => {

            console.log(
                `${index + 1}º ${player.name}: ${player.points} pontos`
            );
        }
    );

    console.log("");

    console.log(
        `Nova temporada iniciada em ${data.current.startDate}`
    );

    console.log("Atualização concluída.");
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
    console.error("ERRO:");
    console.error(error.message);

    process.exit(1);
});
