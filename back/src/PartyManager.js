const Player = require('./Player')
const Party = require('./Party')
const Ship = require('./Ship')
const { getRandomString } = require('./additional')

// Время, в течение которого у пользователя есть возможность переподключиться.
const RECONNECTION_TIMER = 5000

/*
	Класс - менеджер партий. Экземпляр класса содержит в себе все текущие
	партии, ожидающих игроков, игроков, кидающих вызов и т.д.
*/
module.exports = class PartyManager {
	// Все игроки (socket-соединения).
	players = []
	// Все партии игры.
	parties = []

	// Массив ожидающих случайных игроков.
	waitingRandom = []
	// Объект с игроками, ожидающими принятия вызова на бой.
	waitingChallenge = new Map()

	// Объект с игроками, у которых есть возможность переподключиться.
	reconnections = new Map()

	/*
		Метод добавляет нового игрока в список всех игроков ИЛИ переподключает
		существующего игрока. Принимает подключение пользователя.
	*/
	connection (socket) {
		// Идентификация пользователя.
		// sessionID соединения пользователя.
		const sessionId = socket.request.sessionID
		/*
			Игрок, у которого sessionID совпадает
			с текущим sessionID соединения пользователя.
		*/
		let player =
			this.players.find(player => player.sessionId === sessionId)

		/*
			Если игрок, у которого sessionID совпадает
			с текущим sessionID соединения пользователя, найден:
			Восстановить соединение!
		*/
		if (player) {
			// Сгенерировать событие двойного подключения игрока.
			player.socket.emit('doubleConnection')
			// Закрыть старое соединение игрока.
			player.socket.disconnect()
			// Переопределить соединение игрока на новое.
			player.socket = socket

			// Если игрок стоит в очереди на переподключение:
			if (this.reconnections.has(player)) {
				// Остановить таймер.
				clearTimeout(this.reconnections.get(player))
				/*
					Удалить игрока из объекта с игроками,
					у которых есть возможность переподключиться.
				*/
				this.reconnections.delete(player)

				/*
					Если игрок с переданным подключением в партии
					(проверяем для перестраховки):
				*/
				if (player.party) {
					// Переподключить игрока.
					player.party.reconnection(player)
				}
			}
		}
		/*
			Если игрок, у которого sessionID совпадает
			с текущим sessionID соединения пользователя, НЕ найден:
		*/
		else {
			/*
				Новый игрок с принятым подключением
				и текущим sessionId соединения пользователя.
			*/
			player = new Player(socket, sessionId)
			// Добавить нового игрока в список всех игроков.
			this.players.push(player)
		}

		/*
			Функция возвращает флаг - свободен ли игрок.
			Игрок свободен, если НЕ ждёт противника для случайной игры,
			НЕ ждёт вызванного игрока на бой, НЕ играет в партию игры.
		*/
		const isFree = () => {
			// Если игрок ещё НЕ участвует в случайной партии, но уже ищет:
			if (this.waitingRandom.includes(player)) {
				// Игрок занят.
				return false
			}

			// Игроки, ожидающие вызванного игрока на бой.
			const values = Array.from(this.waitingChallenge.values())

			// Если игрок НЕ ждёт вызванного игрока на бой:
			if (values.includes(player)) {
				// Игрок занят.
				return false
			}

			// Если игрок уже в партии:
			if (player.party) {
				// Игрок занят.
				return false
			}

			// Игрок свободен.
			return true
		}

		/*
			Повесить на соединение обработчик события расстановки кораблей.
			Обработчик принимает массив кораблей с клиента и расставляет их.
		*/
		socket.on('shipSet', ships => {
			// Если игрок НЕ свободен (уже в партии игры или ждёт игру):
			if (!isFree) {
				// Ничего не делать.
				return
			}

			// Полностью очистить поле игрока.
			player.battlefield.clear()
			// Пройти по всем переданным кораблям игрока.
			for (const { size, direction, x, y } of ships) {
				// Создать новый корабль, соответствующий выбранному.
				const ship = new Ship(size, direction)
				/*
					Добавить переданный корабль на поле игрока
					на логическом уровне.
				*/
				player.battlefield.addShip(ship, x, y)
			}
		})

		/*
			Повесить на соединение обработчик события начала поиска
			случайного противника для игры.
		*/
		socket.on('findRandomOpponent', () => {
			// Если игрок НЕ свободен (уже в партии игры или ждёт игру):
			if (!isFree) {
				// Ничего не делать.
				return
			}

			// Добавить игрока в массив ожидающих случайных игроков.
			this.waitingRandom.push(player)
			/*
				Сгенерировать у игрока событие изменения статуса игры на
				"Поиск случайного соперника".
			*/
			player.emit('statusChange', 'randomFinding')

			// Если 2 или более игроков ожидают партию игры:
			if (this.waitingRandom.length >= 2) {
				/*
					Вырезаем двух первых игроков из массива ожидающих случайных
					игроков.
				*/
				const [player1, player2] = this.waitingRandom.splice(0, 2)
				/*
					Новая партия игры c 2-мя первыми игроками из массива
					ожидающих случайных игроков.
				*/
				const party = new Party(player1, player2)
				// Добавить новую партию в массив всех партий.
				this.parties.push(party)

				/*
					Подписаться на партию. Функция unsubscribe отвязывает
					от события наступления конца партии игры.
				*/
				const unsubscribe = party.subscribe(() => {
					// Удалить партию из списка всех партий.
					this.removeParty(party)
					// Отвязаться от события наступления конца партии игры.
					unsubscribe()
				})
			}
		})

		/*
			Повесить на соединение обработчик события
			начала вызова игрока на бой.
		*/
		socket.on('challengeOpponent', () => {
			// Если игрок НЕ свободен (уже в партии игры или ждёт игру):
			if (!isFree) {
				// Ничего не делать.
				return
			}

			// Ключ партии для вызова на бой.
			let key = getRandomString(20)
			/*
				Сгенерировать событие начала вызова игрока на бой
				и передать в обработчик ключ партии.
			*/
			socket.emit('challengeOpponent', key)
			/*
				Сгенерировать событие начала ожидания оппонента
				после вызова на бой.
			*/
			socket.emit('statusChange', 'waiting')

			/*
				Добавить игрока в объект с игроками,
				ожидающими вызова на бой.
			*/
			this.waitingChallenge.set(key, player)
		})

		/*
			Повесить на соединение обработчик события принятия вызова другого
			игрока на бой. Обработчик принимает ключ партии.
		*/
		socket.on('takeChallengeOpponent', (key = '') => {
			// Если игрок НЕ свободен (уже в партии игры или ждёт игру):
			if (!isFree) {
				// Ничего не делать.
				return
			}

			/*
				Если в обработчик передали ключ партии И в объекте с игроками,
				ожидающими вызванного игрока на бой есть игрок с переданным
				ключом партии, значит, нашли второго игрока для партии:
			*/
			if (this.waitingChallenge.has(key)) {
				// Второй игрок для партии игры.
				const opponent = this.waitingChallenge.get(key)
				// Второй игрок исключается из ожидающих вызова на бой.
				this.waitingChallenge.delete(key)

				// Новая партия игры со вторым игроком и текущим игроком.
				const party = new Party(opponent, player)
				// Добавить новую партию в массив всех партий.
				this.parties.push(party)
			}

			else {
				console.log('ключ партии НЕ валидный!')
				/*
					TODO: Здесь нужно сделать так, чтобы человеку не пришлось
					нажимать кнопку "Сдаться", если он ввёл невалидный ключ
					партии.
				*/
			}
		})

		/*
			Повесить на соединение обработчик события "Сдаться".
			Передать в обработчик игрока, который сдался.
		*/
		socket.on('gaveup', () => {
			// Если текущий игрок участвует в партии:
			if (player.party) {
				// Игрок сдаётся.
				player.party.gaveup(player)
			}

			// Если игрок с переданным подключением ожидал партию:
			if (this.waitingRandom.includes(player)) {
				/*
					Удалить переданного игрока из массива ожидающих случайных
					игроков.
				*/
				const index = this.waitingRandom.indexOf(player)
				this.waitingRandom.splice(index, 1)
			}

			// Игроки, ожидающие принятия вызова на бой.
			const values = Array.from(this.waitingChallenge.values())
			// Если игрок с переданным подключением ожидал принятия вызова на бой:
			if (values.includes(player)) {
				const index = values.indexOf(player)
				// Ключи партий игроков, ожидающих принятия вызова на бой.
				const keys = Array.from(this.waitingChallenge.keys())
				// Ключ партии игрока с переданным подключением.
				const key = keys[index]
				/*
					Удалить игрока с переданным подключением из объекта
					с игроками, ожидающими принятия вызова на бой.
				*/
				this.waitingChallenge.delete(key)
			}
		})

		/*
			Повесить на соединение обработчик события добавления выстрела.
			Принимает игрока и координаты выстрела.
		*/
		socket.on('addShot', (x, y) => {
			// Если текущий игрок участвует в партии:
			if (player.party) {
				// Добавить выстрел на поле игрока.
				player.party.addShot(player, x, y)
			}
		})

		/*
			Повесить на соединение обработчик события "Отправка сообщения".
			Обработчик принимает текст сообщения.
		*/
		socket.on('message', message => {
			// Если текущий игрок участвует в партии игры:
			if (player.party) {
				// Отправить в чат переданное сообщение.
				player.party.sendMessage(message)
			}
		})
	}

	/*
		Метод удаляет игрока из списка всех игроков.
		Принимает подключение этого игрока.
	*/
	disconnect (socket) {
		// Игрок с переданным подключением.
		const player = this.players.find(player => player.socket === socket)

		// Если нет игрока с переданным подключением:
		if (!player) {
			// Ничего не делать (некого удалять).
			return
		}

		/*
			Если игрок с переданным подключением уже участвует в партии игры:
			Дать ему время на переподключение.
		*/
		if (player.party) {
			// Флаг - пытается ли игрок переподключиться?
			const flag = setTimeout(() => {
				/*
					Удалить игрока из объекта с игроками,
					у которых есть возможность переподключиться.
				*/
				this.reconnections.delete(player)

				// Если игрок с переданным подключением в партии:
				if (player.party) {
					// Игрок с переданным подключением автоматически сдаётся.
					player.party.gaveup(player)
				}

				// Удалить выбранного игрока.
				this.removePlayer(player)
			}, RECONNECTION_TIMER)

			/*
				Добавить игрока в объект с игроками,
				у которых есть возможность переподключиться.
			*/
			this.reconnections.set(player, flag)
		}

		// Если игрок с переданным подключением ожидал партию:
		if (this.waitingRandom.includes(player)) {
			/*
				Удалить переданного игрока из массива ожидающих случайных
				игроков.
			*/
			const index = this.waitingRandom.indexOf(player)
			this.waitingRandom.splice(index, 1)
		}

		// Игроки, ожидающие принятия вызова на бой.
		const values = Array.from(this.waitingChallenge.values())
		/*
			Если игрок с переданным подключением
			ожидал принятия вызова на бой:
		*/
		if (values.includes(player)) {
			const index = values.indexOf(player)
			// Ключи партий игроков, ожидающих принятия вызова на бой.
			const keys = Array.from(this.waitingChallenge.keys())
			// Ключ партии игрока с переданным подключением.
			const key = keys[index]
			/*
				Удалить игрока с переданным подключением из объекта
				с игроками, ожидающими принятия вызова на бой.
			*/
			this.waitingChallenge.delete(key)
		}
	}

	/*
		Метод добавляет переданного игрока в массив всех игроков.
		Возвращает true, если удалось добавить игрока, false - если НЕ удалось.
	*/
	addPlayer (player) {
		// Если переданный игрок уже есть в массиве всех игроков:
		if (this.players.includes(player)) {
			// Не добавляем этого игрока в массив всех игроков.
			return false
		}

		// Добавить переданного игрока в массив всех игроков.
		this.players.push(player)

		return true
	}

	/*
		Метод убирает переданного игрока. Возвращает true, если удалось удалить
		игрока, false - если НЕ удалось.
	*/
	removePlayer (player) {
		// Если переданного игрока нет в массиве всех игроков:
		if (!this.players.includes(player)) {
			// Не удаляем этого игрока из массива всех игроков.
			return false
		}

		// Удалить переданного игрока из массива всех игроков.
		const index = this.players.indexOf(player)
		this.players.splice(index, 1)

		// Если игрок уже находится в состоянии ожидания:
		if (this.waitingRandom.includes(player)) {
			/*
				Удалить переданного игрока из массива ожидающих случайных
				игроков.
			*/
			const index = this.waitingRandom.indexOf(player)
			this.waitingRandom.splice(index, 1)
		}

		return true
	}

	// Метод убирает всех игроков.
	removeAllPlayers () {
		// Копия массива всех игроков (socket-соединений).
		const players = this.players.slice()

		// Пройти по всем игрокам.
		for (const player of players) {
			// Удалить выбранного игрока.
			this.removePlayer(player)
		}

		// Возвратить количество удалённых игроков.
		return players.length
	}

	/*
		Метод добавляет переданную партию игры в массив всех партий.
		Возвращает true, если удалось добавить партию, false - если НЕ удалось.
	*/
	addParty (party) {
		// Если переданная партия уже есть в массиве всех партий:
		if (this.parties.includes(party)) {
			// Не добавляем эту партию в массив всех партий.
			return false
		}

		// Добавить переданную партию в массив всех партий.
		this.parties.push(party)

		return true
	}

	/*
		Метод удаляет переданную партию игры. Возвращает true, если удалось
		удалить партию, false - если НЕ удалось.
	*/
	removeParty (party) {
		// Если переданной партии нет в массиве всех партий:
		if (!this.parties.includes(party)) {
			// Не удаляем эту партию из массива всех партий.
			return false
		}

		// Удалить переданную партию из массива всех партий.
		const index = this.parties.indexOf(party)
		this.parties.splice(index, 1)

		return true
	}

	// Метод удаляет все партии игры.
	removeAllParties  () {
		// Копия массива всех партий игры.
		const parties = this.parties.slice()

		// Пройти по всем партиям игры.
		for (const party of parties) {
			// Удалить выбранную партию игры.
			this.removeParty(party)
		}

		// Возвратить количество удалённых партий.
		return parties.length
	}

	/*
		Метод добавляет переданного игрока в массив ожидающих случайных
		игроков. Возвращает true, если удалось добавить игрока,
		false - если НЕ удалось.
	*/
	playRandom (player) {
		// Если игрок уже находится в состоянии ожидания:
		if (this.waitingRandom.includes(player)) {
			// Не добавлять игрока.
			return false
		}

		/*
			Добавить переданного игрока в массив ожидающих случайных
			игроков.
		*/
		this.waitingRandom.push(player)

		// Если 2 или более игроков ожидают партию игры:
		if (this.waitingRandom.length >= 2) {
			/*
				Вырезаем двух первых игроков из массива ожидающих случайных
				игроков.
			*/
			const [player1, player2] = this.waitingRandom.splice(0, 2)
			/*
				Новая партия игры c 2-мя первыми игроками из массива
				ожидающих случайных игроков.
			*/
			const party = new Party(player1, player2)
			// Добавить новую партию в массив всех партий.
			this.addParty(party)
		}

		return true
	}
}