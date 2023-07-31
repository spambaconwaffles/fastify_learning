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

  // Delete specific todo item
  fastify.delete('/todoitems/:id', async (request, reply) => {
    fastify.mysql.query(
      'DELETE FROM todo_items WHERE id=?',
      [request.params.id],
      function onResult(err, result) {
        if (err) {
          fastify.log.error(err)
        }

        // console.log(result)
        reply.send(result)
      }
    )

    return reply
  })

  // Define schema for new todo items
  const todoItem_schema = {
    type: 'object',
    required: ['todo_item'],
    properties: {
      'todo_item': { type: 'string' }
    }
  }

  const schema = {
    body: todoItem_schema
  }

  // Add new todo item
  fastify.post('/todoitems', { schema }, async (request, reply) => {
    fastify.mysql.query(
      'INSERT INTO todo_items(todo_desc) VALUES (?)',
      [request.body['todo_item']], // we can use the `request.body` object to get the data sent by the client
      function onResult(err, result) {
        if (err) {
          fastify.log.error(err)
        }

        // console.log(result)
        reply.status(201).send(result)
      }
    )

    return reply
  })

  fastify.put('/todoitems/:id', { schema }, async (request, reply) => {
    fastify.mysql.query(
      'UPDATE todo_items SET todo_desc=? WHERE id=?',
      [request.body['todo_item'], request.params.id],
      function onResult(err, result) {
        if (err) {
          fastify.log.error(err)
        }

        // console.log(result)
        reply.send(result)
      }
    )

    return reply
  })
}
