import { GFX, Tetris, Tetronimo, P_TYPE, KEY } from "./Tetris.js"

const DELAY_TICK = 100; // additional wait time after a piece lands

let gfx = new GFX();
let tetris = new Tetris(10);

function handle_input(e) {
	let keycode = e.keyCode;
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

let tetronimo = tetris.queue.shift();
tetris.piece_counter[tetronimo.type]++;

while (true) {
	while (!tetris.check_gameover()) {
		gfx.draw_ui_all(tetris);
		while (tetronimo.fall(tetris.grid)) {
			gfx.draw_all_game_elements(tetris.grid, tetronimo);
			await new Promise(resolve => setTimeout(resolve, tetris.fall_tick));
		}
		tetronimo = tetris.queue.shift();
		tetris.queue.push(tetris.spawn_rand_piece());
		tetris.piece_counter[tetronimo.type]++;

		let lines_cleared_this_turn = tetris.clear_lines();
		if (lines_cleared_this_turn > 0) {
			gfx.draw_all_game_elements(tetris.grid, tetronimo);
			tetris.score_keeper(lines_cleared_this_turn);
		}
		// await new Promise(resolve => setTimeout(resolve, DELAY_TICK));
	}
	gfx = new GFX();
	tetris = new Tetris();
}
