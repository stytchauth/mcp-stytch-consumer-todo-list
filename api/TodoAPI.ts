import {Hono} from "hono";
import {todoService} from "./TodoService.ts";
import {stytchSessionAuthMiddleware} from "./lib/auth";

import {Consumer} from "@hono/stytch-auth"

/**
 * The Hono app exposes the TODO Service via REST endpoints for consumption by the frontend
 */
export const TodoAPI = new Hono<{ Bindings: Env }>()

    .get('/todos', stytchSessionAuthMiddleware, async (c) => {
        const {user_id} = Consumer.getStytchSession(c)
        const todos = await todoService(c.env, user_id).get()
        return c.json({todos})
    })

    .post('/todos', stytchSessionAuthMiddleware, async (c) => {
        const newTodo = await c.req.json<{ todoText: string }>();
        const {user_id} = Consumer.getStytchSession(c)
        const todos = await todoService(c.env, user_id).add(newTodo.todoText)
        return c.json({todos})
    })

    .post('/todos/:id/complete', stytchSessionAuthMiddleware, async (c) => {
        const {user_id} = Consumer.getStytchSession(c)
        const todos = await todoService(c.env, user_id).markCompleted(c.req.param().id)
        return c.json({todos})
    })

    .delete('/todos/:id', stytchSessionAuthMiddleware, async (c) => {
        const {user_id} = Consumer.getStytchSession(c)
        const todos = await todoService(c.env, user_id).delete(c.req.param().id)
        return c.json({todos})
    })

export type TodoApp = typeof TodoAPI;