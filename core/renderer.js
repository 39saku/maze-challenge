const GRID_SIZE = 30;
const OFFSET_X = 220; // さらに右へ大きく移動 (120 -> 220)
const OFFSET_Y = 50;

function setup() {
    // 横幅を1100pxに広げ、右側の見切れを完全に防止
    let canvas = createCanvas(1100, 700);
    canvas.parent('game-container');
    let selector = select('#level-selector');

    for (let i = 1; i <= 10; i++) {
        let b = createButton(`L${i}`);
        b.parent(selector);
        b.mousePressed(() => loadLevel(i));
    }

    let runBtn = createButton('実行');
    runBtn.parent(selector);
    runBtn.mousePressed(async () => {
        if (isRunning || finishTime) return;
        isRunning = true;
        if (startTime === null) startTime = millis();
        const solveFunc = window[`solveProblem${currentLevel}`];
        if (solveFunc) await solveFunc();
        isRunning = false;
        if (!finishTime) message = "停止（再実行可）";
    });

    let resetBtn = createButton('リセット');
    resetBtn.parent(selector).addClass('btn-reset');
    resetBtn.mousePressed(() => loadLevel(currentLevel));

    loadLevel(1);
}

function draw() {
    background(15);

    // --- 迷路データの描画 ---
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            let cell = maze[y][x];
            let count = visitCount[y][x];

            // L9, L10 の視界制限（ブラインドモード）
            let isVisible = true;
            if (currentLevel >= 9) {
                if (x !== player.x || y !== player.y) isVisible = false;
                if (finishTime) isVisible = true;
            }

            let drawX = OFFSET_X + x * GRID_SIZE;
            let drawY = OFFSET_Y + y * GRID_SIZE;

            if (isVisible) {
                noStroke();
                if (cell === 1) fill(60);
                else if (cell === 2) fill(255, 200, 0);
                else if (cell === 3) fill(255, 50, 50);
                else if (cell === 4) fill(50, 255, 50);
                else fill(220);

                rect(drawX, drawY, GRID_SIZE - 1, GRID_SIZE - 1);

                // 訪問履歴の可視化
                if (count > 0 && cell !== 1) {
                    fill(0, 150, 255, min(count * 40, 200));
                    rect(drawX, drawY, GRID_SIZE - 1, GRID_SIZE - 1);
                }
            } else {
                fill(30);
                rect(drawX, drawY, GRID_SIZE - 1, GRID_SIZE - 1);
            }
        }
    }

    // --- プレイヤー（自分）の描画 ---
    let px = OFFSET_X + player.x * GRID_SIZE + GRID_SIZE / 2;
    let py = OFFSET_Y + player.y * GRID_SIZE + GRID_SIZE / 2;
    fill(0, 200, 255);
    stroke(255);
    strokeWeight(2);
    ellipse(px, py, GRID_SIZE * 0.7);
    strokeWeight(1);

    // --- 文字情報の描画 ---
    drawUI();
}

function drawUI() {
    fill(255);
    noStroke();

    // 左側のステータス：迷路の開始位置（OFFSET_X）に合わせる
    textAlign(LEFT);
    textSize(18);
    let uiX = OFFSET_X;
    let uiY = height - 100;

    text(`[Level ${currentLevel}] ニックネーム: ${nickname}`, uiX, uiY);
    text(`手数: ${player.steps} | コイン: ${player.coins}/${player.totalCoins}`, uiX, uiY + 30);

    fill(player.isFrozen ? "#ff4d94" : "#4cc9f0");
    text(`状況: ${message}`, uiX, uiY + 60);

    // クリア時のメッセージ：中央に表示
    if (finishTime) {
        fill(255, 215, 0);
        textSize(28);
        textAlign(CENTER);
        text(`★ CLEAR! TIME: ${finishTime.toFixed(2)}s ★`, width / 2, uiY + 40);
    }

    // 特殊モード時のヒント：右端に表示
    if (currentLevel >= 9 && !finishTime) {
        fill(255, 50, 50);
        textSize(14);
        textAlign(RIGHT);
        text("※視界制限モード：look(x, y) で周囲をスキャンしてください", width - 50, uiY + 60);
    }
}