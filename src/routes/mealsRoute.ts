import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { checkIdExist } from '../midwares/checkIdExist'

export async function mealsRoute(app: FastifyInstance) {
  app.get(
    '/meals',
    {
      preHandler: [checkIdExist],
    },
    async (request, reply) => {
      console.log('Cookies recebidos:', request.cookies)
      const { userId } = request.cookies

      if (!userId) {
        return reply.status(400).send('id erro')
      }
      console.log('Cookies recebidos:', userId)
      const meals = await knex('meals').where('user_id', userId).select('*')

      return { meals }
    },
  )

  app.get(
    '/meals/:id',
    {
      preHandler: [checkIdExist],
    },
    async (request) => {
      const { id } = request.params as { id: string }
      const { userId } = request.cookies

      const mealsEspecificUser = await knex('meals')
        .where({ id, user_Id: userId })
        .select('*')

      return { mealsEspecificUser }
    },
  )

  app.get(
    '/metrics',
    {
      preHandler: [checkIdExist],
    },
    async (request, reply) => {
      const { userId } = request.cookies

      if (!userId) {
        return reply
          .status(400)
          .send({ error: 'Usuário não identificado nos cookies' })
      }

      const totalMeals = await knex('meals')
        .where({ user_id: userId })
        .select('*')

      const totalMealsHealthy = totalMeals.filter(
        (meal) => meal.is_healthy === 'yes',
      ).length
      const totalMealsUnhealthy = totalMeals.filter(
        (meal) => meal.is_healthy === 'no',
      ).length

      const { bestOnDietSequence } = totalMeals.reduce(
        (acc, meal) => {
          if (meal.is_healthy === 'yes') {
            acc.currentSequence += 1
          } else {
            acc.currentSequence = 0
          }

          if (acc.currentSequence > acc.bestOnDietSequence) {
            acc.bestOnDietSequence = acc.currentSequence
          }

          return acc
        },
        { bestOnDietSequence: 0, currentSequence: 0 },
      )

      return reply.send({
        totalMeals: totalMeals.length,
        totalMealsHealthy,
        totalMealsUnhealthy,
        bestOnDietSequence,
      })
    },
  )

  app.post(
    '/meals',
    {
      preHandler: [checkIdExist],
    },
    async (request, reply) => {
      const { userId } = request.cookies
      console.log('Cookies recebidos:', userId)
      if (!userId) {
        return reply.status(400).send({ error: 'Usuário não autenticado' })
      }

      console.log('Cookies recebidos:', request.cookies)
      const createMealsBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        ishealthy: z.enum(['yes', 'no']),
      })

      const { name, description, ishealthy } = createMealsBodySchema.parse(
        request.body,
      )

      await knex('meals').insert({
        id: randomUUID(),
        user_id: userId,
        name,
        description,
        date: new Date().toISOString(),
        is_healthy: ishealthy,
      })

      return reply.status(201).send()
    },
  )

  app.patch(
    '/meals/:id',
    {
      preHandler: [checkIdExist],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const { userId } = request.cookies

      const createAltarationSchema = z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        ishealthy: z.enum(['yes', 'no']).optional(),
      })

      const { name, description, ishealthy } = createAltarationSchema.parse(
        request.body,
      )

      try {
        const meal = await knex('meals').where({ id }).first()

        if (!meal) {
          return reply.status(402).send({ message: 'Refeição não encontrada' })
        }

        if (meal.user_id !== userId) {
          return reply.status(403).send({
            message: 'Você não tem permissão para editar esta refeição.',
          })
        }

        const updatedMeals = await knex('meals')
          .where({ id, user_id: userId })
          .update(
            {
              name,
              description,
              is_healthy: ishealthy,
            },
            ['id', 'name', 'description', 'date', 'is_healthy'],
          )
          .finally()

        return { updatedMeals }
      } catch (error) {
        console.error(error)
        return reply.status(500).send({ message: 'Erro interno do servidor.' })
      }
    },
  )

  app.delete(
    '/meals/:id',
    {
      preHandler: [checkIdExist],
    },
    async (request, reply) => {
      const { userId } = request.cookies
      const { id } = request.params as { id: string }

      try {
        const meal = await knex('meals').where('user_id', userId).first()

        if (!meal) {
          return reply.status(402).send({ message: 'Refeição não encontrada' })
        }
        if (meal.user_id !== userId) {
          console.log(userId)
          console.log(meal.user_id)
          return reply.status(402).send({ message: 'usuario não autorizado' })
        }

        await knex('meals').where({ id, user_id: userId }).delete()

        return reply.status(201).send()
      } catch (error) {
        console.error(error)
        return reply.status(500).send({ message: 'Erro interno do servidor.' })
      }
    },
  )
}
