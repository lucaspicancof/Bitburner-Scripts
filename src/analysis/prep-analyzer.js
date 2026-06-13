import {
    scanAll
}
from "/lib/network.js";

import {
    calculatePrep
}
from "/lib/prep.js";

import {
    createWindow,
    updateWindow,
    removeWindow
}
from "/lib/ui.js";

/** @param {NS} ns */
export async function main(ns) {

    const WINDOW_ID =
        "prep-analyzer";

    ns.atExit(() => {
        removeWindow(WINDOW_ID);
    });

    createWindow(
        WINDOW_ID,
        "Prep Analyzer"
    );

    while (true) {

        const servers =
            scanAll(ns)
                .filter(
                    s =>
                        ns.hasRootAccess(s)
                )
                .filter(
                    s =>
                        ns.getServerMaxMoney(s) > 0
                );

        const analysis =
            servers.map(
                s =>
                    calculatePrep(
                        ns,
                        s
                    )
            );

        analysis.sort(
            (a, b) =>
                b.totalThreads -
                a.totalThreads
        );

        let html = "";

        html += `
            <div
                style="
                    display:flex;
                    gap:10px;
                    margin-bottom:15px;
                "
            >
                <div>
                    Servidores:
                    <b>${analysis.length}</b>
                </div>

                <div>
                    Total Threads:
                    <b>
                    ${
                        analysis
                            .reduce(
                                (
                                    sum,
                                    s
                                ) =>
                                    sum +
                                    s.totalThreads,
                                0
                            )
                    }
                    </b>
                </div>
            </div>
        `;

        html += `
            <table
                style="
                    width:100%;
                    border-collapse:collapse;
                    font-size:12px;
                "
            >
                <tr>
                    <th align="left">Server</th>
                    <th>Money</th>
                    <th>Sec</th>
                    <th>Grow</th>
                    <th>Weak</th>
                    <th>Total</th>
                    <th>Time</th>
                </tr>
        `;

        for (
            const s of
            analysis.slice(0, 30)
        ) {

            html += `
                <tr>
                    <td>${s.server}</td>
                    <td>${(s.currentMoney / s.maxMoney * 100).toFixed(0)}%</td>
                    <td>${s.securityGap.toFixed(1)}</td>
                    <td>${ns.format.number(s.growThreads)}</td>
                    <td>${ns.format.number(s.totalWeakenThreads)}</td>
                    <td>${ns.format.number(s.totalThreads)}</td>
                    <td>${(s.weakenTime / 1000 / 60).toFixed(1)}m</td>
                </tr>
            `;
        }

        html += "</table>";

        updateWindow(
            WINDOW_ID,
            html
        );

        await ns.sleep(3000);
    }
}
