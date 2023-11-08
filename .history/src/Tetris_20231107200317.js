const bg_canvas = document.getElementById("background-canvas");
const tetris_canvas = document.getElementById("tetris-canvas");

const BG_COLOR = "#242424";
const FIELD_COLOR = "grey";
const PLAYFIELD_YMAX = 25;
const PLAYFIELD_XMAX = 10;
const Y_OFF = 5;

export const KEY = {
	SPACE: 32, 								// hard drop
	LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40,  // move piece
	C: 67, 									// hold piece
	P: 80, 									// pause
	X: 88, 									// rotate right
	Z: 90, 									// rotate left
};

export const P_TYPE = {
	NONE: 0,
	I: 1, O: 2, T: 3, S: 4,
	Z: 5, J: 6, L: 7,
}

const P_COLORS = {
	[P_TYPE.I]: "#0f7394", [P_TYPE.O]: "#9cb30b", [P_TYPE.T]: "#a10a99",
	[P_TYPE.S]: "#11a811", [P_TYPE.Z]: "#4f0099", [P_TYPE.J]: "#c70021",
	[P_TYPE.L]: "#0e3d9c",
}

export class Tetronimo {
	constructor(piece_type) {
		this.type = piece_type;
		this.origin = [0, 0];
		this.blocks = Array(4).fill([0, 0]); // block positions relative to origin
		this.spawn_piece();
	}

	print() {
		console.log(this.origin);
		console.log(this.blocks);
	}

	// Since collision detection can usually be solved by checking mins and maxes, some helper methods
	// for getting them are implemented
	min_x() {
		let res = Number.MAX_SAFE_INTEGER;
		for (let block of this.blocks)
			res = Math.min(res, block[0] + this.origin[0]);
		return res;
	}

	max_x() {
		let res = Number.MIN_SAFE_INTEGER;
		for (let block of this.blocks)
			res = Math.max(res, block[0] + this.origin[0]);
		return res;
	}

	min_y() {
		let res = Number.MAX_SAFE_INTEGER;
		for (let block of this.blocks)
			res = Math.min(res, block[1] + this.origin[1]);
		return res;
	}

	max_y() {
		let res = Number.MIN_SAFE_INTEGER;
		for (let block of this.blocks)
			res = Math.max(res, block[1] + this.origin[1]);
		return res;
	}

	// check if valid move by making a copy of the tetronimo's new position and checking if there is
	// any overlap with the grid.
	// Returns true if the new move is valid
	check_move(grid, dx, dy) {
		for (let block of this.blocks) {
			let nx = this.origin[0] + dx + block[0];
			let ny = this.origin[1] + dy + block[1];
			if (grid[ny][nx] !== P_TYPE.NONE)
				return false;
		}
		return true;
	}

	spawn_piece() {
		this.origin = [5, 4];
		switch (this.type) {
			case P_TYPE.I:
				this.blocks = [[0, -1], [0, 0], [0, 1], [0, 2]];
				break;
			case P_TYPE.O:
				this.blocks = [[-1, -1], [-1, 0], [0, -1], [0, 0]];
				break;
			case P_TYPE.T:
				this.blocks = [[-1, 0], [0, 0], [1, 0], [0, -1]];
				break;
			case P_TYPE.S:
				this.blocks = [[-1, 0], [0, 0], [0, -1], [1, -1]];
				break;
			case P_TYPE.Z:
				this.blocks = [[-1, -1], [0, -1], [0, 0], [1, 0]];
				break;
			case P_TYPE.J:
				this.blocks = [[-1, -1], [-1, 0], [0, 0], [1, 0]];
				break;
			case P_TYPE.L:
				this.blocks = [[-1, 0], [0, 0], [1, 0], [1, -1]];
				break;
		}
	}

