import { GFX, Tetris, Tetronimo, P_TYPE, KEY } from "./Tetris.js"

const FPS = 61;
const START_LEVEL = 0;
let interval = 1000 / FPS;
let prev_frame = 0;
let prev_fall_interval = 0;

let gfx = new GFX();
let tetris = new Tetris(START_LEVEL);

function handle_input(e) {
	let keycode = e.keyCode;
	switch (keycode) {
		case KEY.LEFT:
		case KEY.RIGHT:
		case KEY.DOWN:
			tetronimo.move(keycode, tetris);
			break;
		case KEY.C:
			tetronimo = tetris.hold_piece(tetronimo)
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

function game_loop(curr_time) {
	if (!tetris.check_gameover()) {
		gfx.draw_ui_all(tetris);
		let is_falling = false;
		const delta_frame = curr_time - prev_frame;
		if (delta_frame > interval) {
			// requestAnimationFrame(piece_falling)
			prev_frame = curr_time - (delta_frame_ms % interval)
			const delta_fall = curr_time - prev_fall_interval;

			if (delta_fall > tetris.fall_interval) {
				prev_fall_interval = curr_time - (delta_fall_interval_ms % tetris.fall_interval)
				is_falling = tetronimo.fall(tetris.grid);
				if (!is_falling) {
					tetris.held_this_turn = false;
					let lines_cleared_this_turn = tetris.clear_lines();
					if (lines_cleared_this_turn > 0) {
						tetris.score_keeper(lines_cleared_this_turn);
					}
				}
				gfx.draw_all_game_elements(tetris.grid, tetronimo);
			}
			if (!is_falling) {
				// grab a piece from queue and spawn a new one
				tetronimo = tetris.get_next_piece();
			}
		}
	} else {
		gfx = new GFX();
		tetris = new Tetris();
	}
	requestAnimationFrame(game_loop)
}
gfx.draw_all_game_elements(tetris.grid, tetronimo);
gfx.draw_ui_all(tetris);
requestAnimationFrame(game_loop)
