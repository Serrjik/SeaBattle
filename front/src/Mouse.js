/*
	Класс отвечает за работу с мышью.
	Следит за координатами мыши, нажатием кнопок, колёсиком.
*/
class Mouse {
	// Элемент, над которым производится наблюдение.
	element = null

	// Флаг - находится ли мышь над элементом?
	under = false
	// Флаг - находилась ли мышь над элементом во время предыдущего тика?
	pUnder = false

	// Координаты мыши.
	x = null
	y = null

	// Координаты мыши в предыдущем тике работы приложения.
	pX = null
	pY = null

	// Флаг - прожата ли ЛКМ?
	left = false
	// Флаг - была ли прожата ЛКМ в предыдущий тик?
	pLeft = false

	// Прокрутка колёсика (вниз - отрицательная, вверх - положительная).
	delta = 0
	// Прокрутка колёсика в предыдущий тик.
	pDelta = 0

	constructor (element) {
		// Элемент, над которым производится наблюдение.
		this.element = element

		// Функция обновляет параметры мыши.
		const update = e => {
			// Обновить координаты мыши.
			this.x = e.clientX
			this.y = e.clientY
			// Установить прокрутку колёсика.
			this.delta = 0
			// Установить флаг нахождения мыши над элементом.
			this.under = true
		}

		// Повесить обработчик движения мыши над исследуемым элементом.
		element.addEventListener('mousemove', e => {
			// Перезаписать текущее состояние в предыдущее.
			this.tick()
			// Обновить параметры мыши.
			update(e)
		})

		// Повесить обработчик начала нахождения мыши над исследуемым элементом.
		element.addEventListener('mouseenter', e => {
			// Перезаписать текущее состояние в предыдущее.
			this.tick()
			// Обновить параметры мыши.
			update(e)
		})

		// Повесить обработчик начала ухода мыши с исследуемого элемента.
		element.addEventListener('mouseleave', e => {
			// Перезаписать текущее состояние в предыдущее.
			this.tick()
			// Обновить параметры мыши.
			update(e)
			// Снять флаг нахождения мыши над элементом.
			this.under = false
		})

		// Повесить обработчик прожатия кнопки мыши.
		element.addEventListener('mousedown', e => {
			// Перезаписать текущее состояние в предыдущее.
			this.tick()
			// Обновить параметры мыши.
			update(e)

			// Если прожата ЛКМ:
			if (e.button === 0) {
				// Установить флаг прожатия ЛКМ.
				this.left = true
			}
		})

		// Повесить обработчик отжатия кнопки мыши.
		element.addEventListener('mouseup', e => {
			// Перезаписать текущее состояние в предыдущее.
			this.tick()
			// Обновить параметры мыши.
			update(e)

			// Если отжата ЛКМ:
			if (e.button === 0) {
				// Снять флаг прожатия ЛКМ.
				this.left = false
			}
		})

		// Повесить обработчик прокрутки колёсика мыши.
		element.addEventListener('wheel', e => {
			// Перезаписать текущее состояние в предыдущее.
			this.tick()
			// Обновить параметры мыши.
			update(e)

			// Установить прокрутку колёсика.
			this.delta = e.deltaY > 0 ? 1 : -1
		})
	}

	tick () {
		// Перезаписать координаты мыши в предыдущем тике работы приложения.
		this.pX = this.x
		this.pY = this.y
		/*
			Перезаписать флаг нахождения мыши над элементом
			во время предыдущего тика.
		*/
		this.pUnder = this.under
		// Перезаписать флаг прожатия левой кнопки в предыдущем тике.
		this.pLeft = this.left
		// Перезаписать прокрутку колёсика в предыдущем тике.
		this.pDelta = this.delta
		// Обнулить прокрутку колёсика.
		this.delta = 0
	}
}