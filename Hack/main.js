/**
 * Orquestrador: enraíza servidores e inicia o controlador otimizado
 * para cada alvo lucrativo. Substitui o hackfhome e scripts antigos.
 *
 * Uso: run Hack/main.js [pctMoney=0.75] [secOffset=3] [hackFrac=0.1]
 * - Executa 1 instância de `Hack/hack.js` por servidor-alvo (no próprio host-alvo se tiver RAM; caso contrário, no home).
 *
 * @param {NS} ns
 */
export async function main(ns) {
  ns.disableLog('scan');
  ns.disableLog('sleep');
  ns.disableLog('exec');
  ns.disableLog('scp');
  ns.disableLog('getServerNumPortsRequired');
  ns.disableLog('getServerMaxMoney');
  ns.disableLog('getServerRequiredHackingLevel');
  ns.disableLog('getHackingLevel');
  ns.disableLog('getServerMaxRam');
  ns.disableLog('getServerUsedRam');
  ns.disableLog('isRunning');

  const pctMoney = Number(ns.args[0] ?? 0.75);
  const secOffset = Number(ns.args[1] ?? 3);
  const hackFrac = Number(ns.args[2] ?? 0.1);

  const controller = 'Hack/hack.js';
  const workers = ['Hack/_g.js', 'Hack/_h.js', 'Hack/_w.js'];

  const launched = new Set();

  while (true) {
    const all = discover(ns);
    const openers = getOpeners(ns);

    for (const s of all) {
      if (s === 'home') continue;

      // Tenta root se possível
      tryRoot(ns, s, openers);

      // Pula alvos sem dinheiro
      if (ns.getServerMaxMoney(s) <= 0) continue;
      if (!ns.hasRootAccess(s)) continue;
      if (ns.getServerRequiredHackingLevel(s) > ns.getHackingLevel()) continue;

      // Decide onde rodar o controlador: no próprio servidor se tiver RAM, senão em home
      const hostHasRam = ns.getServerMaxRam(s) - ns.getServerUsedRam(s) >= ns.getScriptRam(controller);
      const host = hostHasRam ? s : 'home';

      // Evita relançar com mesmos args já ativos
      const key = `${host}=>${s}`;
      const isRunning = ns.isRunning(controller, host, s, pctMoney, secOffset, hackFrac);
      if (isRunning) { launched.add(key); continue; }

      // Copia controlador e workers para o host executor
      await ensureFiles(ns, host, [controller, ...workers]);

      // Copia também para o alvo se o host for o próprio alvo (garante workers locais)
      if (host === s) await ensureFiles(ns, s, [controller, ...workers]);

      // Inicia 1 instância do controlador
      const pid = ns.exec(controller, host, 1, s, pctMoney, secOffset, hackFrac);
      if (pid) {
        launched.add(key);
        ns.print(`Started ${controller} on ${host} -> ${s}`);
        // Pequena pausa para não lançar muitos de uma vez
        await ns.sleep(50);
      }
    }

    // Pequena pausa antes de varrer novamente (novas ferramentas/níveis)
    await ns.sleep(5000);
  }
}

function discover(ns) {
  const seen = new Set(['home']);
  const stack = ['home'];
  while (stack.length) {
    const cur = stack.pop();
    for (const n of ns.scan(cur)) {
      if (!seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }
  return Array.from(seen);
}

function getOpeners(ns) {
  const ops = [];
  if (ns.fileExists('BruteSSH.exe', 'home')) ops.push((t) => ns.brutessh(t));
  if (ns.fileExists('FTPCrack.exe', 'home')) ops.push((t) => ns.ftpcrack(t));
  if (ns.fileExists('RelaySMTP.exe', 'home')) ops.push((t) => ns.relaysmtp(t));
  if (ns.fileExists('HTTPWorm.exe', 'home')) ops.push((t) => ns.httpworm(t));
  if (ns.fileExists('SQLInject.exe', 'home')) ops.push((t) => ns.sqlinject(t));
  return ops;
}

function tryRoot(ns, server, openers) {
  if (ns.hasRootAccess(server)) return;
  if (ns.getServerNumPortsRequired(server) > openers.length) return;
  for (const op of openers) try { op(server); } catch {}
  try { ns.nuke(server); } catch {}
}

async function ensureFiles(ns, host, files) {
  // Se já estão no host, scp ignora
  await ns.scp(files, host, 'home');
}
