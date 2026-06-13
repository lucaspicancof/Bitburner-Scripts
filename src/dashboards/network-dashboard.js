import {
    createWindow,
    updateWindow,
    removeWindow
}
from "/lib/ui.js";

import {
    scanAll,
    analyzeServer
}
from "/lib/network.js";

import {
    economicScore,
    prepPercent,
    isReady
}
from "/lib/scoring.js";

/** @param {NS} ns */
export async function main(ns) {

    const WINDOW_ID =
        "network-dashboard";

    ns.atExit(() => {
        removeWindow(WINDOW_ID);
    });

    createWindow(
        WINDOW_ID,
        "Network Dashboard"
    );

    while (true) {

        let servers =
            scanAll(ns)
                .map(server => {

                    const data =
                        analyzeServer(ns, server);

                    data.score =
                        economicScore(data);

                    data.prep =
                        prepPercent(data);

                    data.status =
                        isReady(data)
                            ? "READY"
                            : "PREP";

                    return data;
                })
                .filter(s => s.maxMoney > 0)
                .filter(s => s.rooted);

        servers.sort(
            (a, b) =>
                b.score - a.score
        );

        const top =
            servers.slice(0, 15);

        let html = "";

        html += `
            <div>
                <b>Hack Level:</b>
                ${ns.getHackingLevel()}
            </div>

            <div>
                <b>Servers:</b>
                ${servers.length}
            </div>

            <hr>
        `;

        html += `
            <table
                style="
                    width:100%;
                    border-collapse:collapse;
                "
            >
                <tr>
                    <th align="left">Server</th>
                    <th align="right">Prep</th>
                    <th align="right">Score</th>
                    <th align="center">Status</th>
                </tr>
        `;

        for (const server of top) {

            html += `
                <tr>
                    <td>${server.server}</td>

                    <td align="right">
                        ${server.prep.toFixed(0)}%
                    </td>

                    <td align="right">
                        ${ns.format.number(server.score)}
                    </td>

                    <td align="center">
                        ${server.status}
                    </td>
                </tr>
            `;
        }

        html += "</table>";

        updateWindow(
            WINDOW_ID,
            html
        );

        await ns.sleep(1000);
    }
}
