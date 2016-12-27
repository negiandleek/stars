let $ = require("./main.js");

class Bullet{
	constructor(x, y, angle){
		this.running = true;
		this.alive = true;

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
	update(data) {
		this.body.x = data.position.x;
		this.body.y = data.position.y;
	}
	get_direction(angle) {
		let sin =  Math.sin(angle * (Math.PI / 180));
		sin = sin * 10 | 0 ? get_sign(sin): 0;

		let cos = Math.cos(angle * (Math.PI / 180));
		cos = cos * 10 | 0 ? get_sign(cos): 0;

		this.vx = sin * this.speed;
		this.vy = -1 * cos * this.speed;
	}
	get_pixi(){
		return this.body;
	}
	move() {
		if(this.is_ready){
			// 斜めの時はベクトルを正規化する
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
 		if(!this.alive && !this.running){
 			$.stage.removeChild(this.body);
 			return;
 		}

 		if(tmpx < 0 || 
 		subx > $.field.x ||
 		tmpy < 0 || 
 		suby > $.field.y){
 			$.stage.removeChild(this.body);
 		}
	}
}

module.exports = Bullet;