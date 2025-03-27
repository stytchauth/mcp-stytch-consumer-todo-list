import {McpServer, ResourceTemplate} from '@modelcontextprotocol/sdk/server/mcp.js'
import {z} from 'zod'
import {DurableMCP} from "./lib/MCPEntrypoint.ts";
import {todoService} from "./TodoService.ts";
import {AuthenticationContext} from "../types";

/**
 * The `TodoMCP` class exposes the TODO Service via the Model Context Protocol
 * for consumption by API Agents
 */
export class TodoMCP extends DurableMCP<AuthenticationContext, Env> {
    async init() {
    }
    get todoService() {
        return todoService(this.env, this.props.claims.sub)
    }

    get server() {
        const server = new McpServer({
            name: 'TODO Service',
            version: '1.0.0',
        })

        server.resource("Todos", new ResourceTemplate("todoapp://todos/{id}", {
                list: async () => {
                    const todos = await this.todoService.get()

                    return {
                        resources: todos.map(todo => ({
                            name: todo.text,
                            uri: `todoapp://todos/${todo.id}`
                        }))
                    }
                }
            }),
            async (uri, {id}) => {
                const todos = await this.todoService.get();
                const todo = todos.find(todo => todo.id === id);
                return {
                    contents: [
                        {
                            uri: uri.href,
                            text: todo ? `text: ${todo.text} completed: ${todo.completed}` : 'NOT FOUND',
                        },
                    ],
                }
            },
        )

        server.tool('createTodo', 'Add a new TODO task', {todoText: z.string()}, async ({todoText}) => {
            await this.todoService.add(todoText)
            return {
                content: [{type: "text", text: 'TODO added successfully'}]
            };
        })

        server.tool('markTodoComplete', 'Mark a TODO as complete', {todoID: z.string()}, async ({todoID}) => {
            await this.todoService.markCompleted(todoID)
            return {
                content: [{type: "text", text: 'TODO completed successfully'}]
            };
        })

        server.tool('deleteTodo', 'Mark a TODO as deleted', {todoID: z.string()}, async ({todoID}) => {
            await this.todoService.delete(todoID)
            return {
                content: [{type: "text", text: 'TODO deleted successfully'}]
            };
        })

        return server
    }
}