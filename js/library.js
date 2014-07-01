jQuery.fn.ForceNumericOnly = function() {
	return this.each(function(){
		$(this).keydown(function(e){
			var key = e.charCode || e.keyCode || 0;
			// allow backspace, tab, delete, enter, arrows, numbers and keypad numbers
			return (
				key == 8 || //backspace
				key == 9 || //tab
				key == 13 || //carriage return
				(key >= 48 && key <= 57) || // 0-9
				(key >= 96 && key <= 105)); // keypad 0-9
		});
	});
};

jQuery.fn.NoContextMenu = function() {
	return this.each(function(){
		$(this).prop('nocontext', 1);
		$(this).data('nocontext', 1);
	});
};

jQuery.fn.BoardCell = function(x, y) {
	return this.each(function(){
		$(this).addClass('cell');
		$(this).NoContextMenu();
		$(this).data({
			x: x,
			y: y,
			hits: -1
		});

		var content = $('<div></div>');
		content.NoContextMenu();
		$(this).append(content);

		function hit(el, dir) {
			var hits = el.data('hits');

			if (hits >= 0) el.removeClass('hit' + hits);

			hits += dir;
			if (dir > 0 && hits > 3)
				hits = -1;
			else if (dir < 0 && hits < -1)
				hits = 3;

			if (hits >= 0)
				el.addClass('hit' + hits);

			el.data('hits', hits);
		}

		$(this).click(function(e) {
			e.preventDefault();
			hit($(this), +1);
		});
		$(this).dblclick(function(e) {
			e.preventDefault();
		});
		$(this).mousedown(function(e) {
			if (e.button == 2) {
				hit($(this), -1);
				e.preventDefault();
				return false;
			}
			return true;
		});
	});
};