	// This will check the grid to see if the piece can fall down. If it can, it will move piece down once.
	// returns true if still falling
	fall(grid) {
		let can_fall = true;
		for (let block of this.blocks) {
			let x = this.origin[0] + block[0];
			let y = this.origin[1] + block[1];
			// console.log(x, y);
			// check if min y pos is at bottom
			if (y === PLAYFIELD_YMAX - 1) { // at bottom
				can_fall = false;
			} else if (grid[y + 1][x] !== P_TYPE.NONE) { // if below piece is non-empty
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
			for (let block of this.blocks) {
				let x = this.origin[0] + block[0];
				let y = this.origin[1] + block[1];
				grid[y][x] = this.type;
			}
		}

		return can_fall;
	}

	move(keycode, tetris) {

		switch (keycode) {
			case KEY.LEFT:
				if (this.min_x() > 0 && this.check_move(tetris.grid, -1, 0))
					this.origin[0]--;
				break;
			case KEY.DOWN:
				if (this.max_y() < PLAYFIELD_YMAX - 1 && this.check_move(tetris.grid, 0, +1)) {
					this.origin[1]++;
					tetris.score += 1; // This will add 1 extra point for every block hard/soft dropped.
				}
				break;
			case KEY.RIGHT:
				if (this.max_x() < PLAYFIELD_XMAX - 1 && this.check_move(tetris.grid, +1, 0))
					this.origin[0]++;
				break;
			case KEY.UP: // This should be removed when were no longer testing
				if (this.max_y() > 0 && this.check_move(tetris.grid, 0, -1))
					this.origin[1]--;
				break;
			default:
				console.log("Error: Move has wrong key: ", keycode);
				break;
		}
	}

	rotate(keycode, tetris) {
		// We cannot rotate O
		if (this.type === P_TYPE.O)
			return;

		// Returns the rotated version of the blocks.
		const get_rotated = (keycode) => {
			// This is a separate function because we want a copy of the rotated
			// piece before actually rotating it to check if the rotation overlaps
			// with another piece, or falls outside the boundaries of the tetris.grid.
			let rotated = this.blocks.map((coord) => { return coord.slice() }); // create hard copy
			if (keycode === KEY.Z) {
				for (let coord of rotated) {
					let x = coord[0];
					let y = coord[1];
					coord[0] = y;
					coord[1] = -x;
				}
			} else if (keycode === KEY.X) {
				for (let coord of rotated) {
					let x = coord[0];
					let y = coord[1];
					coord[0] = -y;
					coord[1] = x;
				}
			}
			return rotated;
		}

		let can_rotate = true;
		let rotated = get_rotated(keycode);
		for (let rot of rotated) {
			let rx = this.origin[0] + rot[0];
			let ry = this.origin[1] + rot[1];
			// first, check if rotated position is within the boundaries of the grid
			if (rx < 0 || rx >= PLAYFIELD_XMAX || ry < 0 || ry >= PLAYFIELD_YMAX) {
				can_rotate = false;
				break;
			}
			// second, check if the rotated position overlaps with any
			// other pieces already on the grid
			if (tetris.grid[ry][rx] !== P_TYPE.NONE) {
				can_rotate = false;
				break;
			}
		}
		if (can_rotate)
			this.blocks = rotated;
	}

	hard_drop(tetris) {
		while (this.fall(tetris.grid)) {
			this.move(KEY.DOWN, tetris);
		}
	}
}

// Actual Tetris Logic
export class Tetris {
	constructor(start_level = 0) {
		this.grid = Array(PLAYFIELD_YMAX).fill().map(
			() => Array(PLAYFIELD_XMAX).fill(P_TYPE.NONE)
		);
		this.piece_counter = { [P_TYPE.I]: 0, [P_TYPE.O]: 0, [P_TYPE.T]: 0, [P_TYPE.J]: 0, [P_TYPE.L]: 0, [P_TYPE.S]: 0, [P_TYPE.Z]: 0 }

		this.score = 0;
		this.level = start_level;
		this.lines_cleared = 0;
		this.tetris_count = 0;
		this.fall_tick = 0; // ms per grid
		this.update_fall_speed();

		this.queue = [];
		this.populate_queue()
	}

	print_grid() { console.log(this.grid); }

	populate_queue(n = 10) {
		this.queue = [];
		for (let i = 0; i < n; i++)
			this.queue.push(this.spawn_rand_piece())
	}

	// If any pieces land above where the game renders, it's game over
	check_gameover() {
		for (let y = 3; y < 5; y++) {
			for (let x = 0; x < PLAYFIELD_XMAX; x++) {
				if (this.grid[y][x] !== P_TYPE.NONE) {
					console.log("Game over!");
					return true;
				}
			}
		}
		return false;
	}

	spawn_rand_piece() {
		let rand_type = Math.round(Math.random() * (P_TYPE.L - 1) + 1);
		return new Tetronimo(rand_type);
	}

