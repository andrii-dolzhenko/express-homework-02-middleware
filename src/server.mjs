// Базовий RESTful API сервер (заготівля для завдання)
// Додайте необхідні мідлвари згідно з ASSIGNMENT.md

import express from 'express'

// Константи
const PORT = 3000
const app = express()

// Імітація бази даних
const users = new Map()
const articles = new Map()

// Створення початкових тестових даних
users.set('test-user-1', { name: 'Тестовий користувач 1' })
users.set('test-user-2', { name: 'Тестовий користувач 2' })
articles.set('test-article-1', { title: 'Тестова стаття 1' })
articles.set('test-article-2', { title: 'Тестова стаття 2' })

// Middleware для обробки JSON
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// === МІДЛВАРИ ===
// TODO: Реалізуйте мідлвари тут згідно із завданням


// === МАРШРУТИ ===

// Маршрути для кореневого шляху
app.get('/', (req, res) => {
  res.status(200).send('Get root route')
})

// Маршрути для користувачів
app.get('/users', (req, res) => {
  const allUsers = Array.from(users.entries()).map(([id, user]) => ({ id, ...user }))
  res.status(200).json(allUsers)
})

app.post('/users', (req, res) => {
  // TODO: Додайте валідацію та логування через мідлвари
  const { name } = req.body
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).send('Bad Request')
  }

  const userId = Date.now().toString()
  users.set(userId, { name: name.trim() })

  res.status(201).json({ id: userId, name: name.trim() })
})

app.get('/users/:userId', (req, res) => {
  const user = users.get(req.params.userId)
  if (!user) {
    return res.status(404).send('Not Found')
  }
  res.status(200).json({ id: req.params.userId, ...user })
})

app.put('/users/:userId', (req, res) => {
  // TODO: Додайте мідлвари
  const user = users.get(req.params.userId)
  if (!user) {
    return res.status(404).send('Not Found')
  }

  const { name } = req.body
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).send('Bad Request')
  }

  users.set(req.params.userId, { name: name.trim() })
  res.status(200).json({ id: req.params.userId, name: name.trim() })
})

app.delete('/users/:userId', (req, res) => {
  // TODO: Додайте мідлвари
  if (!users.has(req.params.userId)) {
    return res.status(404).send('Not Found')
  }
  users.delete(req.params.userId)
  res.status(204).send()
})

// Маршрути для статей
app.get('/articles', (req, res) => {
  const allArticles = Array.from(articles.entries()).map(([id, article]) => ({ id, ...article }))
  res.status(200).json(allArticles)
})

app.post('/articles', (req, res) => {
  // TODO: Додайте мідлвари
  const { title } = req.body
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).send('Bad Request')
  }

  const articleId = Date.now().toString()
  articles.set(articleId, { title: title.trim() })

  res.status(201).json({ id: articleId, title: title.trim() })
})

app.get('/articles/:articleId', (req, res) => {
  const article = articles.get(req.params.articleId)
  if (!article) {
    return res.status(404).send('Not Found')
  }
  res.status(200).json({ id: req.params.articleId, ...article })
})

app.put('/articles/:articleId', (req, res) => {
  // TODO: Додайте мідлвари
  const article = articles.get(req.params.articleId)
  if (!article) {
    return res.status(404).send('Not Found')
  }

  const { title } = req.body
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).send('Bad Request')
  }

  articles.set(req.params.articleId, { title: title.trim() })
  res.status(200).json({ id: req.params.articleId, title: title.trim() })
})

app.delete('/articles/:articleId', (req, res) => {
  // TODO: Додайте мідлвари
  if (!articles.has(req.params.articleId)) {
    return res.status(404).send('Not Found')
  }
  articles.delete(req.params.articleId)
  res.status(204).send()
})

// Обробка помилок для неіснуючих маршрутів
app.use((req, res) => {
  res.status(404).send('Not Found')
})

// Глобальна обробка помилок
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`)
  res.status(500).send('Internal Server Error')
})

// Запуск сервера
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log('')
  console.log('🌟 Basic REST API Server (Homework Template)')
  console.log('Available routes:')
  console.log('  GET    / - Root route')
  console.log('  GET    /users - List all users')
  console.log('  POST   /users - Create user')
  console.log('  GET    /users/:userId - Get user by ID')
  console.log('  PUT    /users/:userId - Update user')
  console.log('  DELETE /users/:userId - Delete user')
  console.log('  GET    /articles - List all articles')
  console.log('  POST   /articles - Create article')
  console.log('  GET    /articles/:articleId - Get article by ID')
  console.log('  PUT    /articles/:articleId - Update article')
  console.log('  DELETE /articles/:articleId - Delete article')
  console.log('')
  console.log('TODO: Implement middlewares according to ASSIGNMENT.md')
})

// Експорт для тестів
export { server, app }
