// Файл хранит вспомогательные функции.

// Функция возвращает случайное число от min до max.
function getRandomBetween (min, max) {
	return min + Math.floor(Math.random() * (max - min + 1))
}

// Функция возвращает случайный аргумент из всех переданных аргументов.
function getRandomFrom (...args) {
	const index = Math.floor(Math.random() * args.length)
	return args[index]
}

/*
	Функция определяет, находится ли переданная точка над переданным элементом.
	Возвращает true, если точка point находится над элементом element.
	Иначе возвращает false.
*/
function isUnderPoint (point, element) {
	// Координаты и размеры переданного элемента.
	const { left, top, width, height } = element.getBoundingClientRect()
	// Координаты переданной точки.
	const { x, y } = point

	return left <= x && x <= left + width && top <= y && y <= top + height
}

/*
	Функция вешает обработчик события на переданный элемент,
	передаёт аргументы в этот обработчик и возвращает функцию,
	которая этот обработчик события снимает.
*/
function addListener (element, ...args) {
	element.addEventListener(...args)
	return () => element.removeEventListener(...args)
}

// Функция возвращает size штук случайных элементов переданного массива array.
function getRandomSeveral (array = [], size = 1) {
	// Копия переданного массива.
	array = array.slice()

	// Если функция должна вернуть больше элементов, чем есть в массиве:
	if (size > array.length) {
		// Функция вернёт столько элементов, сколько есть в массиве.
		size = array.length
	}

	// Массив случайных элементов, который возвращает функция.
	const result = []
	// Массив индексов переданного массива.
	// const indexes = Array(array.length).fill().map((_, i) => i)

	// Пока размер массива случайных элементов меньше, чем должен быть:
	while (result.length < size) {
		// Случайный индекс из длины копии переданного массива.
		const index = Math.floor(Math.random() * array.length)
		// Элемент копии переданного массива с этим случайным индексом.
		const item = array.splice(index, 1)[0]
		// Положить выбранный элемент в массив, который возвращает функция.
		result.push(item)
	}

	return result
}