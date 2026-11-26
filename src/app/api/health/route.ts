// health router im using nextjs 16

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    // return ok and number 200

    return NextResponse.json({ status: "ok" }, { status: 200 });

}