	// checks and clears all full lines, returns how many lines were cleared 
	clear_lines() {
		console.log("Checking for full lines");
		let lines_cleared = 0;
		// Do a downward scan to see if line is full
		for (let y = 5; y < PLAYFIELD_YMAX; y++) {
			console.log(`y: ${y}`);
			let is_full = true;

			// scan the line
			for (let x = 0; x < PLAYFIELD_XMAX; x++) {
				if (this.grid[y][x] === P_TYPE.NONE) {
					is_full = false;
					break;
				}
			}

			if (is_full) {
				console.log(`Detected full line at ${y}`);
				// clear the current line
				for (let x = 0; x < PLAYFIELD_XMAX; x++) {
					this.grid[y][x] = P_TYPE.NONE;
				}
				// shift all lines above from current y coordinate down 1
				for (let yy = y; yy >= 5; yy--) {
					this.grid[yy] = this.grid[yy - 1]
				}
				lines_cleared++; // will be used for scoring when it's implemented
			}
		}
		return lines_cleared;
	}

	score_keeper(lines_cleared) {
		// n = level
		// 1 line 		2 line 			3 line 			4 line
		// 40 * (n + 1)	100 * (n + 1)	300 * (n + 1)	1200 * (n + 1)
		switch (lines_cleared) {
			case 1:
				this.score += 40 * (this.level + 1);
				break;
			case 2:
				this.score += 100 * (this.level + 1);
				break;
			case 3:
				this.score += 300 * (this.level + 1);
				break;
			case 4:
				this.score += 1200 * (this.level + 1);
				break;
		}
	}

	// When level up happens, speed up the fall speed.
	update_fall_speed() {
		if (this.level < 9)
			this.fall_tick = (48 - (5 * (this.level + 1))) * 61;
		else if (this.level == 9)
			this.fall_tick = 6 * 61;
		else if (this.level < 13)
			this.fall_tick = 5 * 61;
		else if (this.level < 16)
			this.fall_tick = 4 * 61;
		else if (this.level < 16)
			this.fall_tick = 3 * 61;
		else if (this.level < 19)
			this.fall_tick = 2 * 61;
		else
			this.fall_tick = 1 * 61;
	}
}

// Tetronimo objects for drawing UI
const TET_UI = [
	new Tetronimo(P_TYPE.I),
	new Tetronimo(P_TYPE.O),
	new Tetronimo(P_TYPE.T),
	new Tetronimo(P_TYPE.J),
	new Tetronimo(P_TYPE.L),
	new Tetronimo(P_TYPE.S),
	new Tetronimo(P_TYPE.Z),
]

export class GFX {
	constructor() {
		bg_canvas.style.position = "absolute";
		tetris_canvas.style.position = "absolute";
		bg_canvas.style.top = "50";
		bg_canvas.style.left = "50";
		tetris_canvas.style.top = "50";
		tetris_canvas.style.left = "50";
		this.ui_offset = tetris_canvas.width;
		this.ui_width = bg_canvas.width - tetris_canvas.width;
	}


	draw_playfield() {
		const ctx = tetris_canvas.getContext("2d");
		ctx.fillStyle = FIELD_COLOR;
		ctx.fillRect(0, 0, tetris_canvas.width, tetris_canvas.height);
	}

