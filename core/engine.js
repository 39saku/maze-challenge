// --- グローバル状態 ---
let currentLevel = 1;
let maze = [];
let visitCount = [];
let player = {};
let isRunning = false;
let finishTime = null;
let startTime;
let message = "";

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

function loadLevel(n) {
    isRunning = false;
    let data = ALL_MAPS.find(m => m.id === n);
    if (!data) return;

    currentLevel = n;
    maze = data.grid.map(row => [...row]);
    visitCount = maze.map(row => row.map(() => 0));
    player = {
        x: data.start.x, y: data.start.y,
        steps: 0, coins: 0,
        totalCoins: data.coins,
        dashDist: data.dashDist,
        isFrozen: false
    };
    visitCount[player.y][player.x] = 1;
    finishTime = null;
    message = `${data.name} をロードしました`;
}

// 参加者が使う関数
async function move(dir) {
    if (!isRunning || player.isFrozen || finishTime) return false;
    player.steps++;
    let dx = 0, dy = 0;
    if (dir === "up") dy = -1; else if (dir === "down") dy = 1;
    else if (dir === "left") dx = -1; else if (dir === "right") dx = 1;

    if (maze[player.y + dy][player.x + dx] !== 1) {
        player.x += dx; player.y += dy;
        visitCount[player.y][player.x]++;
        checkStatus();
        await sleep(500); return true;
    }
    await sleep(500); return false;
}

async function dash(dir) {
    if (!isRunning || player.isFrozen || finishTime) return;
    message = "DASH!!";
    let dx = 0, dy = 0;
    if (dir === "up") dy = -1; else if (dir === "down") dy = 1;
    else if (dir === "left") dx = -1; else if (dir === "right") dx = 1;

    for (let i = 0; i < player.dashDist; i++) {
        if (maze[player.y + dy][player.x + dx] !== 1) {
            player.x += dx; player.y += dy;
            visitCount[player.y][player.x]++;
            checkStatus();
        } else {
            player.steps += 10; // ペナルティ
            await freeze(3, "衝突！"); break;
        }
    }
    player.steps++; await sleep(500);
}

function checkStatus() {
    let cell = maze[player.y][player.x];
    if (cell === 2) { player.coins++; maze[player.y][player.x] = 0; message = "コイン獲得！"; }
    if (cell === 3) { freeze(3, "落とし穴！"); }
    if (cell === 4 && player.coins === player.totalCoins) {
        finishTime = (millis() - startTime) / 1000;
        isRunning = false; message = "CLEAR!!";
    }
}

async function freeze(sec, msg) {
    player.isFrozen = true; message = msg;
    await sleep(sec * 1000);
    player.isFrozen = false; message = "復帰しました";
}

function look(dir) {
    let dx = 0, dy = 0;
    if (dir === "up") dy = -1; else if (dir === "down") dy = 1;
    else if (dir === "left") dx = -1; else if (dir === "right") dx = 1;
    return maze[player.y + dy][player.x + dx];
}