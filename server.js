import 'dotenv/config'
// console.log(process.env)
// ESM
import Fastify from 'fastify'
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
