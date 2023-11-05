import { GFX, Tetris, Tetronimo, P_TYPE, InputHandler, KB_MAP, KC_KEYMAP, KC_STR_MAP } from "./Tetris.js"

let gfx = new GFX();
let tetris = new Tetris();
let input_handler = new InputHandler();
let keys = input_handler.keys; // This creates a reference to the array (not a copy)

// Fill that shit up
// tetris.stupid_fill_test();

let queue = [
	tetris.spawn_rand_piece(),
	tetris.spawn_rand_piece(),
	tetris.spawn_rand_piece(),
	tetris.spawn_rand_piece(),
];

async function poll_input(){
	while (true){
		for (let key in KC_KEYMAP){
			let i = KC_KEYMAP[key];
			if (keys[i] === 1)
				tetronimo.move(KC_STR_MAP[key], tetris.grid);
		}
		await new Promise(resolve => setTimeout(resolve, 40));
	}
}

poll_input();

var tetronimo = queue.shift();
while (true){
	while (!tetris.check_gameover()){
		// gfx.draw_background();
		// gfx.draw_playfield();
		// gfx.draw_grid_elements(tetris.grid);
		// gfx.draw_gridlines();

		while (tetronimo.fall(tetris.grid)){
			// TODO: Need to somehow implement the ability to make multiple moves per fall() iteration

			// poll the keys array and perform movements based on the inputs that are set
			gfx.draw_background();
			gfx.draw_playfield();
			gfx.draw_grid_elements(tetris.grid);
			gfx.draw_gridlines();
			gfx.draw_falling_tetronimo(tetronimo);
			await new Promise(resolve => setTimeout(resolve, 50));
		}
		tetronimo = queue.shift();
		queue.push(tetris.spawn_rand_piece());
		await new Promise(resolve => setTimeout(resolve, 50));
	}
	gfx = new GFX();
	tetris = new Tetris();
}
