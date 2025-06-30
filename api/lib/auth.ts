import {createRemoteJWKSet, jwtVerify} from "jose";
import {createMiddleware} from "hono/factory";
import {HTTPException} from "hono/http-exception";
import {getCookie} from "hono/cookie";

/**
 * stytchAuthMiddleware is a Hono middleware that validates that the user is logged in
 * It checks for the stytch_session_jwt cookie set by the Stytch FE SDK
 */
export const stytchSessionAuthMiddleware = createMiddleware<{
    Variables: {
        userID: string
    },
    Bindings: Env,
}>(async (c, next) => {
    const sessionCookie = getCookie(c, 'stytch_session_jwt');

    try {
        const verifyResult = await validateStytchJWT(sessionCookie ?? '', c.env)
        c.set('userID', verifyResult.payload.sub!);
    } catch (error) {
        console.error(error);
        throw new HTTPException(401, {message: 'Unauthenticated'})
    }

    await next()
})

/**
 * stytchBearerTokenAuthMiddleware is a Hono middleware that validates that the request has a Stytch-issued bearer token
 * Tokens are issued to clients at the end of a successful OAuth flow
 */
export const stytchBearerTokenAuthMiddleware = createMiddleware<{
    Bindings: Env,
}>(async (c, next) => {
    const authHeader = c.req.header('Authorization')
    const url = new URL(c.req.url);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const wwwAuthValue = `Bearer error="Unauthorized", error_description="Unauthorized", resource_metadata="${url.origin}/.well-known/oauth-protected-resource"`;
        const responseHeaders = new Headers();
        
        responseHeaders.set('WWW-Authenticate', wwwAuthValue);
        const res = new Response(null, {status: 401, headers: responseHeaders})
        throw new HTTPException(401, {message: 'Missing or invalid access token', res: res})
    }
    const accessToken = authHeader.substring(7);

    try {
        const verifyResult = await validateStytchJWT(accessToken, c.env)
        // @ts-expect-error Props go brr
        c.executionCtx.props =  {
            claims: verifyResult.payload,
            accessToken,
        }
    } catch (error) {
        console.error(error);
        throw new HTTPException(401, {message: 'Unauthenticated'})
    }

    await next()
})

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

async function validateStytchJWT(token: string, env: Env) {
    if (!jwks) {
        jwks = createRemoteJWKSet(new URL(`${env.STYTCH_DOMAIN}/.well-known/jwks.json`))
    }

    return await jwtVerify(token, jwks, {
        audience: env.STYTCH_PROJECT_ID,
        issuer: [env.STYTCH_DOMAIN],
        typ: "JWT",
        algorithms: ['RS256'],
    })
}
