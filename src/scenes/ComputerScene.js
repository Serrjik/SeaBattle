// Класс соответствует состоянию игры против компьютера.
class ComputerScene extends Scene {
	// Случайная часть клеток игрового поля игрока без кораблей.
	untouchables = []
	// Флаг - сейчас ход игрока?
	playerTurn = true
	// Контейнер для статуса игры.
	status = null
	// Функции, которые удаляют обработчики событий.
	removeEventListeners = []

	// Метод инициализирует сцену.
	init () {
		// Контейнер для статуса игры.
		this.status = document.querySelector('.battlefield-status')
	}

	/*
		Метод запускает сцену. Принимает массив случайной части клеток
		игрового поля игрока без кораблей.
	*/
	start (untouchables) {
		// Поле с кораблями оппонента игрока.
		const { opponent } = this.app

		// Скрыть все блоки с кнопками.
		document
			.querySelectorAll('.app-actions')
			.forEach(element => element.classList.add('hidden'))

		// Показать блок с кнопками при игре с компьютером.
		document
			.querySelector('[data-scene="computer"]')
			.classList.remove('hidden')

		// Очистить игровое поле от кораблей и выстрелов.
		opponent.clear()
		// Расставить в случайном порядке корабли на поле оппонента.
		opponent.randomize(ShipView)

		// Случайная часть клеток игрового поля игрока без кораблей.
		this.untouchables = untouchables

		// Удалить все функции, которые удаляют обработчики событий.
		this.removeEventListeners = []

		// Кнопка "Сдаться".
		const gaveupButton = document.querySelector('[data-action="gaveup"]')
		// Кнопка "Играть ещё раз".
		const againButton = document.querySelector('[data-action="again"]')
		// Показать кнопку "Сдаться".
		gaveupButton.classList.remove('hidden')
		// Скрыть кнопку "Играть ещё раз".
		againButton.classList.add('hidden')

		// Повесить обработчик клика по кнопке "Сдаться".
		this.removeEventListeners.push(addEventListener(gaveupButton, 'click', () => {
			// Запустить сцену подготовки к игре.
			this.app.start('preparation')
		}))

		// Повесить обработчик клика по кнопке "Играть ещё раз".
		this.removeEventListeners.push(addEventListener(againButton, 'click', () => {
			// Запустить сцену подготовки к игре.
			this.app.start('preparation')
		}))
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
		// Мышь, противник (игровое поле противника), игрок (поле игрока).
		const { mouse, opponent, player } = this.app

		// Флаг - настал ли конец игры (кто-то проиграл)?
		const isEnd = opponent.loser || player.loser

		// Ячейки игрового поля оппонента.
		const cells = opponent.cells.flat()
		// Убрать выделение со всех ячеек игрового поля оппонента.
		cells.forEach(cell =>
			cell.classList.remove('battlefield-item--active'))

		// Если конец игры настал:
		if (isEnd) {
			// Если компьютер проиграл:
			if (opponent.loser) {
				// Вывод сообщения о победе игрока.
				this.status.textContent = 'Вы выиграли!'
			}

			// Если игрок проиграл:
			else {
				// Вывод сообщения о поражении игрока.
				this.status.textContent = 'Вы проиграли (('
			}

			// Скрыть кнопку "Сдаться".
			document.querySelector('[data-action="gaveup"]')
				.classList.add('hidden')
			// Показать кнопку "Играть ещё раз".
			document.querySelector('[data-action="again"]')
				.classList.remove('hidden')

			return
		}

		// Если мышь находится над игровым полем оппонента:
		if (isUnderPoint(mouse, opponent.table)) {
			// Ячейка игрового поля оппонента, над которой находится мышь.
			const cell = cells.find(cell => isUnderPoint(mouse, cell))

			// Если под мышью есть ячейка игрового поля оппонента:
			if (cell) {
				// Выделить ячейку под мышкой.
				cell.classList.add('battlefield-item--active')

				// Если сейчас ход игрока и произошёл клик:
				if (this.playerTurn && mouse.left && !mouse.pLeft) {
					// Координаты ячейки под мышкой.
					const x = parseInt(cell.dataset.x)
					const y = parseInt(cell.dataset.y)

					/*
						Создать новый выстрел с состоянием "промах"
						и координатами выделенной ячейки.
					*/
					const shot = new ShotView(x, y)
					// Произвести выстрел по ячейке под мышкой.
					const result = opponent.addShot(shot)

					/*
						Если выстрел игрока произошёл успешно
						(по точке, по которой ещё не стреляли):
					*/
					if (result) {
						/*
							Игрок сохраняет свою очередь на ход, если попал,
							или передаёт ход оппоненту, если промахнулся.
						*/
						this.playerTurn =
							shot.variant === 'miss' ? false : true
					}
				}
			}
		}

		// Если сейчас ход НЕ и, а бота:
		if (!this.playerTurn) {
			// Координаты случайной точки, в которую хочет стрелять бот.
			const x = getRandomBetween(0, 9)
			const y = getRandomBetween(0, 9)

			/*
				Флаг - является ли ячейка со случайными координатами одной из
				тех ячеек, о которых бот знает, что в них не нужно стрелять.
			*/
			let inUntouchable = false

			// Пройти по всем "неприкасаемым" ячейкам (без кораблей).
			for (const item of this.untouchables) {
				// Если бот хочет стрелять по "неприкасаемой" ячейке:
				if (item.x === x && item.y === y) {
					/*
						Поднять флаг - бот пытается стрелять
						по "неприкасаемой" ячейке.
					*/
					inUntouchable = true
					/*
						В эту ячейку бот стрелять НЕ будет (при следующем
						обновлении сцены ход сохраняется за ботом).
					*/
					break
				}
			}

			// Если бот НЕ пытается стрелять по "неприкасаемой" ячейке:
			if (!inUntouchable) {
				/*
					Создать новый выстрел с состоянием "промах"
					и координатами случайной ячейки.
				*/
				const shot = new ShotView(x, y)
				// Произвести выстрел по этой случайной ячейке.
				const result = player.addShot(shot)

				/*
					Если выстрел бота произошёл успешно
					(по точке, по которой ещё не стреляли):
				*/
				if (result) {
					/*
						Игроку передаётся очередь на ход, если бот промахнулся,
						или сохраняется за ботом, если бот попал.
					*/
					this.playerTurn =
						shot.variant === 'miss' ? true : false
				}
			}
		}

		// Отображение статусов игры.
		// Если сейчас ход игрока:
		if (this.playerTurn) {
			// Отобразить статус игры.
			this.status.textContent = 'Ваш ход'
		}

		// Если сейчас ход бота:
		else {
			// Отобразить статус игры.
			this.status.textContent = 'Ход компьютера'
		}
	}
}