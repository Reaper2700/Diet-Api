import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { randomUUID } from 'crypto'
import { z } from 'zod'

export async function userRegister(app: FastifyInstance) {
  app.get('/users', async () => {
    const users = await knex('users').select('*')

    return { users }
  })

  app.post('/users', async (request, reply) => {
    const createUsers = z.object({
      name: z.string(),
    })

    const { name } = createUsers.parse(request.body)

    await knex('users').insert({
      id: randomUUID(),
      name,
    })
    return reply.status(201).send()
  })
}
