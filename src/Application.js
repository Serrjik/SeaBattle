/*
	Класс отвечает за всё приложение. Отвечает за расстановку кораблей,
	вызов другого человека на бой, начало боя с другим игроком.
	Конструктор класса принимает объект с ключами - именами сцен,
	значениями - классами сцен.
*/
class Application {
	// Объект следит за мышью над документом.
	mouse = null

	// Поле с кораблями игрока.
	player = null
	// Поле с кораблями оппонента игрока.
	opponent = null

	// Все сцены приложения.
	scenes = {}
	// Активная сцена.
	activeScene = null

	constructor (scenes) {
		// Объект следит за мышью над документом.
		const mouse = new Mouse(document.body)
		// Игрок (поле с кораблями). Отображать корабли.
		const player = new BattlefieldView(true)
		// Оппонент игрока (поле с кораблями). Не отображать корабли.
		const opponent = new BattlefieldView(false)

		Object.assign(this, { mouse, player, opponent })

		// Добавить в точку монтирования игрока поле с кораблями игрока.
		document.querySelector('[data-side="player"]').append(player.root)
		/*
			Добавить в точку монтирования оппонента игрока
			поле с кораблями оппонента игрока.
		*/
		document.querySelector('[data-side="opponent"]').append(opponent.root)

		// Пройти по всем переданным сценам.
		for (const [sceneName, SceneClass] of Object.entries(scenes)) {
			// Добавить выбранную сцену в сцены приложения.
			this.scenes[sceneName] = new SceneClass(sceneName, this)
		}

		// Пройти по всем созданным сценам.
		for (const scene of Object.values(this.scenes)) {
			// Инициализировать выбранную сцену.
			scene.init()
		}

		// Зарегистрировать вызов общего tick'а для всего приложения.
		requestAnimationFrame(() => this.tick())
	}

	// Метод - общий tick всего приложения.
	tick () {
		// Зарегистрировать вызов общего tick'а для всего приложения.
		requestAnimationFrame(() => this.tick())

		// Если есть активная сцена:
		if (this.activeScene) {
			// Обновить активную сцену.
			this.activeScene.update()
		}

		// Вызвать служебный tick объекта слежения за мышью.
		this.mouse.tick()
	}

	/*
		Метод запускает сцену по переданному имени.
		Принимает массив клеток игрового поля игрока без кораблей.
		Если сцену удалось запустить, возвращает true, иначе - false.
	*/
	start (sceneName, ...args) {
		// Если есть активная сцена и её имя совпадает с именем переданной:
		if (this.activeScene && this.activeScene.name === sceneName) {
			// Ничего не делать.
			return false
		}

		// Если сцены с переданным именем нет среди всех сцен:
		if (!this.scenes.hasOwnProperty(sceneName)) {
			// Ничего не делать.
			return false
		}

		// Если есть текущая активная сцена:
		if (this.activeScene) {
			// Остановить её.
			this.activeScene.stop()
		}

		// Сцена, которую нужно запустить.
		const scene = this.scenes[sceneName]
		// Запомнить активной выбранную сцену.
		this.activeScene = scene
		/* 
			Запустить выбранную сцену, 
			передав ей массив клеток игрового поля игрока без кораблей. 
		*/
		scene.start(...args)

		return true
	}
}