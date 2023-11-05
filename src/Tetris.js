const bg_canvas = document.getElementById("background-canvas");
const tetris_canvas = document.getElementById("tetris-canvas");

const BG_COLOR = "#242424";
const FIELD_COLOR = "grey";
const GRID_COLOR = "#545454";
const PLAYFIELD_YMAX = 25;
const PLAYFIELD_XMAX = 10;
const Y_OFF = 5;

export const P_TYPE = {
	NONE: 0,
	I: 1,
	O: 2,
	T: 3,
	S: 4,
	Z: 5,
	J: 6,
	L: 7,
}

const P_COLORS = {
	[P_TYPE.I]: "#0f7394",
	[P_TYPE.O]: "#9cb30b",
	[P_TYPE.T]: "#a10a99",
	[P_TYPE.S]: "#11a811",
	[P_TYPE.Z]: "#4f0099",
	[P_TYPE.J]: "#c70021",
	[P_TYPE.L]: "#0e3d9c",
}

// kb mappings -> keycode
export const KB_MAP = {
	LROT: 90, // Z
	RROT: 88, // X
	PAUSE: 80, // P

	LEFT: 37, // Arrows
	DOWN: 40,
	RIGHT: 39,
	UP: 38,
}

// keycode -> key string
export const KC_STR_MAP = {
	[KB_MAP.LROT]: "LROT",
	[KB_MAP.RROT]: "RROT",
	[KB_MAP.PAUSE]: "PAUSE",

	[KB_MAP.LEFT]: "LEFT",
	[KB_MAP.DOWN]: "DOWN",
	[KB_MAP.RIGHT]: "RIGHT",
	[KB_MAP.UP]: "UP",
}

export const STR_KC_MAP = {
	"LROT":  [KB_MAP.LROT],
	"RROT":  [KB_MAP.RROT],
	"PAUSE": [KB_MAP.PAUSE],

	"LEFT":  [KB_MAP.LEFT],
	"DOWN":  [KB_MAP.DOWN],
	"RIGHT": [KB_MAP.RIGHT],
	"UP":    [KB_MAP.UP],
}

export const KC_KEYMAP = {
	[KB_MAP.LROT]: 0,
	[KB_MAP.RROT]: 1,
	[KB_MAP.PAUSE]: 2,

	[KB_MAP.LEFT]: 3,
	[KB_MAP.DOWN]: 4,
	[KB_MAP.RIGHT]: 5,
	[KB_MAP.UP]: 6,
}

export class GFX {
	constructor() {
		bg_canvas.style.position = "absolute";
		tetris_canvas.style.position = "absolute";
		bg_canvas.style.top = "50";
		bg_canvas.style.left = "50";
		tetris_canvas.style.top = "50";
		tetris_canvas.style.left = "50";
	}

	draw_background(){
		const ctx = bg_canvas.getContext("2d");
		ctx.fillStyle = BG_COLOR;
		ctx.fillRect(0, 0, bg_canvas.width, bg_canvas.height);
	}

	draw_playfield(){
		const ctx = tetris_canvas.getContext("2d");
		ctx.fillStyle = FIELD_COLOR;
		ctx.fillRect(0, 0, tetris_canvas.width, tetris_canvas.height);
	}

	draw_gridlines(){
		const ctx = tetris_canvas.getContext("2d");
		const horiz_inc = tetris_canvas.height / 20;
		const vert_inc = tetris_canvas.width / 10;

		// Draw horizontal lines
		for (let y = 0; y < tetris_canvas.height; y += horiz_inc){
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(tetris_canvas.width, y);
			ctx.stroke();
		}

		// Draw vertical lines
		for (let x = 0; x < tetris_canvas.width; x += vert_inc){
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, tetris_canvas.height);
			ctx.stroke();
		}
	}

	// Draw the actual pieces and shit on the 2d grid (except the piece currently in motion)
	draw_grid_elements(grid){
		const ctx = tetris_canvas.getContext("2d");
		const horiz_inc = tetris_canvas.height / 20;
		const vert_inc = tetris_canvas.width / 10;

		for (let y = PLAYFIELD_YMAX-1; y >= PLAYFIELD_YMAX-20; y--){
			for (let x = 0; x < PLAYFIELD_XMAX; x++){
				// dx, dy are drawing coords
				let dx = x * horiz_inc;
				let dy = (y-Y_OFF) * vert_inc;
				if (grid[y][x] != P_TYPE.NONE){
					ctx.fillStyle = P_COLORS[grid[y][x]];
					ctx.beginPath();
					ctx.rect(dx, dy, horiz_inc, vert_inc);
					ctx.fill();
					ctx.stroke();
				}
			}
		}
	}

	// this will draw the tetronimo in motion
	// We are avoiding putting the tetronimo on the actual grid until it lands, this way we don't
	// have to handle creating and destroying the blocks every time it shifts down once.
	draw_falling_tetronimo(tetronimo){
		const ctx = tetris_canvas.getContext("2d");
		const horiz_inc = tetris_canvas.height / 20;
		const vert_inc = tetris_canvas.width / 10;

		let origin = tetronimo.origin;
		let blocks = tetronimo.blocks;
		let p_type = tetronimo.type;

		ctx.fillStyle = P_COLORS[p_type];
		for (let block of blocks){
			let dx = (origin[0] + block[0]) * horiz_inc;
			let dy = (origin[1] + block[1] - Y_OFF) * vert_inc;
			ctx.beginPath();
			ctx.rect(dx, dy, horiz_inc, vert_inc);
			ctx.fill();
			ctx.stroke();
		}
	}
}

