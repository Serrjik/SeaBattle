/*
	Класс логически описывает выстрел. Хранит координаты и состояние выстрела
	(промах, ранил, убил).
	Эта часть описания выстрела потребуется на бекенде.
*/
module.exports = class Shot {
	// Координаты выстрела.
	x = null
	y = null
	/*
		Состояние выстрела (промах (miss) - точка, ранение (wounded) - крестик,
		убийство (killed) - крестик с бордером).
	*/
	variant = null

	constructor (x, y, variant = 'miss') {
		Object.assign(this, { x, y, variant })
	}

	// Метод устанавливает состояние выстрела согласно переданного варианта.
	setVariant (variant) {
		this.variant = variant
	}
}