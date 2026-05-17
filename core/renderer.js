const GRID_SIZE = 30;
const OFFSET_X = 220;
const OFFSET_Y = 50;

function setup() {
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

        const funcName = `solveProblem${currentLevel}`;

        // 🔍 診断用：全てのグローバル関数をチェック
        console.log("現在実行しようとしている関数名:", funcName);
        console.log("windowオブジェクト内の存在確認:", typeof window[funcName]);

        const solveFunc = window[funcName];

        if (typeof solveFunc === "function") {
            isRunning = true;
            if (startTime === null) startTime = millis();
            message = "実行中...";
            solveFunc();
            await processQueue();
        } else {
            alert(`【診断結果】\n関数 ${funcName} が見つかりません。\n\n原因の可能性:\n1. student_code_${currentLevel}.js 内の関数名が solveProblem${currentLevel} になっていない\n2. index.html での <script> 読み込みタグが漏れている\n3. ファイル名に間違いがある`);
        }
    });
    let resetBtn = createButton('リセット');
    resetBtn.parent(selector).addClass('btn-reset');
    resetBtn.mousePressed(() => loadLevel(currentLevel));
    loadLevel(1);
}

// draw() 以降は変更なし（そのまま維持してください）
function draw() {
    background(15);
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            let cell = maze[y][x];
            let count = visitCount[y][x];
            let isVisible = (currentLevel < 9 || (x === displayPlayer.x && y === displayPlayer.y) || finishTime);
            let drawX = OFFSET_X + x * GRID_SIZE, drawY = OFFSET_Y + y * GRID_SIZE;
            if (isVisible) {
                noStroke();
                if (cell === 1) fill(60); else if (cell === 2) fill(255, 200, 0);
                else if (cell === 3) fill(255, 50, 50); else if (cell === 4) fill(50, 255, 50);
                else fill(220);
                rect(drawX, drawY, GRID_SIZE - 1, GRID_SIZE - 1);
                if (count > 0 && cell !== 1) {
                    fill(0, 150, 255, min(count * 40, 200));
                    rect(drawX, drawY, GRID_SIZE - 1, GRID_SIZE - 1);
                }
            } else {
                fill(30); rect(drawX, drawY, GRID_SIZE - 1, GRID_SIZE - 1);
            }
        }
    }
    let px = OFFSET_X + displayPlayer.x * GRID_SIZE + GRID_SIZE / 2, py = OFFSET_Y + displayPlayer.y * GRID_SIZE + GRID_SIZE / 2;
    fill(0, 200, 255); stroke(255); strokeWeight(2);
    if (displayPlayer.isFrozen) fill(255, 0, 100);
    ellipse(px, py, GRID_SIZE * 0.7); strokeWeight(1);
    drawUI();
}

function drawUI() {
    fill(255); noStroke(); textAlign(LEFT); textSize(18);
    let uiX = OFFSET_X, uiY = height - 120;
    text(`[Level ${currentLevel}] ニックネーム: ${nickname}`, uiX, uiY);
    text(`手数: ${displayPlayer.steps} | コイン: ${displayPlayer.coins}/${displayPlayer.totalCoins}`, uiX, uiY + 30);
    fill(255, 215, 0);
    text(`DASH移動距離: ${displayPlayer.dashDist} マス`, uiX, uiY + 60);
    fill(displayPlayer.isFrozen ? "#ff4d94" : "#4cc9f0");
    text(`状況: ${message}`, uiX, uiY + 90);
    if (finishTime) {
        fill(255, 215, 0); textSize(28); textAlign(CENTER);
        text(`★ CLEAR! TIME: ${finishTime.toFixed(2)}s ★`, width / 2, uiY + 50);
    }
}