// Класс соответствует состоянию игры против случайного игрока.
class OnlineScene extends Scene {
	// Блок со статусом и кнопками управления игрой.
	actionsBar = null
	// Статус игры.
	status = ''
	// Флаг - ход ли игрока сейчас?
	ownTurn = false

	// Функции, которые удаляют обработчики событий.
	removeEventListeners = []

	// Метод инициализирует сцену. Вызывается один раз.
	init () {
		// Блок со статусом и кнопками управления игрой.
		const actionsBar = document.querySelector('[data-scene="online"]')
		this.actionsBar = actionsBar

		// Соединение с сервером (пользователь), игрок, оппонент игрока.
		const { socket, player, opponent } = this.app

		// Повесить на соединение обработчик события изменения статуса игры.
		socket.on('statusChange', status => {
			console.log('statusChange', status)
			// Обновить статус в экземпляре класса OnlineScene на новый.
			this.status = status
			// Отобразить статус игры.
			this.statusUpdate()
		})

		/*
			Повесить на соединение обработчик события обновления хода.
			Обработчик принимает флаг - ход ли игрока сейчас?
		*/
		socket.on('turnUpdate', ownTurn => {
			// Флаг - ход ли игрока сейчас?
			this.ownTurn = ownTurn
			// Отобразить статус игры.
			this.statusUpdate()
		})

		/*
			Повесить на соединение обработчик события "Отправка сообщения".
			Обработчик принимает текст сообщения.
		*/
		socket.on('message', message => {
			// Новый контейнер для нового сообщения.
			const div = document.createElement('div')
			div.classList.add('app-message')
			div.textContent = message

			// Вставить контейнер с новым сообщением в блок сообщений чата.
			const chat = document.querySelector('.app-messages')
			chat.insertBefore(div, chat.firstElementChild)
		})

		/*
			Повесить на соединение обработчик события добавления выстрела.
			Обработчик принимает выстрел.
		*/
		socket.on('addShot', ({ x, y, variant }) => {
			// Новый выстрел с переданными параметрами.
			const shot = new ShotView(x, y, variant)

			// Если сейчас ход текущего игрока:
			if (this.ownTurn) {
				// Добавить новый выстрел на поле игрока-противника.
				this.app.opponent.addShot(shot)
			}

			// Если сейчас ход игрока-противника:
			else {
				// Добавить новый выстрел на поле текущего игрока.
				this.app.player.addShot(shot)
			}
		})

		/*
			Повесить на соединение обработчик события установки выстрелов.
			Обработчик принимает массивы всех выстрелов игрока и его оппонента.
		*/
		socket.on('setShots', (ownShots, opponentShots) => {
			// Удалить все выстрелы на поле игрока.
			player.removeAllShots()

			// Пройти по всем выстрелам игрока.
			for (const { x, y, variant } of ownShots) {
				// Новый выстрел с выбранными параметрами.
				const shot = new ShotView(x, y, variant)
				// Добавить выбранный выстрел на поле игрока.
				player.addShot(shot)
			}

			// Удалить все выстрелы на поле оппонента.
			opponent.removeAllShots()

			// Пройти по всем выстрелам оппонента.
			for (const { x, y, variant } of opponentShots) {
				// Новый выстрел с выбранными параметрами.
				const shot = new ShotView(x, y, variant)
				// Добавить выбранный выстрел на поле оппонента.
				opponent.addShot(shot)
			}
		})

		/*
			Повесить на соединение обработчик события начала вызова игрока на
			бой. Обработчик принимает ключ игрока.
		*/
		socket.on('challengeOpponent', key => {
			// Add an entry to the browser's session history stack.
			history.pushState(null, null, `/${key}`)
			alert(
				'Первый кто пройдёт по этой ссылке будет играть с вами:\n' +
				`${location.href}`
			)
		})

		// Повесить на соединение обработчик события нахождения непонятно где.
		socket.on('inTheMiddleOfNowhere', () => {
			console.log('inTheMiddleOfNowhere')

			// Запустить сцену подготовки к игре.
			this.app.start('preparation')
		})

		// Отобразить статус игры.
		this.statusUpdate()
	}