export class Tetronimo {
	constructor(piece_type){
		this.type = piece_type;
		this.origin = [0,0];
		this.blocks = Array(4).fill([0,0]); // block positions relative to origin
		this.spawn_piece();
	}

	print(){
		console.log(this.origin);
		console.log(this.blocks);
	}

	// Since collision detection can usually be solved by checking mins and maxes, some helper methods
	// for getting them are implemented
	min_x(){
		let res = Number.MAX_SAFE_INTEGER;
		for (let block of this.blocks)
			res = Math.min(res, block[0] + this.origin[0]);
		return res;
	}

	max_x(){
		let res = Number.MIN_SAFE_INTEGER;
		for (let block of this.blocks)
			res = Math.max(res, block[0] + this.origin[0]);
		return res;
	}

	min_y(){
		let res = Number.MAX_SAFE_INTEGER;
		for (let block of this.blocks)
			res = Math.min(res, block[1] + this.origin[1]);
		return res;
	}

	max_y(){
		let res = Number.MIN_SAFE_INTEGER;
		for (let block of this.blocks)
			res = Math.max(res, block[1] + this.origin[1]);
		return res;
	}

	// check if valid move by making a copy of the tetronimo's new position and checking if there is
	// any overlap with the grid.
	// Returns true if the new move is valid
	check_move(grid, dx, dy){
		for (let block of this.blocks){
			let nx = this.origin[0] + dx + block[0];
			let ny = this.origin[1] + dy + block[1];
			console.log(nx, ny);
			if (grid[ny][nx] !== P_TYPE.NONE)
				return false;
		}
		return true;
	}

	spawn_piece(){
		this.origin = [5,3];
		switch(this.type){
			case P_TYPE.I:
				this.blocks = [[0,-1],[0,0],[0,1],[0,2]];
				break;
			case P_TYPE.O:
				this.blocks = [[-1,-1],[-1,0],[0,-1],[0,0]];
				break;
			case P_TYPE.T:
				this.blocks = [[-1,0],[0,0],[1,0],[0,-1]];
				break;
			case P_TYPE.S:
				this.blocks = [[-1,0],[0,0],[0,-1],[1,-1]];
				break;
			case P_TYPE.Z:
				this.blocks = [[-1,-1],[0,-1],[0,0],[1,0]];
				break;
			case P_TYPE.J:
				this.blocks = [[-1,-1],[-1,0],[0,0],[1,0]];
				break;
			case P_TYPE.L:
				this.blocks = [[-1,0],[0,0],[1,0],[1,-1]];
				break;
		}	
	}

	// This will check the grid to see if the piece can fall down. If it can, it will move piece down once.
	// returns true if still falling
	fall(grid){
		let can_fall = true;
		for (let block of this.blocks){
			let x = this.origin[0] + block[0];
			let y = this.origin[1] + block[1];
			// console.log(x, y);
			// check if min y pos is at bottom
			if (y === PLAYFIELD_YMAX-1){ // at bottom
				can_fall = false;
			} else if (grid[y+1][x] !== P_TYPE.NONE){ // if below piece is non-empty
				can_fall = false;
			}
			if (!can_fall)
				break;
		}


		if (can_fall) {
			// move down
			this.origin[1] += 1;
		} else {
			// set to grid
			for (let block of this.blocks){
				let x = this.origin[0] + block[0];
				let y = this.origin[1] + block[1];
				grid[y][x] = this.type;
			}
		}

		return can_fall;
	}

	move(dir, grid, keys){
		console.log(`DIR: ${dir}`);
		console.log(this.origin);

		// checks collisions with other pieces and also does boundary checks before actually moving the piece
		if (dir === "LEFT" || dir === "RIGHT" || dir === "DOWN" || dir === "UP"){
			switch(dir){
				case "LEFT":
					console.log(`min_x: ${this.min_x()}`);
					if (this.min_x() > 0 && this.check_move(grid, -1, 0))
						this.origin[0]--;
					break;
				case "DOWN":
					if (this.max_y() < PLAYFIELD_YMAX-1 && this.check_move(grid, 0, +1))
						this.origin[1]++;
					break;
				case "RIGHT":
					if (this.max_x() < PLAYFIELD_XMAX-1 && this.check_move(grid, +1, 0))
						this.origin[0]++;
					break;
				case "UP": // This should be removed when were no longer testing
					if (this.max_y() > 0 && this.check_move(grid, 0, -1))
						this.origin[1]--;
					break;
			}				
		}
		keys[KC_KEYMAP[STR_KC_MAP[dir]]] = 0;
	}

