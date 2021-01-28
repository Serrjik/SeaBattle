/*
	Стартовые данные кораблей, включая положение в доке
	(стартовые координаты на этапе подготовки к расстановке кораблей).
*/
const shipDatas = [
	{ size: 4, direction: "row", startX: 10, startY: 345 },
	{ size: 3, direction: "row", startX: 10, startY: 390 },
	{ size: 3, direction: "row", startX: 120, startY: 390 },
	{ size: 2, direction: "row", startX: 10, startY: 435 },
	{ size: 2, direction: "row", startX: 88, startY: 435 },
	{ size: 2, direction: "row", startX: 167, startY: 435 },
	{ size: 1, direction: "row", startX: 10, startY: 480 },
	{ size: 1, direction: "row", startX: 55, startY: 480 },
	{ size: 1, direction: "row", startX: 100, startY: 480 },
	{ size: 1, direction: "row", startX: 145, startY: 480 },
]

/*
	Класс соответствует состоянию подготовки, когда можно расставлять корабли,
	выбирать, сражаться против бота или реального игрока.
*/
class PreparationScene extends Scene {
	// Перетаскиваемый корабль.
	draggedShip = null
	/*
		Стартовое в начале перетаскивания смещение мыши
		относительно верхнего левого угла корабля.
	*/
	draggedOffsetX = 0
	draggedOffsetY = 0

	// Функции, которые удаляют обработчики событий.
	removeEventListeners = []

	// Метод инициализирует сцену.
	init () {
		// Сразу дать возможность игроку расставить корабли на поле вручную.
		this.manually()
	}

	// Метод запускает сцену.
	start () {
		// Поля с кораблями игрока и оппонента игрока.
		const { player, opponent } = this.app

		// Полностью очистить поле оппонента.
		opponent.clear()
		// Очистить поле игрока от выстрелов.
		player.removeAllShots()
		// Опустить флаги "Убитый" со всех кораблей игрока.
		player.ships.forEach(ship => ship.killed = false)

		// Удалить все функции, которые удаляют обработчики событий.
		this.removeEventListeners = []

		// Скрыть все блоки с кнопками.
		document
			.querySelectorAll('.app-actions')
			.forEach(element => element.classList.add('hidden'))

		// Показать блок подготовки к игре.
		document
			.querySelector('[data-scene="preparation"]')
			.classList.remove('hidden')

		// Кнопки начала игры против компьютера.
		const simpleButton = document.querySelector('[data-computer="simple"]')
		const middleButton = document.querySelector('[data-computer="middle"]')
		const hardButton = document.querySelector('[data-computer="hard"]')
		// Кнопка начала игры против случайного игрока.
		const randomButton = document.querySelector('[data-type="random"]')
		// Кнопка "Вызвать на бой".
		const challengeButton = document.querySelector('[data-type="challenge"]')
		// Кнопка "Принять вызов".
		const takeChallengeButton =
			document.querySelector('[data-type="takeChallenge"]')

		// Кнопка "Расставить корабли случайно".
		const randomizeButton =
			document.querySelector('[data-action="randomize"]')

		// Кнопка "Расставить корабли вручную".
		const manuallyButton =
			document.querySelector('[data-action="manually"]')

		// Повесить обработчик клика по кнопке "Расставить корабли случайно".
		this.removeEventListeners.push(
			addListener(randomizeButton, 'click', () => this.randomize())
		)

		// Повесить обработчик клика по кнопке "Расставить корабли вручную".
		this.removeEventListeners.push(
			addListener(manuallyButton, 'click', () => this.manually())
		)

		/*
			Повесить обработчики клика на кнопки начала игры против компьютера,
			против случайного игрока, "Вызвать на бой" и "Принять вызов" и
			добавить соответствующие им функции, которые эти обработчики
			удаляют, в массив функций, которые удаляют обработчики событий.
		*/
		this.removeEventListeners.push(
			addListener(simpleButton, 'click', () =>
				this.startComputer('simple'))
		)

		this.removeEventListeners.push(
			addListener(middleButton, 'click', () =>
				this.startComputer('middle'))
		)

		this.removeEventListeners.push(
			addListener(hardButton, 'click', () =>
				this.startComputer('hard'))
		)

		this.removeEventListeners.push(
			addListener(randomButton, 'click', () =>
				// Запустить сцену игры против случайного игрока.
				this.app.start('online', 'random')
			)
		)

		this.removeEventListeners.push(
			addListener(challengeButton, 'click', () =>
				// Запустить сцену игры против приглашённого игрока.
				this.app.start('online', 'challenge')
			)
		)

		this.removeEventListeners.push(
			addListener(takeChallengeButton, 'click', () => {
				// Ключ партии.
				const key = prompt('Ключ партии')
				// Если ключ партии ввели:
				if (key !== null && key.trim()) {
					/*
						Запустить сцену игры против приглашённого игрока,
						передав в неё ключ партии.
					*/
					this.app.start('online', 'takeChallenge', key)
				}
			})
		)
	}

