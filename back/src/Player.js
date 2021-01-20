const Battlefield = require('./Battlefield')

// Класс соответствует игроку.
module.exports = class Player {
	// Поле с кораблями игрока.
	battlefield = new Battlefield()
	// Соединение игрока.
	socket = null
	// Партия игры, в которой находится игрок.
	party = null
	// sessionID соединения игрока.
	sessionId = null

	// Геттер возвращает флаг - готов ли игрок к бою?
	get ready () {
		/*
			Если поле игрока готово к бою
			И игрок ещё НЕ играет
			И у игрока есть соединение, то игрок готов к бою.
			Иначе игрок НЕ готов к бою.
		*/
		return this.battlefield.complete && !this.party && this.socket
	}

	// Конструктор принимает соединение игрока и sessionID соединения игрока.
	constructor (socket, sessionId) {
		Object.assign(this, { socket, sessionId })
	}

	// Метод-псевдоним генерирует события соединения игрока.
	on (...args) {
		/*
			Если у игрока есть соединение
			И это соединение открыто И готово к передаче данных:
		*/
		if (this.socket && this.socket.connected) {
			// Генерировать событие соединения игрока с переданными аргументами.
			this.socket.on(...args)
		}
	}

	// Метод генерирует события игрока (псевдоним для событий соединения).
	emit (...args) {
		/*
			Если у игрока есть соединение
			И это соединение открыто И готово к передаче данных:
		*/
		if (this.socket && this.socket.connected) {
			// Генерировать событие соединения игрока с переданными аргументами.
			this.socket.emit(...args)
		}
	}
}