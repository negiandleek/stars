let StarManage = require("./StarManage");

class Enemy extends StarManage{
	constructor(data){
		super();

		this.running = true;
		this.alive = true;

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
	update(data) {
		this.star.x = data.position.x;
		this.star.y = data.position.y;
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

module.exports = Enemy;