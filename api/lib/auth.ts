import {HTTPException} from "hono/http-exception";
import {Consumer} from "@hono/stytch-auth";
import {MiddlewareHandler} from "hono";


export const stytchSessionAuthMiddleware = Consumer.authenticateSessionLocal()
export const stytchBearerTokenAuthMiddleware = Consumer.authenticateOAuth({
    onError: () => {
        throw new HTTPException(401, {message: 'Missing or invalid access token'})
    }
})
export const bindTokenMiddleware: MiddlewareHandler = async (c, next) => {
    const {claims, token: accessToken} = Consumer.getStytchOAuth(c);
    console.log(claims, accessToken);
    // @ts-expect-error Props go brr
    c.executionCtx.props = {
        claims: claims,
        accessToken,
    }
    await next();
}

export function getStytchOAuthEndpointUrl(env: Env, endpoint: string): string {
    const baseURL = env.STYTCH_PROJECT_ID.includes('test') ?
        'https://test.stytch.com/v1/public' :
        'https://api.stytch.com/v1/public';

    return `${baseURL}/${env.STYTCH_PROJECT_ID}/${endpoint}`
}