import {TodoMCP} from "./TodoMCP.ts";
import {getStytchOAuthEndpointUrl, stytchBearerTokenAuthMiddleware} from "./lib/auth";
import {TodoAPI} from "./TodoAPI.ts";
import {cors} from "hono/cors";
import {Hono} from "hono";

// Export the TodoMCP class so the Worker runtime can find it
export {TodoMCP};

export default new Hono<{ Bindings: Env }>()
    .use(cors())

    // Mount the TODO API underneath us
    .route('/api', TodoAPI)

    .get('/.well-known/oauth-protected-resource', async (c) => {
        const url = new URL(c.req.url);
        return c.json({
            resource: url.origin,
            authorization_servers: [`https://${c.env.STYTCH_DOMAIN}`],
        })
    })

    // Let the MCP Server have a go at handling the request
    .use('/sse/*', stytchBearerTokenAuthMiddleware)
    .route('/sse', new Hono().mount('/', TodoMCP.serveSSE('/sse').fetch))

    .use('/mcp', stytchBearerTokenAuthMiddleware)
    .route('/mcp', new Hono().mount('/', TodoMCP.serve('/mcp').fetch))

    // Finally - serve static assets from Vite
    .mount('/', (req, env) => env.ASSETS.fetch(req))
