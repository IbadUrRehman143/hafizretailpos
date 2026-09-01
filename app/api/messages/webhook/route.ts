import { NextRequest,NextResponse } from "next/server";
export async function GET(req:NextRequest){const q=req.nextUrl.searchParams;if(q.get("hub.verify_token")===process.env.WHATSAPP_VERIFY_TOKEN)return new NextResponse(q.get("hub.challenge")||"",{status:200});return new NextResponse("Forbidden",{status:403})}
export async function POST(req:NextRequest){await req.json().catch(()=>null);return NextResponse.json({received:true})}
