/**
 * Bot de ações (Stock Market) para Bitburner.
 *
 * Estratégia simples:
 * - Compra quando o forecast superar um limiar e a volatilidade for baixa.
 * - Vende quando o forecast cair abaixo de um limite ou quando houver lucro > 10%.
 * - Mantém uma reserva mínima de dinheiro.
 *
 * Observação: este script não aceita argumentos; ajuste as constantes abaixo.
 * @param {NS} ns
 */
export async function main(ns) {
	// Log inicial e desabilitar logs verbosos
	ns.print("Iniciando script aqui");
	ns.disableLog('sleep');
	ns.disableLog('getServerMoneyAvailable');

	// Símbolos disponíveis e portfólio atual
	let stockSymbols = ns.stock.getSymbols(); // todos os símbolos
	let portfolio = []; // inicializa o portfólio
	let cycle = 0;
	// ~~~~~~~Você pode editar estes valores~~~~~~~~
	const forecastThresh = 0.65; // Comprar acima deste nível de confiança (forecast%)
	const minimumCash = 50000000; // Dinheiro mínimo para manter em caixa
	// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	// Verifica e adiciona ao portfólio as ações que já possuímos
	ns.print("Iniciando execução - Já possuímos alguma ação?");
	for (const stock of stockSymbols) {
		let pos = ns.stock.getPosition(stock);
		if (pos[0] > 0) {
			portfolio.push({ sym: stock, value: pos[1], shares: pos[0] })
			ns.print('Detectado: ' + stock + ' qtde: ' + pos[0] + ' @ ' + pos[1]);
		};
	};

	// Loop principal do bot
	while (true) {
		for (const stock of stockSymbols) { // para cada símbolo de ação
			if (portfolio.findIndex(obj => obj.sym === stock) !== -1) { // se já possuímos esta ação
				let i = portfolio.findIndex(obj => obj.sym === stock); // índice do símbolo no portfólio
				if (ns.stock.getAskPrice(stock) >= portfolio.value * 1.1) { // se preço >= preço de compra +10%, então VENDE
					sellStock(stock);
				}
				else if (ns.stock.getForecast(stock) < 0.4) {
					sellStock(stock);
				}
			}

			else if (ns.stock.getForecast(stock) >= forecastThresh) { // se forecast >= limiar e não possuímos, então COMPRA
				buyStock(stock);
			}
		} // fim do for (iterando stockSymbols)
		cycle++;
		if (cycle % 5 === 0) { ns.print('Ciclo ' + cycle + ' concluído') };
		await ns.sleep(6000);
	} // fim do while(true)

	// Compra uma ação se a volatilidade for baixa
	function buyStock(stock) {
		let stockPrice = ns.stock.getAskPrice(stock); // obtém o preço atual (ask)
		let shares = stockBuyQuantCalc(stockPrice, stock); // calcula a quantidade de ações a comprar

		if (ns.stock.getVolatility(stock) <= 0.05) { // se volatilidade < 5%, compra
			ns.stock.buyStock(stock, shares);
			ns.print('Comprado: ' + stock + ' qtde: ' + Math.round(shares) + ' @ ' + Math.round(stockPrice));

			portfolio.push({ sym: stock, value: stockPrice, shares: shares }); // armazena a compra no portfólio
		}
	}

	// Vende uma ação se as condições de saída forem atendidas
	function sellStock(stock) {
		let position = ns.stock.getPosition(stock);
		var forecast = ns.stock.getForecast(stock);
		if (forecast < 0.55) {
			let i = portfolio.findIndex(obj => obj.sym === stock); // encontra a ação no portfólio
			ns.print('VENDIDO: ' + stock + ' qtde: ' + portfolio.shares + ' @ ' + portfolio.value);
			portfolio.splice(i, 1); // remove a ação do portfólio
			ns.stock.sellStock(stock, position[0]);

		}
	};

	// Calcula quantas ações comprar com base no caixa disponível
	function stockBuyQuantCalc(stockPrice, stock) { // calcula quantas ações comprar
		let playerMoney = ns.getServerMoneyAvailable('home') - minimumCash;
		let maxSpend = playerMoney * 0.25; // usa no máximo 25% do excedente
		let calcShares = maxSpend / stockPrice;
		let maxShares = ns.stock.getMaxShares(stock);

		if (calcShares > maxShares) {
			return maxShares
		}
		else { return calcShares }
	}
}