	// Метод останавливает сцену.
	stop () {
		// Пройти по всем функциям, которые удаляют обработчики событий.
		for (const removeEventListener of this.removeEventListeners) {
			// Вызвать выбранную функцию удаления обработчика события.
			removeEventListener()
		}

		// Удалить все функции, которые удаляют обработчики событий.
		this.removeEventListeners = []
	}

	// Метод обновляет сцену.
	update () {
		// Мышь и игрок (поле с кораблями).
		const { mouse, player } = this.app

		// Если перетаскиваемого корабля нет, но была прожата и НЕ отжата ЛКМ:
		if (!this.draggedShip && mouse.left && !mouse.pLeft) {
			/*
				Значит, потенциально хотим начать тянуть корабль.
				Нужно определить, находится ли мышь над каким-нибудь из
				кораблей игрока.
			*/
			// Корабль игрока, над которым находится мышь.
			const ship = player.ships.find(ship => ship.isUnder(mouse))

			// Если такой корабль есть:
			if (ship) {
				// Координаты корабля.
				const shipRect = ship.div.getBoundingClientRect()

				// Положить этот корабль в перетаскиваемый.
				this.draggedShip = ship
				/*
					Установить стартовое в начале перетаскивания смещение мыши
					относительно верхнего левого угла корабля.
				*/
				this.draggedOffsetX = mouse.x - shipRect.left
				this.draggedOffsetY = mouse.y - shipRect.top

				/*
					Убрать значения координат корабля,
					чтобы заблокировались кнопки начала игры.
				*/
				ship.x = null
				ship.y = null
			}
		}

		// Если всё ещё прожата ЛКМ и есть перетаскиваемый корабль:
		if (mouse.left && this.draggedShip) {
			// Перетаскивание.
			// Координаты всего игрового поля игрока.
			const { left, top } = player.root.getBoundingClientRect()
			/*
				Координаты мыши с учётом смещения мыши относительно координат
				перетаскиваемого корабля.
			*/
			const x = mouse.x - left - this.draggedOffsetX
			const y = mouse.y - top - this.draggedOffsetY

			/*
				Установить координаты перетаскиваемого корабля равными
				координатам мыши с учётом смещения мыши относительно координат
				перетаскиваемого корабля.
			*/
			this.draggedShip.div.style.left = `${x}px`
			this.draggedShip.div.style.top = `${y}px`
		}

		// Если ЛКМ уже НЕ прожата и есть перетаскиваемый корабль:
		if (!mouse.left && this.draggedShip) {
			// Бросание.
			// Корабль, который хотим положить (перетаскиваемый).
			const ship = this.draggedShip
			// Перетаскиваемого корабля теперь нет (бросили).
			this.draggedShip = null

			// Координаты левого верхнего угла корабля, который бросили.
			const { left, top } = ship.div.getBoundingClientRect()
			// Ширина и высота ячейки корабля.
			const { width, height } =
				player.cells[0][0].getBoundingClientRect()

			// Точка посреди левой или верхней ячейки корабля, который бросили.
			const point = {
				x: left + width / 2,
				y: top + height / 2,
			}

			/*
				Ячейка игрового поля, которая находится под точкой посреди
				левой или верхней ячейки корабля, который бросили.
			*/
			const cell = player.cells
				.flat()
				.find(cell => isUnderPoint(point, cell))

			// Если такая ячейка игрового поля есть:
			if (cell) {
				// Координаты ячейки, над которой бросили корабль:
				const x = parseInt(cell.dataset.x)
				const y = parseInt(cell.dataset.y)

				// Убрать этот корабль с поля с кораблями игрока.
				player.removeShip(ship)
				// Добавить этот корабль на поле с кораблями игрока.
				player.addShip(ship, x, y)
			}

			// Если такой ячейки игрового поля нет (бросили НЕ над полем):
			else {
				// Убрать этот корабль с поля с кораблями игрока.
				player.removeShip(ship)
				// Добавить этот корабль на поле с кораблями игрока.
				player.addShip(ship)
			}
		}

		// Если есть перетаскиваемый корабль и прокрутка колёсика мыши:
		if (this.draggedShip && mouse.delta) {
			// Вращение.
			// Изменить ориентацию корабля.
			this.draggedShip.toggleDirection()
		}

		// Если поле игрока готово к бою (игрок завершил расстановку кораблей):
		if (player.complete) {
			// Разблокировать кнопки начала игры против компьютера.
			document.querySelector('[data-computer="simple"]').disabled = false
			document.querySelector('[data-computer="middle"]').disabled = false
			document.querySelector('[data-computer="hard"]').disabled = false
			// Разблокировать кнопку начала игры против случайного игрока.
			document.querySelector('[data-type="random"]').disabled = false
			// Разблокировать кнопку "Вызвать на бой".
			document.querySelector('[data-type="challenge"]').disabled = false
			// Разблокировать кнопку "Принять вызов".
			document.querySelector('[data-type="takeChallenge"]')
				.disabled = false
		}

		/*
			Если поле игрока НЕ готово к бою
			(игрок ещё НЕ завершил расстановку кораблей):
		*/
		else {
			// Заблокировать кнопки начала игры против компьютера.
			document.querySelector('[data-computer="simple"]').disabled = true
			document.querySelector('[data-computer="middle"]').disabled = true
			document.querySelector('[data-computer="hard"]').disabled = true
			// Заблокировать кнопку начала игры против случайного игрока.
			document.querySelector('[data-type="random"]').disabled = true
			// Заблокировать кнопку "Вызвать на бой".
			document.querySelector('[data-type="challenge"]').disabled = true
			// Заблокировать кнопку "Принять вызов".
			document.querySelector('[data-type="takeChallenge"]')
				.disabled = true
		}
	}

