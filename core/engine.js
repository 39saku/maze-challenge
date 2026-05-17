let currentLevel = 1;
let maze = [];
let visitCount = [];
let player = {}; // 生徒のロジックが使う仮想座標
let displayPlayer = {}; // 画面描画に使う実際の座標
let isRunning = false;
let finishTime = null;
let startTime = null;
let message = "";
let nickname = "";

// 命令予約リスト
let actionQueue = [];
let isProcessing = false;

const socket = io("http://localhost:3000");

// 指定した座標の状態を確認する
function look(x, y) {
    if (!maze[y] || maze[y][x] === undefined) return 1;
    return maze[y][x];
}

// --- 生徒が使う関数（予約リストに追加しつつ、仮想座標を更新） ---
function move(dir) {
    if (actionQueue.length > 20000) return; // 無限ループ防止用の安全弁

    let dx = 0, dy = 0;
    if (dir === "up") dy = -1; else if (dir === "down") dy = 1;
    else if (dir === "left") dx = -1; else if (dir === "right") dx = 1;

    // 仮想座標での壁判定（生徒のロジックが正しくループを回せるようにする）
    if (maze[player.y + dy] && maze[player.y + dy][player.x + dx] !== 1) {
        player.x += dx;
        player.y += dy;
        // アニメーション命令をキューに追加
        actionQueue.push({ type: "move", x: player.x, y: player.y, dir: dir, success: true });

        // コイン取得の仮想処理
        if (maze[player.y][player.x] === 2) {
            player.coins++;
            // 仮想的にコインを消さないとロジックが狂うので一時マップで管理が必要だが、
            // 簡易化のため実際のmazeを後でexecute内で更新する
        }
    } else {
        actionQueue.push({ type: "move", x: player.x, y: player.y, dir: dir, success: false });
    }
}

function dash(dir) {
    let dx = 0, dy = 0;
    if (dir === "up") dy = -1; else if (dir === "down") dy = 1;
    else if (dir === "left") dx = -1; else if (dir === "right") dx = 1;

    let success = true;
    for (let i = 0; i < player.dashDist; i++) {
        if (maze[player.y + dy] && maze[player.y + dy][player.x + dx] !== 1) {
            player.x += dx; player.y += dy;
            if (maze[player.y][player.x] === 2) player.coins++;
        } else {
            success = false; break;
        }
    }
    actionQueue.push({ type: "dash", x: player.x, y: player.y, success: success });
}

// --- エンジン側：予約された命令を順番に実行 ---
async function processQueue() {
    if (isProcessing) return;
    isProcessing = true;

    while (actionQueue.length > 0 && isRunning) {
        let action = actionQueue.shift();

        // 描画用の座標を更新
        displayPlayer.x = action.x;
        displayPlayer.y = action.y;
        displayPlayer.steps++;

        if (action.type === "dash" && !action.success) {
            displayPlayer.steps += 10;
            await freeze(3, "DASH衝突！");
        }

        // 実際の状態チェック（コイン取得や罠）
        checkStatusRealTime(displayPlayer.x, displayPlayer.y);

        // Level 9, 10 以外は 0.5秒待機
        if (currentLevel < 9) {
            await new Promise(res => setTimeout(res, 500));
        }

        if (finishTime) break;
    }
    isProcessing = false;
    if (!finishTime && isRunning) message = "停止（再実行可）";
    isRunning = false;
}

function checkStatusRealTime(x, y) {
    let cell = maze[y][x];
    if (cell === 2) {
        displayPlayer.coins++;
        maze[y][x] = 0; // 実際に消す
        message = "コイン獲得！";
    }
    if (cell === 3) freeze(3, "落とし穴！");
    if (cell === 4 && displayPlayer.coins === displayPlayer.totalCoins) {
        finishTime = (millis() - startTime) / 1000;
        isRunning = false;
        submitScore();
    }
}

async function freeze(sec, msg) {
    displayPlayer.isFrozen = true;
    message = msg;
    await new Promise(res => setTimeout(res, sec * 1000));
    displayPlayer.isFrozen = false;
    message = "復帰！";
}

function loadLevel(n) {
    isRunning = false;
    actionQueue = [];
    let data = ALL_MAPS.find(m => m.id === n);
    if (!data) return;
    currentLevel = n;
    maze = data.grid.map(row => [...row]);
    visitCount = maze.map(row => row.map(() => 0));

    // 仮想座標と表示座標の両方を初期化
    player = { x: data.start.x, y: data.start.y, steps: 0, coins: 0, totalCoins: data.coins, dashDist: data.dashDist };
    displayPlayer = { ...player, isFrozen: false };

    visitCount[player.y][player.x] = 1;
    finishTime = null; startTime = null;
    message = `Level ${n} ロード完了`;
}

function submitScore() {
    const code = window[`solveProblem${currentLevel}`].toString();
    socket.emit('submit_score', { nickname, level: currentLevel, steps: displayPlayer.steps, time: finishTime, code });
    message = "スコア送信完了！";
}

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