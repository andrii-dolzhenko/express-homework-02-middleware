// Базовий RESTful API сервер — модульна структура для HW-02
// Мідлвари будуть додані окремими кроками без зміни роботи CRUD

import express from 'express'
import router from './routes/index.mjs'

const PORT = 3000
const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Маршрути
app.use(router)

// Обробка помилок для неіснуючих маршрутів
app.use((req, res) => {
  res.status(404).send('Not Found')
})

// Глобальна обробка помилок
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`)
  res.status(500).send('Internal Server Error')
})

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

export { server, app }
