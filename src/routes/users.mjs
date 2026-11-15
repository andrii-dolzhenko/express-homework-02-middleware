import { Router } from 'express'
import { listUsers, createUser, getUser, updateUser, deleteUser } from '../controllers/users.mjs'

const router = Router()

router.get('/', listUsers)
router.post('/', createUser)
router.get('/:userId', getUser)
router.put('/:userId', updateUser)
router.delete('/:userId', deleteUser)

export default router
