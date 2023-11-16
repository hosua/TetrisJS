import { bg_canvas, tetris_canvas, GFX, Tetris, Tetronimo, P_TYPE, KEY } from "./Tetris.js"

const FPS = 61;
const START_LEVEL = 0;
let interval = 1000 / FPS;
let prev = {
	frame: 0,
	fall: 0
}

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
	gfx.copy_grid_buf_into_tetris();
	gfx.draw_falling_tetronimo(tetronimo);
}

function enable_movement_controls() {
	document.addEventListener('keydown', handle_input);
}

function disable_movement_controls() {
	document.removeEventListener('keydown', handle_input);
}

enable_movement_controls();


let tetronimo = tetris.queue.shift();
tetris.piece_counter[tetronimo.type]++;

let frames = 0;

function game_loop(curr_time) {
	requestAnimationFrame(game_loop)
	const delta_frame = curr_time - prev.frame;
	if (delta_frame > interval) {
		frames++;
		prev.frame = curr_time - (delta_frame % interval)

		const delta_fall = curr_time - prev.fall;
		if (delta_fall > tetris.fall_interval) {
			prev.fall = curr_time - (delta_fall % tetris.fall_interval);
			tetronimo.fall(tetris);
			gfx.copy_grid_buf_into_tetris();
			gfx.draw_falling_tetronimo(tetronimo);
		}

		if (!tetronimo.is_falling) {

			tetris.held_this_turn = false;
			tetris.place_on_grid(tetronimo);

			console.log("OLD PIECE")
			console.log(tetronimo)
			console.log("GRID BEFORE DROP")
			// tetris.print_grid();

			// grab a piece from queue and spawn a new one
			tetronimo = tetris.get_next_piece();
			let lines_cleared_this_turn = tetris.clear_lines();
			if (lines_cleared_this_turn > 0) {
				tetris.score_keeper(lines_cleared_this_turn);
				gfx.copy_empty_grid_into_tetris();
				gfx.draw_grid_elements(tetris.grid);
			}

			// Draw what we already have in our buffer
			// when the tetronimo lands, we need to redraw 
			// the other pieces and new piece on the grid,
			// then the grid buffer needs to be set to the current grid's state
			gfx.copy_tetris_into_grid_buf();
		}

		gfx.draw_ui_all(tetris);
	}

	if (tetris.check_gameover()) {
		gfx.reset_grids();
		tetris.reset(START_LEVEL)
	}

}

requestAnimationFrame(game_loop)
