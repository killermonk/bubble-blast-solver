function GameBoard() {
	this.width = 5;
	this.height = 6;
	this.bubbles = {};
	this.particles = {};
	this.state = [];
};

$.extend(GameBoard.prototype, {
	MAX_BUBBLE_HITS: 4,

	async_solve: function(max_touches, callback) {
		var that = this;
		var defer = $.Deferred(function(d) {
			var clicks = that.solve(max_touches);
			d.resolve(clicks);
		});
		return defer.done(callback).promise();
	},

	solve: function(max_touches) {
		var clicks = [];

		var that = this;
		function _solve(touch) {
			for (var y=0; y<that.height; y++) {
				for (var x=0; x<that.width; x++) {
					that._push_state();
					if (that.poke(x, y)) {
						if (that.solved() || (touch+1 < max_touches && _solve(touch+1))) {
							clicks.push([x,y]);
							return true;
						}
					}
					that._pop_state();
				}
			}

			return false;
		}

		_solve(0);

		// Added in reverse order by recursion
		clicks.reverse();
		return clicks;
	},

	_loc: function(x, y) {
		return parseInt(x,10) + ',' + parseInt(y,10);
	},

	_coords: function(loc) {
		var coords = loc.split(',');
		return [parseInt(coords[0]), parseInt(coords[1])];
	},

	_push_state: function() {
		var new_bubbles = {};
		for (var loc in this.bubbles) {
			var other = this.bubbles[loc];
			new_bubbles[loc] = {
				hits: other.hits
			};
		}

		var new_particles = {};
		for (var loc in this.particles) {
			if (!(loc in new_particles))
				new_particles[loc] = [];

			for (var i=0; i<this.particles[loc].length; i++) {
				var p = this.particles[loc][i];
				new_particles[loc].push({
					xdir: p.xdir,
					ydir: p.ydir
				});
			}
		}

		this.state.push({
			bubbles: new_bubbles,
			particles: new_particles
		});
	},

	_pop_state: function() {
		var state = this.state.pop();

		this.bubbles = state.bubbles;
		this.particles = state.particles;
	},

	solved: function() {
		return jQuery.isEmptyObject(this.bubbles);
	},

	clear: function() {
		this.bubbles = {};
		this.particles = {};
		this.state = [];
	},

	add_bubble: function(xpos, ypos, hits) {
		var loc = this._loc(xpos, ypos);
		if (loc in this.bubbles)
			return false;

		this.bubbles[loc] = {hits: hits};
		return true;
	},

	poke: function(xpos, ypos) {
		var loc = this._loc(xpos, ypos);
		if (loc in this.bubbles) {
			var bubble = this.bubbles[loc];
			bubble.hits += 1;
			if (bubble.hits >= this.MAX_BUBBLE_HITS) {
				this._explosion(xpos, ypos);
				this._animate();
			}
			return true;
		}
		return false;
	},

	_explosion: function(xpos, ypos) {
		var loc = this._loc(xpos, ypos);
		if (!(loc in this.particles))
			this.particles[loc] = [];

		this.particles[loc].push({xdir:+1, ydir:0});
		this.particles[loc].push({xdir:-1, ydir:0});
		this.particles[loc].push({xdir:0, ydir:+1});
		this.particles[loc].push({xdir:0, ydir:-1});

		delete this.bubbles[loc];

	},

	_animate: function() {
		while (!jQuery.isEmptyObject(this.particles)) {
			// Move everything first then calculate collisions
			var newp = {};
			for (var loc in this.particles) {
				for (var i=0; i<this.particles[loc].length; i++) {
					var p = this.particles[loc][i];
					var coords = this._coords(loc);
					var newx = coords[0] + p.xdir;
					var newy = coords[1] + p.ydir;

					// Only keep it if it is in bounds
					if (newx >= 0 && newx < this.width && newy >= 0 && newy < this.height) {
						var newloc = this._loc(newx, newy);
						if (!(newloc in newp))
							newp[newloc] = [];

						newp[newloc].push(p);
					}
				}
			}

			this.particles = newp;

			// Calculate new explosions
			for (var loc in this.particles) {
				if (loc in this.bubbles) {
					var bubble = this.bubbles[loc];
					bubble.hits += this.particles[loc].length;
					delete this.particles[loc];

					if (bubble.hits >= this.MAX_BUBBLE_HITS) {
						var coords = this._coords(loc);
						this._explosion(coords[0], coords[1]);
					}
				}
			}
		}
	},

	toHTML: function(highlightx, highlighty) {
		var table = $('<table></table>');
		$(table).attr('border', '1px');
		
		for (var y=0; y<this.height; y++) {
			var row = $('<tr></tr>');
			for (var x=0; x<this.width; x++) {
				var col = $('<td><div></div></td>');
				col.addClass('cell');

				var loc = this._loc(x, y);
				if (loc in this.bubbles) {
					var b = this.bubbles[loc];
					col.addClass('hit' + b.hits);
				}

				if (x == highlightx && y == highlighty) {
					col.addClass('highlight');
				}

				row.append(col);
			}
			table.append(row);
		}

		return table;
	}
});