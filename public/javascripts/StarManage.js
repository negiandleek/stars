let $ = require("./main.js");

class StarManage {
	constructor() {
		this.piece = 360 / $.directions.length;
	}
	detecte_angle() {
		let y_sign = $.get_sign(this.vy);
		let x_sign = $.get_sign(this.vx);
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

		i = $.directions.indexOf(str_direction);
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

module.exports = StarManage;