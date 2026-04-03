import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { SessionData, sessionOptions } from "@/lib/session"

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  const session = await getIronSession<SessionData>(req, res, sessionOptions)
  session.isLoggedIn = true
  await session.save()

  return res
}
