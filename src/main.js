import { GFX, Tetris, Tetronimo, P_TYPE, KEY } from "./Tetris.js"
const bg_canvas = document.getElementById("background-canvas");
const tetris_canvas = document.getElementById("tetris-canvas");

const POLL_TICK = 30;
const FALL_TICK = 200; // If we ever implement levels, this determines the difficulty
const DELAY_TICK = 300; // additional wait time after a piece lands
const CLEAR_DELAY = 200; // additional wait time before a line is cleared

let gfx = new GFX();
let tetris = new Tetris();

let piece_counter = {
	[P_TYPE.I]:0, [P_TYPE.O]:0, [P_TYPE.T]:0, [P_TYPE.J]:0, [P_TYPE.L]:0, [P_TYPE.S]:0, [P_TYPE.Z]:0,
}

function reset_piece_counter(piece_counter){
	for (let i in piece_counter){
		console.log(i);
		piece_counter[i] = 0;
	}
}

let queue = [
	tetris.spawn_rand_piece(),
	tetris.spawn_rand_piece(),
	tetris.spawn_rand_piece(),
	tetris.spawn_rand_piece(),
	tetris.spawn_rand_piece(),
];

function handle_input(e){
	let keycode = e.keyCode;
	console.log(`Pressing ${keycode}`);
	switch (keycode){
		case KEY.LEFT:
		case KEY.RIGHT:
		case KEY.DOWN:
			tetronimo.move(keycode, tetris.grid);
			break;
		case KEY.X:
		case KEY.Z:
			tetronimo.rotate(keycode, tetris.grid);
			break;
		case KEY.SPACE:
			tetronimo.hard_drop(tetris.grid);
			break;
	}	
	gfx.draw_all_game_elements(tetris.grid, tetronimo);
}

document.addEventListener('keydown', (e) => { return handle_input(e); });

var tetronimo = queue.shift();
piece_counter[tetronimo.type]++;

while (true){
	while (!tetris.check_gameover()){
		gfx.draw_all_ui_elements(piece_counter);
		while (tetronimo.fall(tetris.grid)){
			gfx.draw_all_game_elements(tetris.grid, tetronimo);
			await new Promise(resolve => setTimeout(resolve, FALL_TICK));
		}
		tetronimo = queue.shift();
		queue.push(tetris.spawn_rand_piece());
		piece_counter[tetronimo.type]++;

		if (tetris.clear_lines()){
			await new Promise(resolve => setTimeout(resolve, CLEAR_DELAY));
			gfx.draw_all_game_elements(tetris.grid, tetronimo);
		}
		await new Promise(resolve => setTimeout(resolve, DELAY_TICK));
	}
	gfx = new GFX();
	tetris = new Tetris();
	reset_piece_counter(piece_counter);
}
