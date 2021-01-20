// Файл хранит вспомогательные функции.

const alphabet = '0123456789qwertyuiopasdfghklzxcvbnmQWERTYUIOPASDFGHKLZXCVBNM'

// Функция возвращает случайную строку переданного размера.
module.exports.getRandomString = function getRandomString (size = 10) {
	// Случайная строка.
	let string = ''

	while (string.length < size) {
		string += alphabet[Math.floor(Math.random() * alphabet.length)]
	}

	return string
}