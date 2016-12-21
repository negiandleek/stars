"use strict";

(() => {
	let $ = $ == null ? {}: $;
	let request_animation_frame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
		window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	let cansel_animation_frame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

	document.addEventListener("DOMContentLoaded", () => {
		setup();
	})

	let setup = () => {
		let el = document.getElementById("main");
		$.renderer = PIXI.autoDetectRenderer(512, 512);
		el.appendChild($.renderer.view);
		$.renderer.backgroundColor = 0xf0f0f0;

		$.stage = new PIXI.Container();

		$.you = new Player();

		// keyboard arrow keys
		let left = keyboard(37);
		let up = keyboard(38);
		let right = keyboard(39);
		let down = keyboard(40);

		left.press = () => {
			$.you.vx = -5;
		}
		left.release = () => {
			if(!right.is_down){
				$.you.vx = 0;
			}
		}

		up.press = function() {
		    $.you.vy = -5;
	 	};
		up.release = function() {
	    	if (!down.is_down) {
	      		$.you.vy = 0;
	    	}
	 	};

		right.press = () => {
			$.you.vx = 5;
		}
		right.release = () => {
			if(!left.is_down){
				$.you.vx = 0;
			}
		}

		down.press = function() {
		    $.you.vy = 5;
	  	};
		down.release = function() {
			if (!up.is_down) {
			  $.you.vy = 0;
			}
		};

		game_loop();
	}

	let game_loop = () => {
		request_animation_frame(game_loop);
		$.you.move();
		$.renderer.render($.stage);
	}

	let keyboard = (key_code) => {
		let key = {};
		key.code = key_code;
		key.is_down = false;
		key.is_up = true;
		key.press = null;
		key.release = null;

		key.down_handler = (e) => {
			if(e.keyCode === key.code){
				if(key.is_up && key.press) {
					key.press();
				}
				key.is_down = true;
				key.is_up = false;
			}
			e.preventDefault();
		};

		key.up_handler = (e) => {
			if(e.keyCode === key.code){
				if(key.is_down && key.release){
					key.release();
				}
				key.is_down = false;
				key.is_up = true;
			}
			e.preventDefault();
		};

		window.addEventListener("keydown", key.down_handler.bind(key), false);
		window.addEventListener("keyup", key.up_handler.bind(key), false);

		return key;
	}

	class Player{
		constructor() {
			this.running = true;
			this.alive = true;
			this.entity = new PIXI.Graphics();
			this.entity.beginFill(0x000);
			this.entity.drawCircle(0, 0, 16);
			this.entity.endFill();
			this.entity.x = 300;
			this.entity.y = 300;
			this.vx = 0;
			this.vy = 0;
			$.stage.addChild(this.entity);
		}
		move() {
			if(this.running && this.alive){
				this.entity.y += this.vy;
				this.entity.x += this.vx;
			}
		}
	}
})();