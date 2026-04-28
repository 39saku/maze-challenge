const GRID_SIZE = 40;

function setup() {
    let canvas = createCanvas(620, 450);
    canvas.parent('game-container');

    // UIボタンの生成
    let selector = select('#level-selector');
    ALL_MAPS.forEach(m => {
        let btn = createButton(`問題${m.id}`);
        btn.parent(selector);
        btn.mousePressed(() => loadLevel(m.id));
    });

    let startBtn = createButton('実行');
    startBtn.parent(selector);
    startBtn.mousePressed(async () => {
        if (isRunning) return;
        isRunning = true; startTime = millis();
        if (currentLevel === 1) await solveProblem1();
        if (currentLevel === 2) await solveProblem2();
        if (currentLevel === 3) await solveProblem3();
    });

    let resetBtn = createButton('リセット');
    resetBtn.parent(selector);
    resetBtn.addClass('btn-reset');
    resetBtn.mousePressed(() => loadLevel(currentLevel));

    loadLevel(1);
}

function draw() {
    background(30);
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            let cell = maze[y][x];
            let count = visitCount[y][x];
            noStroke();
            if (cell === 1) fill(60);
            else if (cell === 2) fill(255, 215, 0);
            else if (cell === 3) fill(255, 50, 50);
            else if (cell === 4) fill(50, 255, 50);
            else fill(200);
            rect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);

            if (count > 0 && cell !== 1) {
                fill(0, 150, 255, min(count * 50, 200));
                rect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE - 1, GRID_SIZE - 1);
            }
        }
    }
    fill(0, 200, 255);
    ellipse(player.x * GRID_SIZE + 20, player.y * GRID_SIZE + 20, 25);

    fill(255); textSize(16); textAlign(LEFT);
    text(`問題: ${currentLevel}\n手数: ${player.steps}\nコイン: ${player.coins}/${player.totalCoins}\n${message}`, 450, 50);
    if (finishTime) text(`TIME: ${finishTime.toFixed(2)}s`, 450, 200);
}