	rotate(dir, grid, keys){
		// We cannot rotate O
		if (this.type === P_TYPE.O)
			return;

		// Returns the rotated version of the blocks.
		const get_rotated = (dir) => {
			// This is a separate function because we want a copy of the rotated
			// piece before actually rotating it to check if the rotation overlaps
			// with another piece, or falls outside the boundaries of the grid.
			let rotated = this.blocks.map((coord) => { return coord.slice()}); // create hard copy
			if (dir === "LROT"){
				for (let coord of rotated){
					let x = coord[0];
					let y = coord[1];
					coord[0] = y;
					coord[1] = -x;
				}
				// reverse each col
			} else if (dir === "RROT"){
				for (let coord of rotated){
					let x = coord[0];
					let y = coord[1];
					coord[0] = -y;
					coord[1] = x;
				}
			}
			return rotated;

		}

		if (dir === "LROT" || dir === "RROT"){
			let can_rotate = true;
			let rotated = get_rotated(dir);	
			for (let rot of rotated){
				let rx = this.origin[0] + rot[0];
				let ry = this.origin[1] + rot[1];
				console.log(rx, ry);
				// first, check if rotated position is within the boundaries of the grid
				if (rx < 0 || rx >= PLAYFIELD_XMAX){
					can_rotate = false;
					break;
				}
				if (ry < 0 || ry >= PLAYFIELD_YMAX){
					can_rotate = false;
					break;
				}
				// second, check if the rotated position overlaps with any other pieces already on the grid
				if (grid[ry][rx] !== P_TYPE.NONE){
					can_rotate = false;
					break;
				}
			}
			if (can_rotate)
				this.blocks = rotated;
			// Unset the rotation key so that holding the button doesn't repeatedly
			// rotate the piece 
			// Also, whoever is reading this code, I'm aware of how stupid this is LMAO
			keys[KC_KEYMAP[STR_KC_MAP[dir]]] = 0;
		}
	}
}

// Actual Tetris Logic
export class Tetris {
	constructor(){
		this.grid = Array(PLAYFIELD_YMAX).fill().map(
			() => Array(PLAYFIELD_XMAX).fill(P_TYPE.NONE)
		);
	}

	print_grid(){ console.log(this.grid); }

	// If any pieces land above where the game renders, it's game over
	check_gameover(){
		for (let y = 3; y < 5; y++){
			for (let x = 0; x < PLAYFIELD_XMAX; x++){
				if (this.grid[y][x] !== P_TYPE.NONE ){
					console.log("Game over!");
					return true;
				}
			}
		}
		return false;
	}

	spawn_rand_piece(){
		let rand_type = Math.round(Math.random() * (P_TYPE.L-1)+1);
		return new Tetronimo(rand_type);
	}
	
	// checks and clears all full lines, returns how many lines were cleared 
	clear_lines(){
		console.log("Checking for full lines");
		let lines_cleared = 0;
		// Do a downward scan to see if line is full
		for (let y = 5; y < PLAYFIELD_YMAX; y++){
			console.log(`y: ${y}`);
			let is_full = true;

			// scan the line
			for (let x = 0; x < PLAYFIELD_XMAX; x++){
				if (this.grid[y][x] === P_TYPE.NONE){
					is_full = false;
					break;
				}
			}
			
			if (is_full){
				console.log(`Detected full line at ${y}`);
				// clear the current line
				for (let x = 0; x < PLAYFIELD_XMAX; x++){
					this.grid[y][x] = P_TYPE.NONE;
					lines_cleared++; // will be used for scoring when it's implemented
				}
				// shift all lines above from current y coordinate down 1
				for (let yy = y; yy >= 5; yy--){
					this.grid[yy] = this.grid[yy-1]
				}
			}
		}	
		return lines_cleared;
	}
}

// Creates the input event listeners
export class InputHandler {
	constructor(){
		this.keys = [
			0,0,0, // Z,X,P     
			0,0,0,0 // (arrows): L,D,R,U
		];
		this.create_event_listeners();
	}

	update_key_state(keycode, new_state){
		if (keycode in KC_STR_MAP){
			let i = KC_KEYMAP[keycode];
			if (new_state != this.keys[i]){
				console.log(`${KC_STR_MAP[keycode]} = ${keycode}:${new_state}`);
				this.keys[i] = new_state;
			}
		}
	}

	create_event_listeners(){
		document.addEventListener('keydown', (e) => this.update_key_state(e.keyCode, 1) );
		document.addEventListener('keyup', (e) => this.update_key_state(e.keyCode, 0) );
	}
}
