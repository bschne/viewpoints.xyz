import type { PropsWithChildren } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { cn } from "@/utils/style-utils";
import { GitHubLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import type { Author } from "@/db/schema";
import { db } from "@/db/client";
import { isEmail } from "@/utils/strings";
import { Logo } from "@/components/Logo";
import { Button } from "../components/shadcn/ui/button";
import { anonymousAvatar } from "../components/user/UserAvatar";
import { WhatsappLink } from "../components/WhatsappLink";
import { Main } from "../components/Main";

// Data
// -----------------------------------------------------------------------------

async function getData() {
  const polls = await db
    .selectFrom("polls")
    .innerJoin("statements", "polls.id", "statements.poll_id")
    .select(({ fn }) => [
      "polls.id",
      "polls.slug",
      "polls.title",
      "polls.user_id",
      // TODO: this is the full statement count, not the public statement count
      fn.count<number>("statements.id").as("statementCount"),
    ])
    .where("polls.visibility", "=", "public")
    .orderBy("polls.id", "desc")
    .groupBy("polls.id")
    .execute();

  const authors = (
    await db
      .selectFrom("authors")
      .selectAll()
      .where(
        "userId",
        "in",
        polls.map((poll) => poll.user_id),
      )
      .execute()
  ).reduce(
    (acc, author) => {
      acc[author.userId] = author;
      return acc;
    },
    {} as Record<string, Author>,
  );

  const respondents = (
    await db
      .selectFrom("responses")
      .innerJoin("statements", "responses.statementId", "statements.id")
      .select([
        "responses.user_id",
        "responses.session_id",
        "statements.poll_id",
      ])
      .groupBy("statements.poll_id")
      .groupBy("responses.user_id")
      .groupBy("responses.session_id")
      .execute()
  ).reduce(
    (acc, response) => {
      const currentRespondentCount = acc[response.poll_id] ?? 0;
      acc[response.poll_id] = currentRespondentCount + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    polls,
    authors,
    respondents,
  };
}

// Default export
// -----------------------------------------------------------------------------

const Card = ({
  children,
  className,
}: PropsWithChildren<{
  className?: string;
}>) => (
  <div
    className={cn("w-full p-4 rounded-xl bg-white/10 text-white", className)}
  >
    {children}
  </div>
);

const Index = async () => {
  const { polls, authors, respondents } = await getData();

  return (
    <>
      <Main className="flex flex-col items-center">
        <Card className="flex mb-8 md:space-x-4">
          <div className="w-full md:w-5/12 md:p-8">
            <h2 className="mb-4 text-3xl font-medium leading-8 md:text-white/90">
              What on earth are you thinking?
            </h2>
            <p className="mb-4 md:mb-6 text-white/90 md:text-white/80">
              Viewpoints.xyz is a tool that lets you gauge opinions on any
              topic. Create a poll, get a link, and find out what your community
              is thinking.
            </p>
            <p className="mb-2">
              <Link href="/new-poll" prefetch={false}>
                <Button
                  variant="pill"
                  size="pill"
                  className="pr-5 text-sm bg-white text-gray-800 hover:bg-white/80"
                >
                  <PlusCircle className="w-4 mr-2" />
                  Create poll
                </Button>
              </Link>
            </p>
          </div>
          <div className="flex-col justify-center hidden md:flex">
            <Image
              className="mr-8"
              src="/hero.png"
              alt="an example statement"
              width={540}
              height={40}
            />
          </div>
        </Card>

        <h3 className="w-full mb-2 text-xl font-medium text-white/90 md:text-white/80">
          Running public polls
        </h3>

        <div className="w-full md:flex md:flex-wrap md:-mx-2">
          {polls.length > 0 ? (
            polls.map((poll) => {
              const numRespondents = respondents[poll.id] ?? 0;

              return (
                <Link
                  className="w-full pl-2 md:w-1/3"
                  href={`/polls/${poll.slug}`}
                  key={poll.id}
                  prefetch={false}
                >
                  <Card className="w-full md:mb-2 group md:h-[180px] md:flex md:flex-col md:hover:opacity-90 md:cursor-pointer md:transition-opacity">
                    <h4 className="mb-2 text-lg font-medium leading-6">
                      {poll.title}
                    </h4>
                    <p className="mb-3 text-sm text-white/60">
                      {poll.statementCount} statements | {numRespondents}{" "}
                      {numRespondents === 1 ? "respondent" : "respondents"}
                    </p>

                    <p className="flex items-center text-xs text-white/60 md:mt-auto">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          authors[poll.user_id]?.avatarUrl ?? anonymousAvatar
                        }
                        alt={
                          !isEmail(authors[poll.user_id]?.name)
                            ? authors[poll.user_id].name ?? "Anonymous"
                            : "Anonymous"
                        }
                        className="w-6 h-6 mr-2 rounded-full grayscale group-hover:grayscale-0"
                      />
                      <span>
                        {!isEmail(authors[poll.user_id]?.name)
                          ? authors[poll.user_id].name ?? "Anonymous"
                          : "Anonymous"}
                      </span>
                    </p>
                  </Card>
                </Link>
              );
            })
          ) : (
            <p className="mt-4 text-white/70">
              There are no public polls at the moment. Why not{" "}
              <Link href="/new-poll" className="underline" prefetch={false}>
                create one
              </Link>
              ?
            </p>
          )}

          <div className="md:w-1/3 md:pl-2">
            <Card className="my-4 bg-white md:h-[180px] md:mt-0">
              <h3 className="mb-2 text-lg font-medium leading-6 text-gray-800">
                Create your own poll!
              </h3>
              <p className="mb-4 text-gray-800/90 md:text-sm">
                It only takes a few minutes to create a poll, and you can create
                public or private polls.
              </p>
              <p className="mb-2">
                <Link href="/new-poll" prefetch={false}>
                  <Button
                    variant="pill"
                    size="pill"
                    className="pr-5 text-sm bg-background text-white hover:bg-orange-500"
                  >
                    <PlusCircle className="w-4 mr-2" />
                    Create poll
                  </Button>
                </Link>
              </p>
            </Card>
          </div>
        </div>
      </Main>

      <footer className="flex flex-col items-center w-full py-8 mt-4 md:mt-auto bg-white/10 text-white/80">
        <Link href="/" className="hover:grayscale-0 grayscale">
          <Logo width={200} height={40} />
        </Link>

        <div className="flex justify-center mt-4 space-x-5 text-xs font-medium">
          <WhatsappLink />

          <Link
            href="https://github.com/Goodheart-Labs/viewpoints.xyz"
            target="_blank"
            className="flex items-center"
          >
            <GitHubLogoIcon className="w-4 h-4 mr-2" />
            Github
          </Link>

          <Link
            href="https://twitter.com/nathanpmyoung"
            target="_blank"
            className="flex items-center"
          >
            <TwitterLogoIcon className="w-4 h-4 mr-2" />
            Nathan&apos;s Twitter
          </Link>
        </div>

        <Link href="/privacy-policy" className="mt-4 text-xs underline">
          Privacy policy
        </Link>

        <p className="mt-4 text-xs">
          &copy; {new Date().getFullYear()} Goodheart Labs
        </p>
      </footer>
    </>
  );
};

export default Index;
