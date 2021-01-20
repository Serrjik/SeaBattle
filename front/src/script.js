// Экземпляр приложения.
const app = new Application({
	preparation: PreparationScene,
	computer: ComputerScene,
	online: OnlineScene,
})

// Запустить сцену 'preparation'.
app.start('preparation')
// console.log('app: ', app);

// Сгенерировать нажатие на кнопку "Расставить корабли случайно".
// document.querySelector('[data-action="randomize"]').click()

// Сгенерировать нажатие на кнопку "Играть против случайного игрока".
// document.querySelector('[data-type="random"]').disabled = false
// document.querySelector('[data-type="random"]').click()

// // Сгенерировать нажатие на кнопку "Играть против сильного".
// document.querySelector('[data-computer="hard"]').disabled = false
// document.querySelector('[data-computer="hard"]').click()

// for (let y = 0; y < 10; y++) {
// 	for (let x = 0; x < 10; x++) {
// 		const shot = new ShotView(x, y)
// 		app.opponent.addShot(shot)
// 	}
// }