	/*
		Метод запускает сцену. Принимает вариант,
		против какого соперника будет игра, и ключ партии игры.
	*/
	start (variant, key = '') {
		// console.log('variant:', variant, 'key: ', key);
		// Соединение с сервером (пользователь), игрок.
		const { socket, player } = this.app

		/*
			Сгенерировать событие расстановки кораблей
			и отправить массив кораблей игрока.
		*/
		socket.emit('shipSet', player.ships.map(ship => ({
			size: ship.size,
			direction: ship.direction,
			x: ship.x,
			y: ship.y,
		})))

		// Если игра должна быть против случайного соперника:
		if (variant === 'random') {
			// Сгенерировать событие начала поиска случайного противника для игры.
			socket.emit('findRandomOpponent')
		}

		// Если нужно вызвать определённого игрока на бой:
		else if (variant === 'challenge') {
			// Сгенерировать событие начала вызова игрока на бой.
			socket.emit('challengeOpponent')
		}

		// Если нужно принять вызов другого игрока на бой:
		else if (variant === 'takeChallenge') {
			/*
				Сгенерировать событие принятия вызова другого игрока на бой
				и передать в обработчик ключ партии игры.
			*/
			socket.emit('takeChallengeOpponent', key)
		}

		// Блок с чатом.
		const chat = document.querySelector('.app-chat')
		// Отобразить блок с чатом.
		chat.classList.remove('hidden')

		// Очистить блок с сообщениями.
		document.querySelector('.app-messages').textContent = ''

		// Скрыть все блоки с кнопками.
		document
			.querySelectorAll('.app-actions')
			.forEach(element => element.classList.add('hidden'))

		// Блок кнопок онлайн-игры.
		const sceneActionsBar = document.querySelector('[data-scene="online"]')
		// Показать блок кнопок онлайн-игры.
		sceneActionsBar.classList.remove('hidden')

		// Кнопка "Сдаться".
		const gaveupButton = sceneActionsBar
			.querySelector('[data-action="gaveup"]')
		// Кнопка "Играть ещё раз".
		const againButton = sceneActionsBar
			.querySelector('[data-action="again"]')

		// Показать кнопку "Сдаться".
		gaveupButton.classList.remove('hidden')
		// Скрыть кнопку "Играть ещё раз".
		againButton.classList.add('hidden')

		// Удалить все функции, которые удаляют обработчики событий.
		this.removeEventListeners = []

		// Инпут чата.
		const input = chat.querySelector('.app-chatinput')
		// Повесить обработчик прожатия клавиши в инпуте чата.
		this.removeEventListeners.push(
			addListener(input, 'keydown', e => {
				// Если нажали на "Ввод" и в инпуте чата есть текст:
				if (e.key === 'Enter' && input.value.trim()) {
					// Текст набранного сообщения, первый 120 символов.
					const message = input.value.trim().slice(0, 120)
					// Очистить инпут чата.
					input.value = ''
					// Соединение генерирует событие "Отправка сообщения".
					socket.emit('message', message)
				}

				// Если нажали на "Ввод" и в инпуте чата НЕТ текста:
				else if (e.key === 'Enter' && !input.value.trim()) {
					// Очистить инпут чата.
					input.value = ''
				}
			})
		)

		// Повесить обработчик клика по кнопке "Сдаться".
		this.removeEventListeners.push(
			addListener(gaveupButton, 'click', () => {
				// Соединение генерирует событие "Сдаться".
				socket.emit('gaveup')
				// Запустить сцену подготовки к игре.
				this.app.start('preparation')
			})
		)

		// Повесить обработчик клика по кнопке "Играть ещё раз".
		this.removeEventListeners.push(
			addListener(againButton, 'click', () => {
				// Запустить сцену подготовки к игре.
				this.app.start('preparation')
			})
		)

		// Отобразить статус игры.
		this.statusUpdate()
	}

