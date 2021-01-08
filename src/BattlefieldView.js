/*
	Класс примешивает визуальную часть к классу,
	который логически описывает корабли.
	Конструктор принимает флаг - отображать ли корабли на игровом поле?
	Эта часть описания корабля НЕ требуется на бекенде.
*/
class BattlefieldView extends Battlefield {
	root = null
	// Игровое поле - 10 x 10 ячеек.
	table = null
	// <div> - элемент, хранилище для всех div'ов кораблей, которые есть (док).
	dock = null
	// <div> - элемент, в котором будут храниться все div'ы выстрелов.
	polygon = null
	// Флаг - отображать ли корабли на игровом поле?
	showShips = true

	/*
		Матрица с <td>-элементами таблицы игрового поля
		для быстрого доступа к ячейкам игрового поля.
	*/
	cells = []

	constructor (showShips = true) {
		super()

		const root = document.createElement('div')
		root.classList.add('battlefield')

		// Игровое поле - 10 x 10 ячеек.
		const table = document.createElement('table')
		table.classList.add('battlefield-table')

		// <div> - элемент, хранилище для всех div'ов кораблей, которые есть.
		const dock = document.createElement('div')
		dock.classList.add('battlefield-dock')

		// <div> - элемент, в котором будут храниться все div'ы выстрелов.
		const polygon = document.createElement('div')
		polygon.classList.add('battlefield-polygon')

		Object.assign(this, { root, table, dock, polygon, showShips })
		root.append(table, dock, polygon)

		// Наполнение игрового поля ячейками.
		for (let y = 0; y < 10; y++) {
			const row = []
			const tr = document.createElement('tr')
			tr.classList.add('battlefield-row')
			tr.dataset.y = y

			for (let x = 0; x < 10; x++) {
				const td = document.createElement('td')
				td.classList.add('battlefield-item')
				Object.assign(td.dataset, { x, y })

				tr.append(td)
				row.push(td)
			}

			// Добавить ячейки игрового поля в DOM.
			table.append(tr)
			// Добавить ячейки игрового поля в матрицу.
			this.cells.push(row)
		}

		// Добавление подписей игровым полям.
		// Пройти по первому ряду ячеек.
		for (let x = 0; x < 10; x++) {
			// Выбранная ячейка.
			const cell = this.cells[0][x]
			// Маркер для выбранной ячейки.
			const marker = document.createElement('div')

			marker.classList.add('marker', 'marker-column')
			// Содержимое маркера выбранной ячейки.
			marker.textContent = 'АБВГДЕЖЗИК'[x]

			// Добавить маркер выбранной ячейке.
			cell.append(marker)
		}

		// Пройти по первому столбцу ячеек.
		for (let y = 0; y < 10; y++) {
			// Выбранная ячейка.
			const cell = this.cells[y][0]
			// Маркер для выбранной ячейки.
			const marker = document.createElement('div')

			marker.classList.add('marker', 'marker-row')
			// Содержимое маркера выбранной ячейки.
			marker.textContent = y + 1

			// Добавить маркер выбранной ячейке.
			cell.append(marker)
		}
	}

	/*
		Метод добавляет переданный корабль на поле на уровне отрисовки.
		Принимает координаты корабля.
		Возвращает true, если добавил, false - если НЕ добавил.
	*/
	addShip (ship, x, y) {
		// Добавить переданный корабль на поле на логическом уровне.
		/*
			Если НЕ удалось добавить переданный корабль на поле
			на логическом уровне:
		*/
		if (!super.addShip(ship, x, y)) {
			return false
		}

		// Если нужно отображать корабли на игровом поле:
		if (this.showShips) {
			// Добавить переданный корабль в док.
			this.dock.append(ship.div)

			// Если корабль уже размещен на игровом поле:
			if (ship.placed) {
				// Ячейка, над которой сейчас находится корабль.
				const cell = this.cells[y][x]
				// Размеры ячейки, над которой сейчас находится корабль.
				const cellRect = cell.getBoundingClientRect()
				// Размеры игрового поля.
				const rootRect = this.root.getBoundingClientRect()

				/*
					Разместить корабль в ту ячейку, над которой он сейчас
					находится, поставив левый верхний угол корабля
					в левый верхний угол ячейки, над которой он находится.
				*/
				ship.div.style.left = `${cellRect.left - rootRect.left}px`
				ship.div.style.top = `${cellRect.top - rootRect.top}px`
			}

			// Если корабль ещё НЕ размещен на игровом поле:
			else {
				// Расположить корабль горизонтально.
				ship.setDirection('row')
				// Поставить корабль в док в позицию со стартовыми координатами.
				ship.div.style.left = `${ship.startX}px`
				ship.div.style.top = `${ship.startY}px`
			}
		}

		return true
	}

	/*
		Метод убирает переданный корабль с поля на уровне отрисовки.
		Возвращает true, если удалил, false - если НЕ удалил.
	*/
	removeShip (ship) {
		// Если корабль не удалён с поля на логическом уровне:
		if (!super.removeShip(ship)) {
			// Ничего не делать.
			return false
		}

		// Если корабль находится в доке на уровне отрисовки:
		if (Array.prototype.includes.call(this.dock.children, ship.div)) {
			// Удалить корабль из дока.
			ship.div.remove()
		}

		return true
	}

	// Метод определяет, находится ли переданная точка над игровым полем.
	isUnder (point) {
		return isUnderPoint(point, this.root)
	}

	/*
		Метод добавляет переданный выстрел на отображаемое поле. Возвращает
		true, если удалось добавить выстрел, false - если НЕ удалось.
	*/
	addShot (shot) {
		// Если метод родительского класса не добавил логический выстрел:
		if (!super.addShot(shot)) {
			// Не удалось добавить выстрел на отображаемое поле.
			return false
		}

		/*
			Добавить <div> выстрела в графическую часть приложения
			(в контейнер для выстрелов).
		*/
		this.polygon.append(shot.div)

		// Ячейка, в которую выстрелили.
		const cell = this.cells[shot.y][shot.x]
		// Размеры ячейки, в которую выстрелили.
		const cellRect = cell.getBoundingClientRect()
		// Размеры контейнера, в котором располагаются элементы (игровое поле).
		const rootRect = this.root.getBoundingClientRect()
		// Местоположение выстрела на отображаемом поле.
		shot.div.style.left = `${cellRect.left - rootRect.left}px`
		shot.div.style.top = `${cellRect.top - rootRect.top}px`

		return true
	}

	/*
		Метод удаляет визуальную часть переданного выстрела. Возвращает true,
		если удалось удалить выстрел, false - если НЕ удалось.
	*/
	removeShot (shot) {
		// Если НЕ удастся удалить переданный выстрел логически:
		if (!super.removeShot(shot)) {
			// Не удалось удалить выстрел.
			return false
		}

		// Если удалось удалить переданный выстрел логически:
		// Если выстрел находится в контейнере для выстрелов:
		if (Array.prototype.includes.call(this.polygon.children, shot.div)) {
			// Удалить выстрел визуально.
			shot.div.remove()
		}

		return true
	}
}