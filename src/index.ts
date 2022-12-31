import { RGBA, Genotype, Skills, Pawn, Ruleset } from "./structures";
import { adulthoods } from "../data/adulthoods";
import { childhoods } from "../data/childhoods";
import { genes } from "../data/genes";

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


function jsonResponse(json: any | null, _status: number): Response {
    if (json !== null)
        json = JSON.stringify(json);
    return new Response(json, {
        status: _status, headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        }
    });
}
function errResponse(err: string, _status: number = 400): Response {
    return jsonResponse({ error: err }, _status);
}


async function handleGET(env: Env, request: Request): Promise<Response> {
    let gameID: string | null = request.headers.get("gameID");
    if (gameID === null)
        return errResponse("oops!");

    let token: string | null = request.headers.get("token");
    if (token !== null) { // send last saved pawn
        let pawn: Pawn;
        try {
            pawn = await getPawn(env, gameID, token);
        } catch (error) {
            return errResponse("Unable to find pawn with specified gameID and token.", 404);
        }
        return jsonResponse({ "gameID": request.headers.get("gameID"), "token": token, "pawn": pawn }, 200);
    } else { // send rules
        let rules: Ruleset;
        try {
            rules = await getRules(env, gameID);
        } catch (error) {
            return errResponse("Unable to find game with specified gameID.", 404);
        }
        return jsonResponse({ "gameID": gameID, "rules": rules }, 200);
    }
}

async function handlePOST(env: Env, request: Request): Promise<Response> {
    let json: any;
    try {
        json = await request.json()
    } catch (error) {
        return errResponse("Unable to parse JSON body.");
    }
    let gameID: string | null = request.headers.get("gameID");
    if (gameID === null) {
        // TODO: Verify rules are not malformed
        gameID = await createGame(env, json)
        return jsonResponse({ "gameID": gameID }, 201);
    }

    let _token: string;
    try {
        _token = await addPawn(env, gameID, json);
    } catch {
        return errResponse("Unable to find game with specified gameID.", 404);
    }
    return jsonResponse({ gameID: gameID, token: _token }, 201);
}

async function handlePUT(env: Env, request: Request): Promise<Response> {
    let gameID: string | null = request.headers.get("gameID");
    if (gameID === null)
        return errResponse("No gameID provided.");
    let token: string | null = request.headers.get("token");
    if (token === null)
        return errResponse("No pawn token provided.", 400);

    let json: any;
    try {
        json = await request.json()
    } catch (error) {
        return errResponse("Unable to parse JSON body.", 400);
    }

    try {
        await setPawn(env, gameID, token, json);
    } catch {
        return errResponse("Could not find the pawn to modify.", 404);
    }
    return jsonResponse({}, 204);
}

async function handleDELETE(env: Env, request: Request): Promise<Response> {
    let gameID: string | null = request.headers.get("gameID");
    if (gameID === null)
        return errResponse("No gameID provided.");
    let token: string | null = request.headers.get("token");
    if (token !== null) {
        try {
            await deletePawn(env, gameID, token);
        } catch {
            return errResponse("Could not find the pawn to delete.", 404);
        }
        return jsonResponse({}, 204);
    } else {
        try {
            await deleteGame(env, gameID)
        } catch {
            return errResponse("Could not find the game to delete.", 404);
        }
        return jsonResponse({}, 204);
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
            case "OPTIONS":
                return new Response(null, {
                    status: 204, headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type": "application/json",
                        "Allow": "GET, POST, PUT, DELETE, OPTIONS",
                        "Access-Control-Allow-Headers": "gameID, token, Content-Type"
                    }
                });
            default:
                return new Response(JSON.stringify({ error: "Invalid Method" }), { status: 405 });
        }
    },
};
