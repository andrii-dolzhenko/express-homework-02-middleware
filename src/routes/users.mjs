import { Router } from 'express'
import { listUsers, createUser, getUser, updateUser, deleteUser } from '../controllers/users.mjs'
import { validateUserData } from '../middlewares/validation.mjs'

const router = Router()

router.get('/', listUsers)
router.post('/', validateUserData, createUser)
router.get('/:userId', getUser)
router.put('/:userId', validateUserData, updateUser)
router.delete('/:userId', deleteUser)

export default router
