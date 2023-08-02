import 'dotenv/config'
// console.log(process.env)
// ESM
import Fastify from 'fastify'

// Need install cors to communicate with frontend
import cors from '@fastify/cors'

// ecmascript need .js extension
import dbConnector from './our-db-connector.js'
import firstRoute from './our-first-route.js'

/**
 * @type {import('fastify').FastifyInstance} Instance of Fastify
 */
const fastify = Fastify({
  logger: true
})

await fastify.register(cors, {
  // frontend url, should probably be in .env
  // only allow frontend url to access server
  origin: "http://localhost:8080"
})

fastify.register(dbConnector)
fastify.register(firstRoute)

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
  // Server is now listening on ${address}
})
