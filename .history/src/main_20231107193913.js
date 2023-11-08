import { GFX, Tetris, Tetronimo, P_TYPE, KEY } from "./Tetris.js"

const FALL_TICK = 200; // If we ever implement levels, this determines the difficulty
const DELAY_TICK = 200; // additional wait time after a piece lands
const CLEAR_DELAY = 200; // additional wait time before a line is cleared

let gfx = new GFX();
let tetris = new Tetris();

let piece_counter = { [P_TYPE.I]: 0, [P_TYPE.O]: 0, [P_TYPE.T]: 0, [P_TYPE.J]: 0, [P_TYPE.L]: 0, [P_TYPE.S]: 0, [P_TYPE.Z]: 0 }

function reset_piece_counter(piece_counter) {
	for (let i in piece_counter) {
		console.log(i);
		piece_counter[i] = 0;
	}
}

let queue = [];

for (let i = 0; i < 10; i++)
	queue.push(tetris.spawn_rand_piece())

function handle_input(e) {
	let keycode = e.keyCode;
	console.log(`Pressing ${keycode}`);
	switch (keycode) {
		case KEY.LEFT:
		case KEY.RIGHT:
		case KEY.DOWN:
			tetronimo.move(keycode, tetris);
			break;
		case KEY.X:
		case KEY.Z:
			tetronimo.rotate(keycode, tetris);
			break;
		case KEY.SPACE:
			tetronimo.hard_drop(tetris);
			break;
	}
	gfx.draw_all_game_elements(tetris.grid, tetronimo);
}

document.addEventListener('keydown', (e) => { return handle_input(e); });

var tetronimo = queue.shift();
piece_counter[tetronimo.type]++;

while (true) {
	while (!tetris.check_gameover()) {
		gfx.draw_ui_all(piece_counter, queue, tetris.score);
		while (tetronimo.fall(tetris.grid)) {
			gfx.draw_all_game_elements(tetris.grid, tetronimo);
			await new Promise(resolve => setTimeout(resolve, FALL_TICK));
		}
		tetronimo = queue.shift();
		queue.push(tetris.spawn_rand_piece());
		piece_counter[tetronimo.type]++;

		let lines_cleared = tetris.clear_lines();
		if (lines_cleared > 0) {
			await new Promise(resolve => setTimeout(resolve, CLEAR_DELAY));
			gfx.draw_all_game_elements(tetris.grid, tetronimo);
			tetris.score_keeper(lines_cleared);
		}
		await new Promise(resolve => setTimeout(resolve, DELAY_TICK));
	}
	gfx = new GFX();
	tetris = new Tetris();
	reset_piece_counter(piece_counter);
}
