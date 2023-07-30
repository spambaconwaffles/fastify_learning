// our-first-route.js

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */

export default async function routes(fastify, options) {
  fastify.get('/', async (request, reply) => {
    return { hello: 'asdfsd' }
  })

  // Fetch all todo list items from db
  fastify.get('/todoitems', async (request, reply) => {
    // fastify need define SQL query, is not an ORM
    fastify.mysql.query('SELECT * FROM todo_items', function onResult(err, result) {
      if (err) {
        fastify.log.error(err)
      }

      // console.log(result)
      reply.send(result)
    })

    // Issue with nodeJS streams require returning reply
    // https://stackoverflow.com/questions/76207360/why-does-fastify-send-a-response-and-doesnt-wait-for-my-response
    return reply
  })
}
