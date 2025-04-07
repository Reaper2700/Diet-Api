import { app } from './app'

app
  .listen({
    port: 3500,
    host: '0.0.0.0',
  })
  .then(() => {
    console.log('server http running')
  })