	draw_gridlines() {
		const ctx = tetris_canvas.getContext("2d");
		const horiz_inc = tetris_canvas.height / 20;
		const vert_inc = tetris_canvas.width / 10;

		// Draw horizontal lines
		for (let y = 0; y < tetris_canvas.height; y += horiz_inc) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(tetris_canvas.width, y);
			ctx.stroke();
		}
		// Draw vertical lines
		for (let x = 0; x < tetris_canvas.width; x += vert_inc) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, tetris_canvas.height);
			ctx.stroke();
		}
	}

	// Draw the actual pieces and shit on the 2d grid (except the piece currently in motion)
	draw_grid_elements(grid) {
		const ctx = tetris_canvas.getContext("2d");
		const horiz_inc = tetris_canvas.height / 20;
		const vert_inc = tetris_canvas.width / 10;

		for (let y = PLAYFIELD_YMAX - 1; y >= PLAYFIELD_YMAX - 20; y--) {
			for (let x = 0; x < PLAYFIELD_XMAX; x++) {
				// dx, dy are drawing coords
				let dx = x * horiz_inc;
				let dy = (y - Y_OFF) * vert_inc;
				if (grid[y][x] != P_TYPE.NONE) {
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
	draw_falling_tetronimo(tetronimo) {
		const ctx = tetris_canvas.getContext("2d");
		const horiz_inc = tetris_canvas.height / 20;
		const vert_inc = tetris_canvas.width / 10;

		let origin = tetronimo.origin;
		let blocks = tetronimo.blocks;
		let p_type = tetronimo.type;

		ctx.fillStyle = P_COLORS[p_type];
		for (let block of blocks) {
			let dx = (origin[0] + block[0]) * horiz_inc;
			let dy = (origin[1] + block[1] - Y_OFF) * vert_inc;
			ctx.beginPath();
			ctx.rect(dx, dy, horiz_inc, vert_inc);
			ctx.fill();
			ctx.stroke();
		}
	}

	draw_all_game_elements(grid, tetronimo) {
		// this.draw_background();
		this.draw_playfield();
		this.draw_grid_elements(grid);
		this.draw_gridlines();
		this.draw_falling_tetronimo(tetronimo);
	}

	/* UI drawing methods below */

	draw_ui_all(tetris) {
		this.draw_ui_background();
		this.draw_ui_text("TetrisJS", 30, this.ui_offset + (this.ui_width / 2), 32);
		this.draw_ui_stats(tetris.piece_counter);
		this.draw_ui_queue(tetris);
		this.draw_ui_text("Made by Hoswoo", 20, this.ui_offset + (this.ui_width / 2), bg_canvas.height - 25);
		this.draw_ui_score(tetris);
		this.draw_ui_level(tetris)
	}

	draw_ui_background() {
		const ctx = bg_canvas.getContext("2d");
		ctx.fillStyle = BG_COLOR;
		ctx.fillRect(0, 0, bg_canvas.width, bg_canvas.height);
	}

	draw_ui_mini_piece(tetronimo, x, y) {
		const ctx = bg_canvas.getContext("2d");
		const dim = 15;
		const x_off = -100;
		const y_off = -625;

		let origin = tetronimo.origin;
		let blocks = tetronimo.blocks;
		let p_type = tetronimo.type;

		ctx.fillStyle = P_COLORS[p_type];

		for (let block of blocks) {
			let dx = x + x_off + (origin[0] + block[0]) * dim;
			let dy = y + y_off + (origin[1] + block[1]) * dim;
			ctx.beginPath();
			ctx.rect(dx, dy, dim, dim);
			ctx.fill();
			ctx.stroke();
		}
	}

	draw_ui_text(text, size, x, y) {
		const ctx = bg_canvas.getContext("2d");
		ctx.font = size.toString() + "px Arial";
		ctx.textAlign = "center";
		ctx.fillStyle = "white";
		ctx.fillText(text, x, y);
	}

	draw_ui_queue(tetris, count = 5) { // Draw 'count' next pieces
		let x = this.ui_offset + 80;
		let y = this.ui_offset + 280;
		let y_inc = 50;

		this.draw_ui_text("Next piece", 20, x, 70);
		for (let i = 0; i < count; i++) {
			let piece = tetris.queue[i];
			this.draw_ui_mini_piece(piece, x + 15, y);
			if (piece.type == P_TYPE.I)
				y += 25;
			y += y_inc;
		}
	}

	draw_ui_stats(piece_counter) {
		let x = this.ui_offset + 220;
		let x_gap = 25;
		let y = this.ui_offset + 355;
		let y_inc = 50;
		let i_piece = TET_UI[0];

		this.draw_ui_text("Statistics", 20, x, 70);
		this.draw_ui_mini_piece(i_piece, x, this.ui_offset + 280);
		this.draw_ui_text(piece_counter[P_TYPE.I].toString(), 20, x + x_gap, 128);

		let dy = 185;
		let dy_inc = 50;
		for (let i = 1; i < TET_UI.length; i++) {
			let piece = TET_UI[i];
			this.draw_ui_mini_piece(piece, x, y);
			this.draw_ui_text(piece_counter[piece.type], 20, x + x_gap, dy);
			y += y_inc;
			dy += dy_inc;
		}
	}

	draw_ui_score(tetris) {
		let x = this.ui_offset + 150;
		let y = 725;
		let y_inc = 25;
		let y_gap = 100;
		this.draw_ui_text(`SCORE`, 30, x - 30, y);
		this.draw_ui_text(`${tetris.score.toString().padStart(10, '0')}`, 30, x, y + y_inc);
	}

	draw_ui_level(tetris) {
		let x = this.ui_offset + 150;
		let y = 500;
		this.draw_ui_text(`Level: ${tetris.level.toString().padStart(2, '0')} `, 30, x, y);
	}

	draw_lines_cleared(tetris) { // also displays tetris count
		let x = this.ui_offset + 150;
		let y = 550;
		let y_inc = 50;
		this.draw_ui_text(`Level: ${tetris.lines_cleared.toString().padStart(4, '0')} `, 30, x, y);
		this.draw_ui_text(`Tetris: `)
	}
}
