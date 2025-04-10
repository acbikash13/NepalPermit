import { Pool } from "pg"

// Create a connection pool using individual environment variables
let pool: Pool

try {
  // Initialize the pool
  pool = new Pool({
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false, // Required for some PostgreSQL connections
    },
    // Add connection timeout and retry logic
    connectionTimeoutMillis: 10000, // 10 seconds
    idleTimeoutMillis: 30000, // 30 seconds
  })

  // Test the connection on startup
  pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err)
  })

  console.log("PostgreSQL pool created successfully")
} catch (error) {
  console.error("Failed to create PostgreSQL pool:", error)
  throw error // Now we throw the error to fail fast if database connection fails
}

export async function query(text: string, params: any[] = []) {
  if (!pool) {
    console.error("Database pool not initialized")
    throw new Error("Database connection not available")
  }

  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log("Executed query", { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error("Error executing query", { text, error })
    throw error
  }
}

export async function getClient() {
  if (!pool) {
    console.error("Database pool not initialized")
    throw new Error("Database connection not available")
  }

  const client = await pool.connect()
  const query = client.query.bind(client)
  const release = client.release.bind(client)

  // Set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    console.error("A client has been checked out for more than 5 seconds!")
    console.error(`The last executed query on this client was: ${client.lastQuery}`)
  }, 5000)

  // Monkey patch the query method to keep track of the last query executed
  client.query = (...args: any[]) => {
    client.lastQuery = args
    return query(...args)
  }

  client.release = () => {
    clearTimeout(timeout)
    client.query = query
    client.release = release
    return release()
  }

  return client
}
