/*
	Класс примешивает визуальную часть к классу, который логически описывает
	корабль. Хранит <div> соответствующий кораблю.
	Конструктор принимает стартовые данные корабля, включая положение в доке
	(стартовые координаты на этапе подготовки к расстановке кораблей).
	Эта часть описания корабля НЕ требуется на бекенде.
*/
class ShipView extends Ship {
	// <div> соответствующий кораблю.
	div = null

	// Стартовые координаты на этапе подготовки к расстановке кораблей.
	startX = null
	startY = null

	constructor (size, direction, startX, startY) {
		super(size, direction)

		// <div> соответствующий кораблю.
		const div = document.createElement('div')
		div.classList.add('ship')

		// Установить свойства <div>'а, соответствующего кораблю.
		Object.assign(this, { div, startX, startY })

		// Установить размеры и первоначальную ориентацию корабля.
		this.setDirection(direction, true)
	}

	/*
		Метод устанавливает размеры корабля и изменяет его ориентацию на
		переданную. Если удалось изменить - возвращает true, иначе - false.
		Принимает флаг force - нужно ли принудительно установить размеры и
		изменить ориентацию корабля?
	*/
	setDirection (newDirection, force = false) {
		/*
			Если ориентацию НЕ нужно изменять принудительно и
			новая ориентация совпадает с текущей:
		*/
		if (!force && this.direction === newDirection) {
			// Ничего не делать.
			return false
		}

		// Удалить прежний класс корабля.
		this.div.classList.remove(`ship-${this.direction}-${this.size}`)
		// Изменить ориентацию на новую.
		this.direction = newDirection
		// Добавить кораблю новый класс.
		this.div.classList.add(`ship-${this.direction}-${this.size}`)

		return true
	}

	// Метод изменяет ориентацию корабля.
	toggleDirection () {
		// Новая ориентация корабля.
		const newDirection = this.direction === 'row' ? 'column' : 'row'
		// Установить кораблю новую ориентацию.
		this.setDirection(newDirection)
	}

	// Метод определяет, находится ли переданная точка над кораблём.
	isUnder (point) {
		return isUnderPoint(point, this.div)
	}
}