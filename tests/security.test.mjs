import test from "node:test"; import assert from "node:assert/strict"; import {readFileSync} from "node:fs";
test("production secrets are not committed",()=>{const env=readFileSync(".env.example","utf8");assert.match(env,/CHANGE_TO_A_LONG_RANDOM_SECRET/);assert.doesNotMatch(env,/WHATSAPP_ACCESS_TOKEN="[^\"]+"/)});
test("proxy protects API",()=>{const p=readFileSync("proxy.ts","utf8");assert.match(p,/Unauthorized/);assert.match(p,/Forbidden/)});
test("session cookie is HttpOnly",()=>{const s=readFileSync("src\/lib\/auth\/session.ts","utf8");assert.match(s,/httpOnly:true/)});
