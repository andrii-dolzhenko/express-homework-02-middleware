import { Router } from 'express'
import { getRoot } from '../controllers/root.mjs'
import usersRouter from './users.mjs'
import articlesRouter from './articles.mjs'

const router = Router()

router.get('/', getRoot)
router.use('/users', usersRouter)
router.use('/articles', articlesRouter)

export default router
