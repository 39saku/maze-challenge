// noprotect
async function solveProblem1() {
    // ここにコードを書く
    for (let i = 0; i < 2; i++) {
        await move("right");
    }
    for (let i = 0; i < 2; i++) {
        await move("down");
    }
    for (let i = 0; i < 2; i++) {
        await move("left");
    }
}