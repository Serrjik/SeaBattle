const Observer = require("./Observer")
const Shot = require("./Shot")

// Класс соответствует партии игры.
module.exports = class Party extends Observer {
	// Первый игрок - участник партии.
	player1 = null
	// Второй игрок - участник партии.
	player2 = null

	// Ссылка на того игрока, который считается первым.
	turnPlayer = null
	// Флаг - должна ли партия игры продолжаться?
	play = true

	// Геттер возвращает игрока, чья очередь хода НЕ сейчас.
	get nextPlayer () {
		return this.turnPlayer === this.player1 ? this.player2 : this.player1
	}

	constructor (player1, player2) {
		super()

		Object.assign(this, { player1, player2 })
		this.turnPlayer = player1

		// Пройти по обоим игрокам партии.
		for (const player of [player1, player2]) {
			// Поместить выбранного игрока в текущую партию игры.
			player.party = this

			/*
				Выбранный игрок генерирует событие изменения статуса партии на
				"Игра происходит".
			*/
			player.emit('statusChange', 'play')
		}

		// Обновить ход.
		this.turnUpdate()
	}

	// Метод обновляет ход.
	turnUpdate () {
		/*
			Сгенерировать событие обновления хода партии игры и отправить
			сообщение обоим участвующим игрокам.
			Вторым параметром передаётся флаг - ход ли игрока сейчас?
		*/
		this.player1.emit('turnUpdate', this.player1 === this.turnPlayer)
		this.player2.emit('turnUpdate', this.player2 === this.turnPlayer)
	}

	// Метод сообщает о наступлении конца партии.
	stop () {
		// Если партия игры уже остановлена:
		if (!this.play) {
			// Ничего НЕ сообщать и НЕ делать.
		}

		// Партия игры НЕ должна дальше продолжаться.
		this.play = false
		// Сообщить об изменении (остановке партии игры).
		this.dispatch()

		// Отвязать обоих игроков от текущей партии.
		this.player1.party = null
		this.player2.party = null

		// Отвязать текущую партию от обоих игроков.
		this.player1 = null
		this.player2 = null
	}

	// Метод-обработчик события "Сдаться". Принимает игрока, который сдался.
	gaveup (player) {
		// Первый и второй игроки партии игры.
		const { player1, player2 } = this

		/*
			Оба игрока генерируют событие смены статуса состояния игры
			и тот, кто сдался передаёт статус- "Проиграл", а другой -
			"Победил".
		*/
		player1.emit(
			'statusChange',
			player1 === player ? 'loser' : 'winner'
		)

		player2.emit(
			'statusChange',
			player2 === player ? 'loser' : 'winner'
		)

		// Сообщить о наступлении конца партии игры.
		this.stop()
	}

	/*
		Обработчик события добавления выстрела.
		Принимает игрока и координаты выстрела.
	*/
	addShot (player, x, y) {
		/*
			Если сейчас ход НЕ текущего игрока
			ИЛИ партия игры НЕ должна дальше продолжаться:
		*/
		if (this.turnPlayer !== player || !this.play) {
			// НЕ добавлять выстрел.
			return
		}

		// Первый и второй игроки партии игры.
		const { player1, player2 } = this

		// Новый выстрел с переданными координатами.
		const shot = new Shot(x, y)
		// Добавить новый выстрел на поле противника.
		const result = this.nextPlayer.battlefield.addShot(shot)

		// Если удалось добавить выстрел на поле противника:
		if (result) {
			// Массив всех выстрелов 1-го игрока.
			const player1Shots = player1.battlefield.shots.map(shot => ({
				x: shot.x,
				y: shot.y,
				variant: shot.variant,
			}))

			// Массив всех выстрелов 2-го игрока.
			const player2Shots = player2.battlefield.shots.map(shot => ({
				x: shot.x,
				y: shot.y,
				variant: shot.variant,
			}))

			/*
				Оба игрока генерируют событие установки выстрелов.
				Передают в обработчик первым параметром все свои
				выстрелы, вторым параметром - все выстрелы оппонента.
			*/
			player1.emit('setShots', player1Shots, player2Shots)
			player2.emit('setShots', player2Shots, player1Shots)

			// Если игрок промахнулся выстрелом:
			if (shot.variant === 'miss') {
				// Ход переходит другому игроку.
				this.turnPlayer = this.nextPlayer
				// Обновить ход.
				this.turnUpdate()
			}
		}

		// Если проиграло поле любого из игроков в партии:
		if (player1.battlefield.loser || player2.battlefield.loser) {
			// Сообщить о наступлении конца партии игры.
			this.stop()

			// Если проиграл первый игрок:
			if (player1.battlefield.loser) {
				/*
					Оба игрока генерируют событие смены статуса
					состояния игры и каждый передаёт свой статус
					"Проиграл" или "Победил".
				*/
				player1.emit(
					'statusChange',
					player1.battlefield.loser ? 'loser' : 'winner'
				)

				player2.emit(
					'statusChange',
					player2.battlefield.loser ? 'loser' : 'winner'
				)
			}
		}
	}

	// Метод отправляет в чат переданное сообщение.
	sendMessage (message) {
		// Первый и второй игроки партии игры.
		const { player1, player2 } = this

		/*
			Оба игрока генерируют событие "Отправка сообщения".
			Передают в обработчик переданное сообщение.
		*/
		player1.emit('message', message)
		player2.emit('message', message)
	}

	// Метод переподключает переданного игрока.
	reconnection (player) {
		/*
			Сгенерировать событие переподключения игрока и отправить
			в обработчик расположение всех кораблей переданного игрока.
		*/
		player.emit('reconnection', player.battlefield.ships.map(ship => ({
			size: ship.size,
			direction: ship.direction,
			x: ship.x,
			y: ship.y,
		})))

		// Массив всех выстрелов 1-го игрока.
		const player1Shots = this.player1.battlefield.shots.map(shot => ({
			x: shot.x,
			y: shot.y,
			variant: shot.variant,
		}))
		// console.log('player1Shots: ', player1Shots);

		// Массив всех выстрелов 2-го игрока.
		const player2Shots = this.player2.battlefield.shots.map(shot => ({
			x: shot.x,
			y: shot.y,
			variant: shot.variant,
		}))
		// console.log('player2Shots: ', player2Shots);

		/*
			Переданный игрок генерирует событие установки выстрелов.
			Передаёт в обработчик первым параметром все свои
			выстрелы, вторым параметром - все выстрелы оппонента.
		*/
		// Если переданный игрок - первый:
		if (player === this.player1) {
			player.emit('setShots', player1Shots, player2Shots)
		}
		// Если переданный игрок - второй:
		else {
			player.emit('setShots', player2Shots, player1Shots)
		}

		/*
			Переданный игрок генерирует событие изменения статуса партии на
			"Игра происходит".
		*/
		player.emit('statusChange', 'play')
		/*
			Переданный игрок генерирует событие обновления хода
			и передаёт в обработчик флаг - ход ли игрока сейчас?
		*/
		player.emit('turnUpdate', this.turnPlayer === player)

		// Если сейчас конец игры:
		if (!this.play) {
			/*
				Игрок генерирует событие смены статуса состояния игры
				и передаёт в обработчик свой статус- "Проиграл" или "Победил".
			*/
			player.emit(
				'statusChange',
				player.battlefield.loser ? 'loser' : 'winner'
			)
		}
	}
}