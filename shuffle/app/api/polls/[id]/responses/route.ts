import prisma from "@/lib/prisma";
import { SESSION_ID_COOKIE_NAME } from "@/middleware";
import { requirePollAdminIfPollIsPrivate } from "@/utils/authutils";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET /api/polls/:id/responses
// -----------------------------------------------------------------------------

export async function GET(
  request: Request,
  {
    params: { id },
  }: {
    params: { id: string };
  }
) {
  const { userId } = auth();
  const session_id = cookies().get(SESSION_ID_COOKIE_NAME)?.value;

  const { searchParams } = new URL(request.url);

  const constraints = searchParams.has("all")
    ? {}
    : userId
    ? { user_id: userId }
    : { session_id };

  const responses = await prisma.responses.findMany({
    where: {
      comment: {
        poll_id: parseInt(id),
      },
      ...constraints,
    },
  });

  const poll = await prisma.polls.findUnique({
    where: { id: parseInt(id) },
  });

  requirePollAdminIfPollIsPrivate(poll, userId);

  return NextResponse.json(responses);
}