	// Метод останавливает сцену.
	stop () {
		// Add an entry to the browser's session history stack.
		history.pushState(null, null, window.origin)

		// Пройти по всем функциям, которые удаляют обработчики событий.
		for (const removeEventListener of this.removeEventListeners) {
			// Вызвать выбранную функцию удаления обработчика события.
			removeEventListener()
		}

		// Удалить все функции, которые удаляют обработчики событий.
		this.removeEventListeners = []

		// Скрыть блок с чатом.
		document.querySelector('.app-chat').classList.add('hidden')
		// Очистить блок с сообщениями.
		document.querySelector('.app-messages').textContent = ''
	}

	// Метод отображает статус партии игры.
	statusUpdate () {
		console.log(this.status)
		// Блок для статуса партии игры.
		const statusDiv = this.actionsBar.querySelector('.battlefield-status')

		// Если статус партии игры отсутствует:
		if (!this.status) {
			// Не отображать статус.
			statusDiv.textContent = ''
		}
		// Если статус партии игры "Поиск случайного соперника":
		else if (this.status === 'randomFinding') {
			// Отобразить статус партии игры.
			statusDiv.textContent = 'Поиск случайного соперника'
		}
		// Если статус партии игры "Игра происходит":
		else if (this.status === 'play') {
			/*
				Отобразить статус партии игры в зависимости от того,
				ход ли игрока сейчас.
			*/
			statusDiv.textContent = this.ownTurn ? 'Ваш ход' : 'Ход соперника'
		}
		// Если статус партии игры "Победил":
		else if (this.status === 'winner') {
			// Отобразить статус партии игры.
			statusDiv.textContent = 'Вы победили'
		}
		// Если статус партии игры "Проиграл":
		else if (this.status === 'loser') {
			// Отобразить статус партии игры.
			statusDiv.textContent = 'Вы проиграли'
		}
		// Если статус партии игры "Ожидание оппонента после вызова на бой":
		else if (this.status === 'waiting') {
			// Отобразить статус ожидания партии игры.
			statusDiv.textContent = 'Ожидаем соперника'
		}
	}

	// Метод обновляет сцену.
	update () {
		/*
			Мышь игрока, поле с кораблями оппонента игрока,
			поле с кораблями игрока, соединение игрока.
		*/
		const { mouse, opponent, player, socket } = this.app

		// Все ячейки игрового поля оппонента.
		const cells = opponent.cells.flat()
		// Убрать выделение со всех ячеек игрового поля оппонента.
		cells.forEach(x => x.classList.remove('battlefield-item--active'))

		// Если игрок проиграл или победил:
		if (['loser', 'winner'].includes(this.status)) {
			// Блок подготовки к игре.
			const sceneActionsBar = document
				.querySelector('[data-scene="online"]')

			// Кнопка "Сдаться".
			const gaveupButton = sceneActionsBar
				.querySelector('[data-action="gaveup"]')
			// Кнопка "Играть ещё раз".
			const againButton = sceneActionsBar
				.querySelector('[data-action="again"]')

			// Скрыть кнопку "Сдаться".
			gaveupButton.classList.add('hidden')
			// Показать кнопку "Играть ещё раз".
			againButton.classList.remove('hidden')
		}

		// Если поле с кораблями игрока проиграло:
		if (player.loser) {
			// Конец партии игры (далее не обновляем сцену).
			return
		}

		// Если мышь находится над игровым полем противника:
		if (opponent.isUnder(mouse)) {
			// Ячейка игрового поля противника, над которой находится мышь.
			const cell = opponent.cells
				.flat()
				.find(cell => isUnderPoint(mouse, cell))

			/*
				Если есть ячейка игрового поля противника,
				над которой находится мышь:
			*/
			if (cell) {
				// Выделить ячейку под мышкой.
				cell.classList.add('battlefield-item--active')

				// Если игрок кликнул по ячейке:
				if (mouse.left && !mouse.pLeft) {
					/*
						Координаты ячейки игрового поля противника,
						по которой кликнули.
					*/
					const x = parseInt(cell.dataset.x)
					const y = parseInt(cell.dataset.y)

					// Соединение генерирует событие добавления выстрела.
					socket.emit('addShot', x, y)
				}
			}
		}
	}
}