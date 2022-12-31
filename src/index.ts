import { RGBA, Genotype, Skills, Pawn, Ruleset } from "./structures";

/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
    // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
    KV: KVNamespace;
    //
    // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
    // MY_DURABLE_OBJECT: DurableObjectNamespace;
    //
    // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
    // MY_BUCKET: R2Bucket;
}

function generateID(): string {
    return Math.floor(Math.random() * Math.pow(16, 8)).toString(16).padStart(8, "0") + Math.floor(Math.random() * Math.pow(16, 8)).toString(16).padStart(8, "0");
}

async function gameExists(env: Env, gameID: string): Promise<boolean> {
    if (gameID.includes(":"))
        return false;
    return (await env.KV.get(gameID)) !== null;
}

async function createGame(env: Env, rules: Ruleset): Promise<string> {
    let gameID: string;
    do {
        gameID = generateID()
    } while ((await env.KV.get(gameID)) !== null);
    await env.KV.put(gameID, JSON.stringify(rules));
    return gameID;
}

async function deleteGame(env: Env, gameID: string) {
    if (!await gameExists(env, gameID))
        throw new Error("Invalid gameID passed.");
    // console.log("Probably should implement deleting games. Maybe.");
}

async function getRules(env: Env, gameID: string): Promise<Ruleset> {
    let rules: string | null = await env.KV.get(gameID);
    if (rules === null)
        throw new Error("Invalid gameID passed.");
    return JSON.parse(rules);
}

async function hasToken(env: Env, gameID: string, token: string): Promise<boolean> {
    let pawn: string | null = await env.KV.get(gameID + ":" + token);
    return pawn !== null;
}

async function getPawn(env: Env, gameID: string, token: string): Promise<Pawn> {
    let pawn: string | null = await env.KV.get(gameID + ":" + token);
    if (pawn === null)
        throw new Error("Unable to locate pawn.");
    return JSON.parse(pawn);
}

async function addPawn(env: Env, gameID: string, pawn: Pawn): Promise<string> {
    if (!await gameExists(env, gameID))
        throw new Error("Invalid gameID passed.");
    let token: string;
    do {
        token = generateID();
    } while ((await env.KV.get(gameID + ":" + token)) !== null);
    await env.KV.put(gameID + ":" + token, JSON.stringify(pawn));
    return token;
}

async function setPawn(env: Env, gameID: string, token: string, pawn: Pawn) {
    if (!await gameExists(env, gameID))
        throw new Error("Invalid gameID passed.");
    if (!await hasToken(env, gameID, token))
        throw new Error("Invalid token passed.");
    await env.KV.put(gameID + ":" + token, JSON.stringify(pawn));
    return token;
}

async function deletePawn(env: Env, gameID: string, token: string) {
    if (!await gameExists(env, gameID))
        throw new Error("Invalid gameID passed.");
    if (!await hasToken(env, gameID, token))
        throw new Error("Invalid token passed.");
    await env.KV.delete(gameID + ":" + token);
}



function errJSON(err: string): any {
    return JSON.stringify({ error: err })
}

async function handleGET(env: Env, request: Request): Promise<Response> {
    let gameID: string | null = request.headers.get("gameID");
    if (gameID === null)
        return new Response(errJSON("oops!"), { status: 400 });
    
    let token: string | null = request.headers.get("token");
    if (token !== null) { // send last saved pawn
        let pawn: Pawn;
        try {
            pawn = await getPawn(env, gameID, token);
        } catch (error) {
            return new Response(errJSON("Unable to find pawn with specified gameID and token."), { status: 404 });
        }
        return new Response(JSON.stringify({ "gameID": request.headers.get("gameID"), "token": token, "pawn": pawn }), { status: 200 })
    } else { // send rules
        let rules: Ruleset;
        try {
            rules = await getRules(env, gameID);
        } catch (error) {
            return new Response(errJSON("Unable to find game with specified gameID."), { status: 404 });
        }
        return new Response(JSON.stringify({ "gameID": gameID, "rules": rules }), { status: 200 })
    }
}

async function handlePOST(env: Env, request: Request): Promise<Response> {
    let json: any;
    try {
        json = await request.json()
    } catch (error) {
        return new Response(errJSON("Unable to parse JSON body."), { status: 400 });
    }
    let gameID: string | null = request.headers.get("gameID");
    if (gameID === null) {
        // TODO: Verify rules are not malformed
        gameID = await createGame(env, json)
        return new Response(JSON.stringify({ "gameID": gameID }), { status: 201 });
    }

    let _token: string;
    try {
        _token = await addPawn(env, gameID, json);
    } catch {
        return new Response(errJSON("Unable to find game with specified gameID."), { status: 404 });
    }
    return new Response(JSON.stringify({ gameID: gameID, token: _token}), { status: 201 });
}

async function handlePUT(env: Env, request: Request): Promise<Response> {
    let gameID: string | null = request.headers.get("gameID");
    if (gameID === null)
        return new Response(errJSON("No gameID provided."), {status: 400});
    let token: string | null = request.headers.get("token");
    if (token === null)
        return new Response(errJSON("No pawn token provided."), {status: 400});

    let json: any;
    try {
        json = await request.json()
    } catch (error) {
        return new Response(errJSON("Unable to parse JSON body."), { status: 400 });
    }
    
    try {
        await setPawn(env, gameID, token, json);
    } catch {
        return new Response(errJSON("Could not find the pawn to modify."), { status: 404 });
    }
    return new Response("{}", { status: 204 });
}

async function handleDELETE(env: Env, request: Request): Promise<Response> {
    let gameID: string | null = request.headers.get("gameID");
    if (gameID === null)
        return new Response(errJSON("No gameID provided."), {status: 400});
    let token: string | null = request.headers.get("token");
    if (token !== null) {
        try {
            await deletePawn(env, gameID, token);
        } catch {
            return new Response(errJSON("Could not find the pawn to delete."), { status: 404 });
        }
        return new Response("{}", { status: 204 });
    } else {
        try {
            await deleteGame(env, gameID)
        } catch {
            return new Response(errJSON("Could not find the game to delete."), { status: 404 });
        }
        return new Response("{}", { status: 204 });
    }
}

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
    ): Promise<Response> {
        switch (request.method) {
            case "GET":
                return await handleGET(env, request);
            case "POST":
                return await handlePOST(env, request);
            case "PUT":
                return await handlePUT(env, request);
            case "DELETE":
                return await handleDELETE(env, request);
            default:
                return new Response(JSON.stringify({ error: "Invalid Method" }), { status: 405 });
        }
    },
};
