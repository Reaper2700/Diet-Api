import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../src/app'
import request from 'supertest'
import { execSync } from 'node:child_process'

describe('User routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('Can create a new User', async () => {
    await request(app.server)
      .post('/users')
      .send({
        name: 'testeNome',
      })
      .expect(201)
  })

  it('Can list all Users', async () => {
    const createUserResponse = await request(app.server)
      .post('/users')
      .send({
        name: 'teste list',
      })
      .expect(201)

    console.log('HEADERS:', createUserResponse.headers)

    const cookies = createUserResponse.headers['set-cookie']
    console.log('COOKIES:', cookies)

    const listUserResponse = await request(app.server)
      .get('/users')
      .set('Cookie', cookies)
      .expect(200)

    expect(listUserResponse.body.users).toEqual([
      expect.objectContaining({
        name: 'teste list',
      }),
    ])
  })
})
