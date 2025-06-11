export type Todo = {
    id: string;
    text: string;
    completed: boolean;
}

// Context from the auth process, extracted from the Stytch auth token JWT
// and provided to the MCP Server as this.props
type AuthenticationContext = {
    claims: {subject: string},
    accessToken: string
}
