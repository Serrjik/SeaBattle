// Зависимости.
const session = require('express-session')
const express = require('express')
// const cookieParser = require('cookie-parser')
// Встроенная библиотека для работы с файлами.
const fs = require('fs')
// Встроенная библиотека для работы с путями.
const path = require('path')

const PartyManager = require('./src/PartyManager')
// Менеджер партий.
const pm = new PartyManager()

// Создание приложения ExpressJS.
const app = express()
/*
	Зависимость http уже есть внутри Node.js. Если запрос НЕ socket,
	http передаёт его в app, если socket-запрос, http передаёт его io.
	http прослушивает приложение app.
*/
const http = require('http').Server(app);

/*
	Регистрация Socket приложения. Integrating Socket.IO
	Сервер socket.io (постоянное общение бэка и фронта).
	Порт для общения с сокетом поднимется отдельным внутренним портом.
	Socket-сервер создаётся на базе http-сервера,
	который уже прослушивает события приложения app.
	io-соединение прослушивает http-сервер.
	io-соединение примешивает свой static:
	отдачу файла "./socket.io/socket.io.js".
*/
const io = require('socket.io')(http)
/*
	Порт для отдачи данных. Там где порт 80 недоступен (локальный сервер,
	работающий под управлением linux-системы) можно использовать порт 3000.
*/
const port = 80

// Настройка сессий.
/*
	Команда session генерирует новый middleware обработчик
	с переданными параметрами.
*/
const sessionMiddleware = session({
	secret: 's3Cur3',
	name: 'sessionId',
	resave: false,
	saveUninitialized: true,
	cookie: {
		sameSite: true,
		// secure: true,
	},
})

app.set('trust proxy', 1) // trust first proxy
// Здесь учим express.js работать с пользовательскими сессиями.
app.use(sessionMiddleware)

// app.use((req, res, next) => {
// 	console.log('req: ', req.sessionID)
// 	next()
// })

/*
	Middleware - стиль написания кода, который заключается в описании реакций
	на различные действия со стороны node.js, пользователя и т.д.
*/

/*
	Если сайту придёт запрос по протоколу get
	и адрес будет соответствовать '/', выполнится код callback-функции.
*/
// app.get('/', (req, res) => {
//   res.send('Hello, Serjik!')
// })

/*
	Настройка статики.
	use говорит о том, что переданная функция-обработчик будет выполняться
	при любом запросе к сайту.
	express.static() создаёт обработчик - сервер, который возвращает
	статические файлы, те файлы, что лежат в папке front.

*/
app.use(express.static('./../front/'))

// Отдать статический файл index.html, если запрашиваемого файла не существует.
app.use('*', (req, res) => {
	res.type('html')
	res.send(fs.readFileSync(path.join(__dirname, './../front/index.html')))
})

// Поднятие сервера. listen запускает сервер на переданном порту port.
http.listen(port, () => {
	console.log(`Example app listening at http://localhost:${port}`)
})

io.use((socket, next) => {
	sessionMiddleware(socket.request, {}, next)
})

/*
	Прослушивание socket соединений. io - сервер socket-соединений.
	connection - событие присоединения нового socket-соединения.
	socket - присоединённый пользователь.
*/
io.on('connection', socket => {
	// console.log(socket.request.sessionID)

	// Добавить нового игрока в список всех игроков.
	pm.connection(socket)
	// pm.addPlayer(socket)

	// Отправить сообщение одному пользователю.
	// socket.emit()

	// Отправить сообщение всем пользователям.
	// io.sockets.emit('hi', 'everyone')

	/*
		Отправить сообщение всем пользователям. io - псевдоним для io.sockets.
		Здесь отправим количество подключенных пользователей.
	*/
	io.emit('playerCount', io.engine.clientsCount)

	// Повесить на соединение обработчик события отключения соединения.
	socket.on('disconnect', () => {
		// Удалить игрока из списка всех игроков.
		pm.disconnect(socket)
		// pm.removePlayer(socket)

		// Отправить всем пользователям новое количество активных пользователей.
		io.emit('playerCount', io.engine.clientsCount)
	})

	/*
		Повесить на соединение обработчик события начала поиска случайного
		противника для игры.
	*/
	// socket.on('findRandomOpponent', () => {
	// 	/*
	// 		Сгенерировать событие смены статуса состояния игры
	// 		на "Поиск случайного соперника".
	// 	*/
	// 	socket.emit('statusChange', 'randomFinding')

	// 	// Добавить соединение в коллекцию ожидающих случайных игроков.
	// 	pm.playRandom(socket)
	// })
})