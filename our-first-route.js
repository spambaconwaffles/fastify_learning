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

  // Fetch todo list items
  fastify.get('/todoitems', async (request, reply) => {
    // fastify need define SQL query, is not an ORM
    fastify.mysql.query(
      'SELECT * FROM todo_items',
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

  // Fetch single todo item by id and not completed yet
  // can only update item when not completed
  fastify.get('/todoitems/:id', async (request, reply) => {
    // fastify need define SQL query, is not an ORM
    fastify.mysql.query(
      'SELECT * FROM todo_items WHERE id=? AND completed=false',
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
  // Can delete both completed and not completed items
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
  // When add, item is not completed
  fastify.post('/todoitems', { schema }, async (request, reply) => {
    // The schema turns null values to empty string because the schema
    // has type coercion by default.
    // Allow items without any doneBy date
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
      'INSERT INTO todo_items(todo_desc, doneBy, completed) VALUES (?, ?, false)',
      [request.body['todo_desc'], request.body['doneBy']], // we can use the `request.body` object to get the data sent by the client
      function onResult(err, result) {
        if (err) {
          fastify.log.error(err)
          reply.statusCode = 500
          reply.send(err)
          return
        }

        // console.log(result)
        reply.statusCode = 201
        reply.send(result)
      }
    )

    return reply
  })

  // Update todo item by id for description and date only, and only for not completed items
  // Updating the completed state should use another PUT route
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

    // Validate if the item is not completed
    fastify.mysql.query(
      'SELECT id FROM todo_items WHERE id=? AND completed=false',
      [request.params.id],
      function onResult(err, result) {
        if (err) {
          fastify.log.error(err)
          reply.statusCode = 500
          reply.send(err)
          return
        }

        // If there is no result returned, the item is completed or does not exist, and update is not allowed
        if (result.length === 0) {
          fastify.log.error('item is already completed or does not exist')
          reply.statusCode = 400
          reply.send({ 'error': 'item is already completed or does not exist' })
        } else {
          // if item exists and is not completed yet, proceed with update
          fastify.mysql.query(
            'UPDATE todo_items SET todo_desc=?, doneBy=? WHERE id=?',
            [request.body['todo_desc'], request.body['doneBy'], request.params.id],
            function onResult(err, result) {
              if (err) {
                fastify.log.error(err)
                reply.statusCode = 500
                reply.send(err)
                return
              }

              // console.log(result)
              reply.send(result)
            }
          )
        } // end if else
      } // end onResult for SELECT that checks if item exists and is not completed
    ) // end SELECT query

    return reply
  })

  // Define schema for updating completed state of items
  const completedState_schema = {
    type: 'object',
    required: ['completed'],
    properties: {
      'completed': { type: 'boolean' }
    }
  }

  const stateSchema = {
    body: completedState_schema
  }

  fastify.put('/updateCompletedState/:id', { stateSchema }, async (request, reply) => {
    fastify.mysql.query(
      'UPDATE todo_items SET completed=? WHERE id=?',
      [request.body['completed'], request.params.id],
      function onResult(err, result) {
        if (err) {
          fastify.log.error(err)
          reply.statusCode = 500
          reply.send(err)
          return
        }

        // console.log(result)
        reply.send(result)
      }
    )

    return reply
  })
} // end defining routes
