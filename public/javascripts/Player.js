let $ = require("./main.js");
let StarManage = require("./StarManage.js");

class Player extends StarManage{
	constructor(x, y) {
		super();
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
	 	// 表示判定
		if(this.running && this.alive){
			let x = this.star.x + this.vx;
			let y = this.star.y + this.vy;
			// フィールド内
	 		if(x >= 0 &&
	 		x <= $.field.x &&
	 		y >= 0 &&
	 		y <= $.field.y){
				this.star.x = x;
	 			this.star.y = y;
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

module.exports = Player;