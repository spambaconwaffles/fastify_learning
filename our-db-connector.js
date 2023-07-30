import fastifyPlugin from 'fastify-plugin'
import fastifyMysql from '@fastify/mysql'


async function dbConnector(fastify, options) {
  // somehow using connection string doesn't work, so pass the options instead
  // options available from mysql2
  fastify.register(fastifyMysql, {
    host: process.env["MYSQL_HOST"],
    user: process.env["MYSQL_USER"],
    database: process.env["MYSQL_DB"],
    password: process.env["MYSQL_PWD"]
  })
}

// Wrapping a plugin function with fastify-plugin exposes the decorators
// and hooks, declared inside the plugin to the parent scope.

export default fastifyPlugin(dbConnector)
