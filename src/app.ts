import fastify from 'fastify'
import { userRegister } from './routes/userRoute'
import cookie from '@fastify/cookie'
import { mealsRoute } from './routes/mealsRoute'

export const app = fastify()

app.register(userRegister)
app.register(mealsRoute)
app.register(cookie)
