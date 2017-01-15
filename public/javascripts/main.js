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
		$.socket = io();
		setup();
		$.socket.on("add ship", (data) => {
			let _ships = data.ships;
			$.you.letter.id = $.you.id = data.id;
			
			for(let key in _ships){
				$.other.addChild(new Enemy(_ships[key]).star);
			}
		});

		$.socket.on("add enemy", (data) => {
			$.other.addChild(new Enemy(data).star);
		})

		$.socket.on("update", (data) => {
			let length = $.other.children.length;
			let ship_data = data.ships;
			for(let key in ship_data){
				for(let i = 0; i < length; i += 1){
					let item = $.other.children[i];
					if(key === item.id){
						item.x = ship_data[key].x;
						item.y = ship_data[key].y;
						break;
					}
				}
			}

			let shots_data = data.shots;
			let _length = $.you_shots.children.length;
			let __length = $.other_bullets.children.length;

			for(let key in shots_data){
				let state = true;
				for(let i = 0; i < _length; i += 1){
					if($.you_shots.children[i].id === key){
						state = false;
						break;
					}
				}
				if(!state)continue;

				let already = false;
				let index = -1;
				for(let i = 0; i < __length; i += 1){
					if($.other_bullets.children[i].id === key){
						already = true;
						index = i;
						break;
					}
				}
				if(!already){
					$.other_bullets.addChild(new Bullet(shots_data[key].x, shots_data[key].y, 0, key));
					console.log($.other_bullets.children);
				}else{
					$.other_bullets.children[index].x = shots_data[key].x;
					$.other_bullets.children[index].y = shots_data[key].y;
				}
			}
		});

		$.socket.on("delete enemy", (data) => {
			let _id = data.id;
			let length = $.other.children.length;
			for(let i = 0; i < length; i += 1){
				let item = $.other.children[i];
				if(_id === item.id){
					$.other.removeChild(item);
					break;
				}
			}
		})

		$.socket.on("delete", (data) => {
			let length = $.other_bullets.children.length;
			let array = []
			for(let i = 0; i < length; i += 1){
				let item = $.other_bullets.children[i];
				if(item.id === data.id){
					array.push(i);
				}
			}
			if(array.length > 0){
				array.map((item)=>{
					$.other_bullets.removeChild($.other_bullets.children[item]);
				})
			}
		})
	})

	let setup = () => {
		let el = document.getElementById("main");
		$.renderer = PIXI.autoDetectRenderer(stage.x, stage.y);
		el.appendChild($.renderer.view);
		$.renderer.backgroundColor = 0xf0f0f0;

		$.stage = new PIXI.Container();

		// 操作できるプレイヤー(あなた)の管理
		$.you = new Player();
		$.stage.addChild($.you.get_pixi());

		// プレイヤーの発射したショットの管理
		$.you_shots = new PIXI.Container();
		$.stage.addChild($.you_shots);

		// 操作できないプレイヤー(他プレイヤー)の管理
		$.other = new PIXI.Container();
		$.stage.addChild($.other);

		// 他プレイヤーの発射したショットの管理
		$.other_bullets = new PIXI.Container();
		$.stage.addChild($.other_bullets);

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
		// other_loop();
		init_server();
		game_loop();
	}

	let init_server = () => {
		$.socket.emit("init ship", {
			x: $.you.letter.x,
			y: $.you.letter.y,
		});
	}

	let game_loop = () => {
		request_animation_frame(game_loop);

		// other_loop();
		$.you.loop();  
		you_shot_loop();
		$.renderer.render($.stage);
		let you = $.you.letter;
		
		let shots = [];
		$.you_shots.children.map((item)=>{
			shots.push({
				x: item.x,
				y: item.y,
				id: item.id
			});
		});

		$.socket.emit("update shot", {
			shots: shots
		})

		$.socket.emit("update ship", {
			ship: you
		})
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

	// r1 stars
	// r2 stars or bullet
	let is_hit_circle = (r1, r2) => {
 		let hit = false;
 		let p = {
 			x: r2.x - r1.x,
 			y: r2.y - r1.y,
 		};
 		let length = Math.sqrt(p.x * p.x + p.y * p.y);
 		return length <= r2.radius;
	}

	let other_loop = () => {
		json.stars.map((property, index) => {
			let already = false;
			let length = $.other.children.length;

			for(let i = 0; i < length; i += 1){
				let item = $.other.children[i];
				if(item.id === property.id){
					already = true;
					index = i;
					break;
				}
			}

			if(already){
				$.other.children[index].update(property);
			}else{
				$.other.addChild(new Enemy(property).star);
			}
		});

		json.bullets.map((property) => {
			let already = false;
			let index = 0;
			let length = $.other_bullets.children.length;

			for(let i = 0; i < length; i += 1){
				let item = $.other_bullets.children[i];
				if(item.id === property.id){
					already = true;
					index = i;
					break;
				}
			}
			if(already){
				$.other_bullets.children[index].update(property);
			}else{
				let x = property.position.x;
				let y = property.position.y;
				let angle = property.angle;
				let id = property.id;
				$.other_bullets.addChild(new Bullet(x, y, angle, id));
			}
		});
	}

	let you_shot_loop = function () {
		$.you_shots.children.map((property, index) => {
			property.move();
			$.other.children.map((item)=>{
				is_hit_circle(item, property);
			});
		})
	} 

	let StarContainer = function() {
		PIXI.Container.call(this);
		this.piece = 360 / directions.length;
	}
	StarContainer.constructor = StarContainer;

	StarContainer.prototype = Object.create(PIXI.Container.prototype);
	StarContainer.prototype.detecte_angle = function() {
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

	StarContainer.prototype.get_radian = function(now) {
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

	class Player extends StarContainer{
		constructor(x, y) {
			super();
			this.id = -1;
			this.running = true;
			this.alive = true;
			this.angle = 0;
			this.vx = 0;
			this.vy = 0;

			// 本体
			this.radius = 16;
			this.body = new PIXI.Graphics();
			this.body.beginFill(0x000);
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
			this.star.addChild(this.body)
			this.star.addChild(this.circle)
			this.star.addChild(this.arrow)

			this.star.x = x || 400;
			this.star.y = y || 300;

			// ショットを管理する
			this.loaded_bullets = 3;
			this.fired_bullets = 0;
			this.bullets = [];
			this.load_time = 500;

			this.letter = {
				x: this.star.x,
				y: this.star.y,
				id: this.id
			};
		}
		get_pixi(){
			// pixiに関する情報を返す
			return this.star;
		}
		loop() {
			// 衝突判定
			$.other_bullets.children.map((item) => {
				// if(is_hit_circle(this.star, item)){
				// 	item.running = false;
				// 	item.alive = false;
				// }
			})
		 	// 表示判定
			if(this.running && this.alive){
				let x = this.star.x + this.vx;
				let y = this.star.y + this.vy;
				// フィールド内
		 		if(x >= 0 &&
		 		x <= stage.x && 
		 		y >= 0 &&
		 		y <= stage.y){
					this.letter.x = this.star.x = x;
		 			this.letter.y = this.star.y = y;
					this.rotate();
				}
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
				let shot = Bullet(x, y, this.angle);
				$.you_shots.addChild(shot);
				this.fired_bullets += 1;

				// 発射すると装填時間がそれぞれにかかる
				setTimeout(this.load_shot.bind(this), this.load_time);
			}
		}
		load_shot() {
			this.fired_bullets -= 1;
		}
	}

	function Enemy(data){
		let self = {};

		self.running = true;
		self.alive = true;

		self.radius = 16;
	
		// 敵の本体
		self.body = new PIXI.Graphics();
		self.body.beginFill(0x0000ff);
		self.body.drawCircle(0, 0, self.radius);
		self.body.endFill();
		self.body.x = 0;
		self.body.y = 0;

		// safe zone
		self.circle = new PIXI.Graphics();
		self.circle.lineStyle(2, 0x000);
		self.circle.drawCircle(0, 0, self.radius * 2);
		self.circle.endFill();
		self.circle.x = self.body.x;
		self.circle.y = self.body.y;

		// 矢印
		self.arrow = new PIXI.Graphics();
		self.arrow.beginFill(0x000);
		self.arrow.drawPolygon([
			-4, 12,
			4, 12,
			0, 0,
		]);
		self.arrow.endFill();
		self.arrow.x = self.body.x;
		self.arrow.y = self.body.y - self.radius - 16;

		// グループ化する
		self.star = new StarContainer();
		self.star.id = data.id;
		self.star.addChild(self.body);
		self.star.addChild(self.circle);
		self.star.addChild(self.arrow);
		self.star.x = data.x;
		self.star.y = data.y;
		self.star.angle = 0;
		self.star.rotate = function(angle) {
			if(this.angle !== angle){
				this.rotation += this.get_radian(angle);
				this.angle = angle;
			}
		}

		// 回転させる
		// self.star.rotate(data.angle);

		return self;
	}

	function Bullet(x, y, angle, id){
		let body = new PIXI.Graphics();
		body.id = id || Math.random().toString(36).substr(2, 9);
		body.running = true;
		body.alive = true;

		body.radius = 4;

		body.beginFill(0x000);
		body.drawCircle(0, 0, body.radius);
		body.endFill();
		body.x = x;
		body.y = y;

		body.angle = angle;
		body.is_ready = false;

		// 決まった方向に動かす
		body.vx = 0;
		body.vy = 0;
		body.speed = 8;
		
		body.update = function(data){
			this.x = data.position.x;
			this.y = data.position.y;
		}

		body.get_direction = function(angle) {
			let sin =  Math.sin(angle * (Math.PI / 180));
			sin = sin * 10 | 0 ? get_sign(sin): 0;

			let cos = Math.cos(angle * (Math.PI / 180));
			cos = cos * 10 | 0 ? get_sign(cos): 0;

			this.vx = sin * this.speed;
			this.vy = -1 * cos * this.speed;
		}
		body.move = function() {
			if(this.is_ready){
				// 斜めの時はベクトルを正規化する
				this.x += this.vx
	 			this.y += this.vy;
	 		}else{
	 			this.is_ready = true;
	 		}

	 		let tmpx = this.x + this.radius;
	 		let subx = this.x - this.radius;

	 		let tmpy = this.y + this.radius;
	 		let suby = this.y - this.radius;


	 		// 表示判定
	 		if(!this.alive && !this.running){
	 			$.you_shots.removeChild(this);
	 			body.delete();
	 			return;
	 		}

	 		if(tmpx < 0 || 
	 		subx > stage.x ||
	 		tmpy < 0 || 
	 		suby > stage.y){
	 			$.you_shots.removeChild(this);
	 			body.delete();
	 			return;
	 		}
		}

		body.delete = () => {
			$.socket.emit("delete shot", {
				id: body.id
		})
		}

		// vxとvyを定める
		body.get_direction(angle);
		body.move();

		// body.letter = {
		// 	x: body.x,
		// 	y: body.y,
		// 	id: body.id
		// }

		return body;
	}

})();
