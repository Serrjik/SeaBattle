/*
	Класс примешивает визуальную часть к классу, который логически описывает
	выстрел. Хранит <div> соответствующий выстрелу.
	Эта часть описания выстрела НЕ требуется на бекенде.
*/
class ShotView extends Shot {
	// <div> соответствующий выстрелу.
	div =  null

	constructor (x, y, variant = 'miss') {
		super(x, y, variant)

		// Создать <div> соответствующий выстрелу.
		const div = document.createElement('div')
		div.classList.add('shot')

		// <div> соответствующий выстрелу.
		this.div = div
		// Вариант выстрела по умолчанию.
		this.setVariant(variant, true)
	}

	/*
		Метод устанавливает состояние выстрела согласно переданного варианта.
		Принимает флаг force - нужно ли принудительно изменить состояние?
		Если удалось изменить состояние выстрела, возвращает true, если НЕ
		удалось - false.
	*/
	setVariant (variant, force = false) {
		/*
			Если принудительно изменять состояние выстрела не нужно
			и переданный вариант точно такой же как уже выставленный:
		*/
		if (!force && this.variant === variant) {
			// Ничего не делать.
			return false
		}

		// Если переданный вариант отличается от уже выставленного:
		// Запомнить новый вариант выстрела.
		this.variant = variant

		/*
			Удалить все возможные классы и тексты отображения варианта выстрела
			из <div>'а выстрела.
		*/
		this.div.classList.remove('shot-missed', 'shot-wounded', 'shot-killed')
		this.div.textContent = ''

		/*
			Добавить класс отображения варианта выстрела
			согласно переданного варианта.
		*/
		if (this.variant === 'miss') {
			this.div.classList.add('shot-missed')
			this.div.textContent = '•'
		}
		else if (this.variant === 'wounded') {
			this.div.classList.add('shot-wounded')
		}
		else if (this.variant === 'killed') {
			this.div.classList.add('shot-wounded', 'shot-killed')
		}

		return true
	}
}