/**
 * Solvers de Coding Contracts, indexados pelo nome do tipo (CodingContractName).
 * Cada solver recebe `data` (de getData) e devolve a resposta no formato esperado.
 * Tipos sem solver aqui são PULADOS pelo manager — nunca tentamos um que não sabemos
 * resolver (tentar e errar gasta as tentativas e pode destruir o contrato).
 */

function maxProfitK(k, prices) {
    const n = prices.length;
    if (n < 2 || k <= 0) return 0;
    if (k >= n / 2) {
        let p = 0;
        for (let i = 1; i < n; i++) if (prices[i] > prices[i - 1]) p += prices[i] - prices[i - 1];
        return p;
    }
    const buy = new Array(k + 1).fill(-Infinity);
    const sell = new Array(k + 1).fill(0);
    for (const price of prices) {
        for (let j = 1; j <= k; j++) {
            buy[j] = Math.max(buy[j], sell[j - 1] - price);
            sell[j] = Math.max(sell[j], buy[j] + price);
        }
    }
    return sell[k];
}

export const SOLVERS = {
    "Find Largest Prime Factor": (n) => {
        let largest = 1, num = n;
        for (let f = 2; f * f <= num; f++) {
            while (num % f === 0) { largest = f; num /= f; }
        }
        return num > 1 ? num : largest;
    },

    "Subarray with Maximum Sum": (arr) => {
        let best = arr[0], cur = arr[0];
        for (let i = 1; i < arr.length; i++) {
            cur = Math.max(arr[i], cur + arr[i]);
            best = Math.max(best, cur);
        }
        return best;
    },

    "Total Ways to Sum": (n) => {
        const ways = new Array(n + 1).fill(0);
        ways[0] = 1;
        for (let i = 1; i < n; i++)
            for (let j = i; j <= n; j++) ways[j] += ways[j - i];
        return ways[n];
    },

    "Total Ways to Sum II": ([target, nums]) => {
        const ways = new Array(target + 1).fill(0);
        ways[0] = 1;
        for (const num of nums)
            for (let j = num; j <= target; j++) ways[j] += ways[j - num];
        return ways[target];
    },

    "Spiralize Matrix": (m) => {
        const res = [];
        if (!m.length) return res;
        let top = 0, bottom = m.length - 1, left = 0, right = m[0].length - 1;
        while (top <= bottom && left <= right) {
            for (let c = left; c <= right; c++) res.push(m[top][c]);
            top++;
            for (let r = top; r <= bottom; r++) res.push(m[r][right]);
            right--;
            if (top <= bottom) { for (let c = right; c >= left; c--) res.push(m[bottom][c]); bottom--; }
            if (left <= right) { for (let r = bottom; r >= top; r--) res.push(m[r][left]); left++; }
        }
        return res;
    },

    "Array Jumping Game": (arr) => {
        let reach = 0;
        for (let i = 0; i < arr.length; i++) {
            if (i > reach) return 0;
            reach = Math.max(reach, i + arr[i]);
        }
        return 1;
    },

    "Array Jumping Game II": (arr) => {
        const n = arr.length;
        const dp = new Array(n).fill(Infinity);
        dp[0] = 0;
        for (let i = 0; i < n; i++) {
            if (dp[i] === Infinity) continue;
            for (let j = 1; j <= arr[i] && i + j < n; j++) dp[i + j] = Math.min(dp[i + j], dp[i] + 1);
        }
        return dp[n - 1] === Infinity ? 0 : dp[n - 1];
    },

    "Merge Overlapping Intervals": (intervals) => {
        const arr = intervals.slice().sort((a, b) => a[0] - b[0]);
        const res = [];
        for (const [s, e] of arr) {
            const last = res[res.length - 1];
            if (last && s <= last[1]) last[1] = Math.max(last[1], e);
            else res.push([s, e]);
        }
        return res;
    },

    "Generate IP Addresses": (s) => {
        const res = [];
        const n = s.length;
        const valid = p => p.length >= 1 && p.length <= 3 && (p.length === 1 || p[0] !== "0") && Number(p) <= 255;
        for (let a = 1; a <= 3; a++)
            for (let b = 1; b <= 3; b++)
                for (let c = 1; c <= 3; c++) {
                    const d = n - a - b - c;
                    if (d < 1 || d > 3) continue;
                    const p1 = s.slice(0, a), p2 = s.slice(a, a + b), p3 = s.slice(a + b, a + b + c), p4 = s.slice(a + b + c);
                    if ([p1, p2, p3, p4].every(valid)) res.push(`${p1}.${p2}.${p3}.${p4}`);
                }
        return res;
    },

    "Algorithmic Stock Trader I": (prices) => {
        let minP = Infinity, best = 0;
        for (const p of prices) { minP = Math.min(minP, p); best = Math.max(best, p - minP); }
        return best;
    },

    "Algorithmic Stock Trader II": (prices) => {
        let profit = 0;
        for (let i = 1; i < prices.length; i++) if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];
        return profit;
    },

    "Algorithmic Stock Trader III": (prices) => maxProfitK(2, prices),

    "Algorithmic Stock Trader IV": ([k, prices]) => maxProfitK(k, prices),

    "Minimum Path Sum in a Triangle": (tri) => {
        const dp = tri[tri.length - 1].slice();
        for (let r = tri.length - 2; r >= 0; r--)
            for (let c = 0; c < tri[r].length; c++)
                dp[c] = tri[r][c] + Math.min(dp[c], dp[c + 1]);
        return dp[0];
    },

    "Unique Paths in a Grid I": ([rows, cols]) => {
        const dp = new Array(cols).fill(1);
        for (let r = 1; r < rows; r++)
            for (let c = 1; c < cols; c++) dp[c] += dp[c - 1];
        return dp[cols - 1];
    },

    "Unique Paths in a Grid II": (grid) => {
        const R = grid.length, C = grid[0].length;
        const dp = Array.from({ length: R }, () => new Array(C).fill(0));
        for (let r = 0; r < R; r++)
            for (let c = 0; c < C; c++) {
                if (grid[r][c] === 1) { dp[r][c] = 0; continue; }
                if (r === 0 && c === 0) { dp[r][c] = 1; continue; }
                dp[r][c] = (r > 0 ? dp[r - 1][c] : 0) + (c > 0 ? dp[r][c - 1] : 0);
            }
        return dp[R - 1][C - 1];
    },

    "Proper 2-Coloring of a Graph": ([n, edges]) => {
        const adj = Array.from({ length: n }, () => []);
        for (const [u, v] of edges) { adj[u].push(v); adj[v].push(u); }
        const color = new Array(n).fill(-1);
        for (let s = 0; s < n; s++) {
            if (color[s] !== -1) continue;
            color[s] = 0;
            const q = [s];
            while (q.length) {
                const u = q.shift();
                for (const v of adj[u]) {
                    if (color[v] === -1) { color[v] = 1 - color[u]; q.push(v); }
                    else if (color[v] === color[u]) return [];
                }
            }
        }
        return color;
    },

    "Encryption I: Caesar Cipher": ([text, shift]) =>
        text.split("").map(ch => {
            if (ch === " ") return " ";
            return String.fromCharCode((ch.charCodeAt(0) - 65 - shift + 26) % 26 + 65);
        }).join(""),

    "Encryption II: Vigenère Cipher": ([text, key]) => {
        let res = "";
        for (let i = 0; i < text.length; i++) {
            const t = text.charCodeAt(i) - 65;
            const k = key.charCodeAt(i % key.length) - 65;
            res += String.fromCharCode((t + k) % 26 + 65);
        }
        return res;
    }
};
