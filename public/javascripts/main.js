"use strict";

(() => {
	let $ = $ == null ? {}: $;
	let request_animation_frame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
		window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	let cansel_animation_frame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;
	let directions = ["UP", "UPRIGHT", "RIGHT", "DOWNRIGHT", "DOWN", "DOWNLEFT", "LEFT", "UPLEFT"];
	let now = Date.now || function () {
		return new Date().getTime();
	}
	// プレイヤーの視点
	let stage = {
		x: 512,
		y: 512
	};
	let scope = {
		x: 512,
		y: 512
	}

	document.addEventListener("DOMContentLoaded", () => {
		setup();
	})

	let setup = () => {
		let el = document.getElementById("main");
		$.renderer = PIXI.autoDetectRenderer(stage.x, stage.y);
		el.appendChild($.renderer.view);
		$.renderer.backgroundColor = 0xf0f0f0;

		$.stage = new PIXI.Container();

		// 操作できるプレイヤー(あなた)の管理
		$.you = new Player();
		// ステージに追加
		$.stage.addChild($.you.get_pixi());

		// 操作できないプレイヤー(他プレイヤー)の管理
		$.enemys = new PIXI.Container();
		$.stage.addChild($.enemys);

		// keyboard arrow keys
		let left = keyboard(37);
		let up = keyboard(38);
		let right = keyboard(39);
		let down = keyboard(40);
		let space = keyboard(32);

		left.press = () => {
			$.you.vx = -2;
		}
		left.release = () => {
			if(!right.is_down){
				$.you.vx = 0;
			}
		}

		up.press = () => {
		    $.you.vy = -2;
	 	};
		up.release = () => {
	    	if (!down.is_down) {
	      		$.you.vy = 0;
	    	}
	 	};

		right.press = () => {
			$.you.vx = 2;
		}
		right.release = () => {
			if(!left.is_down){
				$.you.vx = 0;
			}
		}

		down.press = () => {
		    $.you.vy = 2;
	  	};
		down.release = () => {
			if (!up.is_down) {
			  $.you.vy = 0;
			}
		};

		// ショットを放つ
		space.state = false;
		space.press = () => {
			if(!space.state){
				$.you.shot();
			}
			space.state = true;
		}
		space.release = () => {
			space.state = false
		}

		// 他プレイヤーの情報を初期化する
		enemy_loop();

		game_loop();
	}

	// 仮
	let json = [
		{"id": 2, "position":{"x": 50, "y": 50}, "alive": true, "angle": 45},
		{"id": 4, "position":{"x": 400, "y": 50}, "alive": true, "angle": 215},
	];

	let game_loop = () => {
		request_animation_frame(game_loop);
		$.you.move();
		// enemy_loop();
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

	let get_sign = function(int) {
		if(int > 0){
			return 1;
		}else if(int < 0){
			return -1;
		}else{
			return 0;
		}
	}

	let enemy_loop = () => {
		json.map((property, index) => {
			$.enemys.addChild(new Enemy(property).get_pixi());
		})
	}

	class StarManage {
		constructor() {
			this.piece = 360 / directions.length;
		}
		detecte_angle() {
			let y_sign = get_sign(this.vy);
			let x_sign = get_sign(this.vx);
			let y_axis = "";
			let x_axis = "";
			let str_direction = "";
			let i = 0;

			if(y_sign === 0 && x_sign === 0){
				return this.angle;
			}

			if(y_sign === -1){
				y_axis = "UP";
			}else if(y_sign === 1){
				y_axis = "DOWN";
			}

			if(x_sign === 1){
				x_axis = "RIGHT";
			}else if(x_sign === -1){
				x_axis = "LEFT";
			}

			str_direction = y_axis + x_axis;

			i = directions.indexOf(str_direction);
			return i * this.piece;
		}
		get_radian(now){
			let previous = this.angle;
			let sub = now - previous;
			
			// 0 ~ 360に収まるように変換する
			sub -= Math.floor(sub / 360) * 360;

			// -180 ~ 180に収まるように変換する
			if(sub > 180){
				sub -= 360;
			}

			// radianに変換
			let rad = sub * (Math.PI / 180);
			return rad;
		}
	}

	class Enemy extends StarManage{
		constructor(data){
			super();
			this.radius = 16;
			this.angle = 0;
		
			// 敵の本体
			this.body = new PIXI.Graphics();
			this.body.beginFill(0x0000ff);
			this.body.drawCircle(0, 0, this.radius);
			this.body.endFill();
			this.body.x = 0;
			this.body.y = 0;

			// safe zone
			this.circle = new PIXI.Graphics();
			this.circle.lineStyle(2, 0x000);
			this.circle.drawCircle(0, 0, this.radius * 2);
			this.circle.endFill();
			this.circle.x = this.body.x;
			this.circle.y = this.body.y;

			// 矢印
			this.arrow = new PIXI.Graphics();
			this.arrow.beginFill(0x000);
			this.arrow.drawPolygon([
				-4, 12,
				4, 12,
				0, 0,
			]);
			this.arrow.endFill();
			this.arrow.x = this.body.x;
			this.arrow.y = this.body.y - this.radius - 16;

			// グループ化する
			this.star = new PIXI.Container();
			this.star.addChild(this.body);
			this.star.addChild(this.circle);
			this.star.addChild(this.arrow);

			this.star.x = data.position.x;
			this.star.y = data.position.y;

			// 回転させる
			this.rotate(data.angle);
		}
		get_pixi(){
			// pixiに関する情報を返す
			return this.star;
		}
		rotate(angle){
			if(this.angle !== angle){
				this.star.rotation += this.get_radian(angle);
				this.angle = angle;
			}
		}
	}

	class Player extends StarManage{
		constructor(x, y) {
			super();
			this.running = true;
			this.alive = true;
			this.angle = 0;
			this.vx = 0;
			this.vy = 0;

			// 本体
			let radius = 16;
			this.body = new PIXI.Graphics();
			this.body.beginFill(0x000);
			this.body.drawCircle(0, 0, radius);
			this.body.endFill();
			this.body.x = 0;
			this.body.y = 0;

			// safe zone
			this.circle = new PIXI.Graphics();
			this.circle.lineStyle(2, 0x000);
			this.circle.drawCircle(0, 0, radius * 2);
			this.circle.endFill();
			this.circle.x = this.body.x;
			this.circle.y = this.body.y;

			// 矢印
			this.arrow = new PIXI.Graphics();
			this.arrow.beginFill(0x000);
			this.arrow.drawPolygon([
				-4, 12,
				4, 12,
				0, 0,
			]);
			this.arrow.endFill();
			this.arrow.x = this.body.x;
			this.arrow.y = this.body.y - radius - 16;

			// グループ化する
			this.star = new PIXI.Container();
			this.star.addChild(this.body)
			this.star.addChild(this.circle)
			this.star.addChild(this.arrow)

			this.star.x = x || 300;
			this.star.y = y || 300;

			// ショットを管理する
			this.loaded_bullets = 3;
			this.fired_bullets = 0;
			this.bullets = [];
			this.load_time = 500;
		}
		get_pixi(){
			// pixiに関する情報を返す
			return this.star;
		}
		move() {
			if(this.running && this.alive){
				this.star.y += this.vy;
				this.star.x += this.vx;
				this.rotate();
			}
		}
		rotate(){
			let angle = this.detecte_angle();
			if(this.angle !== angle){
				this.star.rotation += this.get_radian(angle);
				this.angle = angle;
			}
		}
		shot() {
			if(this.fired_bullets < this.loaded_bullets){
				let x = this.arrow.getGlobalPosition().x;
				let y = this.arrow.getGlobalPosition().y;
				new Bullet(x, y, this.angle);
				this.fired_bullets += 1;
				
				// 発射すると装填時間がそれぞれにかかる
				setTimeout(this.load_shot.bind(this), this.load_time);
			}
		}
		load_shot() {
			this.fired_bullets -= 1;
		}
	}

	class Bullet{
		constructor(x, y, angle){
			this.radius = 4;
			this.body = new PIXI.Graphics();
			this.body.beginFill(0x000);
			this.body.drawCircle(0, 0, this.radius);
			this.body.endFill();
			this.body.x = x;
			this.body.y = y;
			this.angle = angle
			this.is_ready = false;
			
			// ステージに追加
			$.stage.addChild(this.body);

			// 決まった方向に動かす
			this.vx = 0;
			this.vy = 0;
			this.speed = 8;
			
			// vxとvyを定めるする
			this.get_direction(angle);
			this.move();
		}
		get_direction(angle) {
			let sin =  Math.sin(angle * (Math.PI / 180));
			sin = sin * 10 | 0 ? get_sign(sin): 0;

			let cos = Math.cos(angle * (Math.PI / 180));
			cos = cos * 10 | 0 ? get_sign(cos): 0;

			this.vx = sin * this.speed;
			this.vy = -1 * cos * this.speed;
		}
		get_sprite(){
			return this.body;
		}
		move() {
			if(this.is_ready){
				this.body.x += this.vx
	 			this.body.y += this.vy;
	 		}else{
	 			this.is_ready = true;
	 		}

	 		let tmpx = this.body.x + this.radius;
	 		let subx = this.body.x - this.radius;

	 		let tmpy = this.body.y + this.radius;
	 		let suby = this.body.y - this.radius;


	 		// 表示判定
	 		if(tmpx < 0 || 
	 		subx > stage.x ||
	 		tmpy < 0 || 
	 		suby > stage.y){
	 			$.stage.removeChild(this.body);
	 		}else{
	 			request_animation_frame(this.move.bind(this));
	 		}
		}
	}

})();