import { Router } from 'express'
import { listArticles, createArticle, getArticle, updateArticle, deleteArticle } from '../controllers/articles.mjs'

const router = Router()

router.get('/', listArticles)
router.post('/', createArticle)
router.get('/:articleId', getArticle)
router.put('/:articleId', updateArticle)
router.delete('/:articleId', deleteArticle)

export default router
