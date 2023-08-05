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

  // Fetch single todo item by id
  fastify.get('/todoitems/:id', async (request, reply) => {
    // fastify need define SQL query, is not an ORM
    fastify.mysql.query(
      'SELECT * FROM todo_items WHERE id=?',
      [request.params.id],
      function onResult(err, result) {
        if (err) {
          fastify.log.error(err)
        }

        // console.log(result)
        reply.send(result)
      }
    )

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
    required: ['todo_desc', 'doneBy'],
    properties: {
      'todo_desc': { type: 'string' },
      'doneBy': { type: 'string' }
    }
  }

  const schema = {
    body: todoItem_schema
  }

  // Add new todo item
  fastify.post('/todoitems', { schema }, async (request, reply) => {
    // The schema turns null values to empty string because the schema
    // has type coercion by default.
    if (request.body['doneBy'] !== '') {
      // Get current date
      // The current time is removed before the date is passed to Date() to ensure
      // that time is not a factor when comparing dates
      const currDate = new Date(new Date().toISOString().split('T')[0])

      const doneByDateObj = new Date(request.body['doneBy'])

      // Check if date received is valid date (that means no such thing like "2022-10-34")
      if (doneByDateObj.toString() === 'Invalid Date') {
        fastify.log.error('Invalid date provided')
        reply.statusCode = 400

        reply.send({ error: 'Invalid date provided' })
        return reply
      }

      // Validate doneBy to not allow dates before currDate
      if (doneByDateObj < currDate) {
        fastify.log.error('Date provided is before current date')
        reply.statusCode = 400

        reply.send({ error: 'Date provided is before current date' })
        return reply
      }
    }

    fastify.mysql.query(
      'INSERT INTO todo_items(todo_desc, doneBy) VALUES (?, ?)',
      [request.body['todo_desc'], request.body['doneBy']], // we can use the `request.body` object to get the data sent by the client
      function onResult(err, result) {
        if (err) {
          fastify.log.error(err)
          reply.statusCode = 500
          reply.send(err)
        }

        // console.log(result)
        reply.statusCode = 201

        reply.send(result)
      }
    )

    return reply
  })

  // Update todo item by id
  fastify.put('/todoitems/:id', { schema }, async (request, reply) => {
    // The schema turns null values to empty string because the schema
    // has type coercion by default.
    if (request.body['doneBy'] !== '') {
      // Get current date
      // The current time is removed before the date is passed to Date() to ensure
      // that time is not a factor when comparing dates
      const currDate = new Date(new Date().toISOString().split('T')[0])

      const doneByDateObj = new Date(request.body['doneBy'])

      // Check if date received is valid date (that means no such thing like "2022-10-34")
      if (doneByDateObj.toString() === 'Invalid Date') {
        fastify.log.error('Invalid date provided')
        reply.statusCode = 400

        reply.send({ error: 'Invalid date provided' })
        return reply
      }

      // Validate doneBy to not allow dates before currDate
      if (doneByDateObj < currDate) {
        fastify.log.error('Date provided is before current date')
        reply.statusCode = 400

        reply.send({ error: 'Date provided is before current date' })
        return reply
      }
    }

    fastify.mysql.query(
      'UPDATE todo_items SET todo_desc=?, doneBy=? WHERE id=?',
      [request.body['todo_desc'], request.body['doneBy'], request.params.id],
      function onResult(err, result) {
        if (err) {
          fastify.log.error(err)
          reply.statusCode = 500
          reply.send(err)
        }

        // console.log(result)
        reply.send(result)
      }
    )

    return reply
  })
}
