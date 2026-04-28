const GRID_SIZE = 40;

function setup() {
    let canvas = createCanvas(650, 450);
    canvas.parent('game-container');
    let selector = select('#level-selector');

    ALL_MAPS.forEach(m => {
        let b = createButton(`問題${m.id}`);
        b.parent(selector);
        b.mousePressed(() => loadLevel(m.id));
    });

    let runBtn = createButton('実行');
    runBtn.parent(selector);
    runBtn.mousePressed(async () => {
        if (isRunning || finishTime) return; // 実行中またはゴール後は無効

        isRunning = true;
        message = "実行中...";

        // 初めての実行時だけタイマーを開始
        if (startTime === null) startTime = millis();

        if (currentLevel === 1) await solveProblem1();
        if (currentLevel === 2) await solveProblem2();
        if (currentLevel === 3) await solveProblem3();

        isRunning = false; // ここでfalseにするので、再度ボタンが押せるようになる
        if (!finishTime) message = "停止（再実行可）";
    });

    let resetBtn = createButton('リセット');
    resetBtn.parent(selector).addClass('btn-reset');
    resetBtn.mousePressed(() => loadLevel(currentLevel));

    loadLevel(1);
}

function draw() {
    background(20);
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            let cell = maze[y][x], count = visitCount[y][x];
            noStroke();
            if (cell === 1) fill(50); else if (cell === 2) fill(255, 200, 0);
            else if (cell === 3) fill(255, 50, 50); else if (cell === 4) fill(50, 255, 50);
            else fill(200);
            rect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
            if (count > 0 && cell !== 1) {
                fill(0, 150, 255, min(count * 40, 200));
                rect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
            }
        }
    }
    fill(0, 200, 255);
    ellipse(player.x * GRID_SIZE + 20, player.y * GRID_SIZE + 20, 25);
    fill(255); textSize(15); textAlign(LEFT);
    text(`[ステータス]\n手数: ${player.steps}\nコイン: ${player.coins}/${player.totalCoins}\n${message}`, 480, 50);
    if (finishTime) { fill(255, 200, 0); text(`CLEAR!\nTIME: ${finishTime.toFixed(2)}s`, 480, 200); }
}