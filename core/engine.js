let currentLevel = 1;
let maze = [];
let visitCount = [];
let player = {};
let isRunning = false;
let finishTime = null;
let startTime = null;
let message = "";
let nickname = "";

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

// --- サーバー通信設定 ---
const socket = io("http://localhost:3000");

// 運営からの強制停止命令
socket.on('remote_stop', () => {
    isRunning = false;
    finishTime = null;
    message = "【強制停止】運営により停止されました";
    alert("運営によりプログラムが強制停止されました。");
});
// -----------------------

window.onload = () => {
    const saved = localStorage.getItem('maze_nickname');
    if (saved) {
        nickname = saved;
        document.getElementById('display-name').innerText = nickname;
        document.getElementById('name-modal').style.display = 'none';
    }
};

function saveNickname() {
    const val = document.getElementById('nickname-input').value.trim();
    if (!val) return alert("名前を入力してね");
    nickname = val;
    localStorage.setItem('maze_nickname', nickname);
    document.getElementById('display-name').innerText = nickname;
    document.getElementById('name-modal').style.display = 'none';
}

function loadLevel(n) {
    isRunning = false;
    let data = ALL_MAPS.find(m => m.id === n);
    if (!data) return;
    currentLevel = n;
    maze = data.grid.map(row => [...row]);
    visitCount = maze.map(row => row.map(() => 0));
    player = { x: data.start.x, y: data.start.y, steps: 0, coins: 0, totalCoins: data.coins, dashDist: data.dashDist, isFrozen: false };
    visitCount[player.y][player.x] = 1;
    finishTime = null;
    startTime = null;
    message = `${data.name} をロードしました`;
}

function getStudentCode(n) {
    try { return window[`solveProblem${n}`].toString(); }
    catch (e) { return "Code not found"; }
}

async function submitScore() {
    const data = { nickname, level: currentLevel, steps: player.steps, time: finishTime, code: getStudentCode(currentLevel) };
    socket.emit('submit_score', data);
    message = "スコアを運営に送信しました！";
}

async function move(dir) {
    if (player.isFrozen || finishTime) return false;
    player.steps++;
    let dx = 0, dy = 0;
    if (dir === "up") dy = -1; else if (dir === "down") dy = 1;
    else if (dir === "left") dx = -1; else if (dir === "right") dx = 1;
    if (maze[player.y + dy] && maze[player.y + dy][player.x + dx] !== 1) {
        player.x += dx; player.y += dy;
        visitCount[player.y][player.x]++;
        checkStatus();
        await sleep(500); return true;
    }
    await sleep(500); return false;
}

async function dash(dir) {
    if (player.isFrozen || finishTime) return;
    let dx = 0, dy = 0;
    if (dir === "up") dy = -1; else if (dir === "down") dy = 1;
    else if (dir === "left") dx = -1; else if (dir === "right") dx = 1;
    for (let i = 0; i < player.dashDist; i++) {
        if (maze[player.y + dy] && maze[player.y + dy][player.x + dx] !== 1) {
            player.x += dx; player.y += dy;
            visitCount[player.y][player.x]++;
            checkStatus();
        } else {
            player.steps += 10;
            await freeze(3, "DASH衝突！"); break;
        }
    }
    player.steps++; await sleep(500);
}

function checkStatus() {
    let cell = maze[player.y][player.x];
    if (cell === 2) { player.coins++; maze[player.y][player.x] = 0; }
    if (cell === 3) freeze(3, "落とし穴！");
    if (cell === 4 && player.coins === player.totalCoins) {
        finishTime = (millis() - startTime) / 1000;
        submitScore();
    }
}

async function freeze(sec, msg) {
    player.isFrozen = true; message = msg;
    await sleep(sec * 1000);
    player.isFrozen = false; message = "復帰！";
}

function look(dir) {
    let dx = 0, dy = 0;
    if (dir === "up") dy = -1; else if (dir === "down") dy = 1;
    else if (dir === "left") dx = -1; else if (dir === "right") dx = 1;
    if (!maze[player.y + dy]) return 1;
    return maze[player.y + dy][player.x + dx];
}