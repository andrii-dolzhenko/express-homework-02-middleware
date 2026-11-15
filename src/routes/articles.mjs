import { Router } from 'express'
import { listArticles, createArticle, getArticle, updateArticle, deleteArticle } from '../controllers/articles.mjs'
import { validateArticleData } from '../middlewares/validation.mjs'

const router = Router()

router.get('/', listArticles)
router.post('/', validateArticleData, createArticle)
router.get('/:articleId', getArticle)
router.put('/:articleId', validateArticleData, updateArticle)
router.delete('/:articleId', deleteArticle)

export default router