	// Метод расставляет корабли на поле игрока случайно.
	randomize () {
		// Игрок (поле с кораблями).
		const { player } = this.app

		// Расставить корабли на поле игрока случайно.
		player.randomize(ShipView)

		// Пройти по всем кораблям.
		for (let i = 0; i < 10; i++) {
			// Выбранный корабль.
			const ship = player.ships[i]

			// Задать выбранному кораблю положение в доке.
			ship.startX = shipDatas[i].startX
			ship.startY = shipDatas[i].startY
		}
	}

	// Метод позволяет расставить корабли на поле игрока вручную.
	manually () {
		// Игрок (поле с кораблями).
		const { player } = this.app

		// Удалить все корабли с поля игрока.
		player.removeAllShips()

		// Пройти по всем стартовым данным кораблей.
		for (const { size, direction, startX, startY } of shipDatas) {
			// Создать новый корабль с выбранными параметрами.
			const ship = new ShipView(size, direction, startX, startY)
			// Добавить новый корабль на поле игрока.
			player.addShip(ship)
		}
	}

	// Метод начинает игру против компьютера с переданным уровнем сложности.
	startComputer (level) {
		// Матрица игрового поля игрока.
		const matrix = this.app.player.matrix
		// Клетки игрового поля игрока без кораблей.
		const withoutShipItems = matrix.flat().filter(item => !item.ship)
		/*
			Часть клеток игрового поля игрока без кораблей,
			которые сделаем известными оппоненту.
		*/
		let untouchables = []

		// Если уровень оппонента "Слабый":
		if (level === 'simple') {}

		// Если уровень оппонента "Средний":
		else if (level === 'middle') {
			/*
				Сделаем известными оппоненту 20 клеток игрового поля игрока
				без кораблей.
			*/
			untouchables = getRandomSeveral(withoutShipItems, 20)
		}

		// Если уровень оппонента "Сильный":
		else if (level === 'hard') {
			/*
				Сделаем известными оппоненту 40 клеток игрового поля игрока
				без кораблей.
			*/
			untouchables = getRandomSeveral(withoutShipItems, 40)
		}

		this.app.start('computer', untouchables)
	}
}