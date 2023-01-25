import axios from "axios";
import clsx from "clsx";
import { useState } from "react";
import { CompletionResopnse } from "../types";

const questions = [
  "Whats going on with Elon Musk?",
  "Why are tech companies doing layoffs?",
  "Any interesting medical breakthroughs?",
  "What are the most interesting github repos?",
  "What is something that was posted and surprising?",
  "Where did TLDR Chat come from?",
];

export default function Home() {
  const [prompt, setPrompt] = useState<string>("");
  const [result, setResult] = useState<CompletionResopnse>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  function handleSubmit(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    if (!prompt) return;
    handleDoCompletion(prompt);
  }

  function handleDoCompletion(prompt: string) {
    if (!prompt) return;
    setLoading(true);
    setResult(undefined);
    setError(undefined);
    axios
      .get<CompletionResopnse>(`api/completion?prompt=${prompt}`)
      .then((res) => {
        setResult(res.data);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div className="flex flex-col items-center mt-28 pb-10">
      <div className="text-7xl font-bold mb-6">Ask TLDR</div>
      <div className="grid gap-1 mb-10 text-center">
        <div className="">
          A bot trained on the last 100 days of{" "}
          <a
            href="https://tldr.tech"
            target="_blank"
            rel="noreferrer"
            className="text-blue-400"
          >
            TLDR newsletter
          </a>{" "}
          editions.
        </div>
        <div className="">
          We built this in a couple of hours using{" "}
          <a
            href="https://godly.ai"
            target="_blank"
            rel="noreferrer"
            className="text-blue-400"
          >
            Godly.ai
          </a>{" "}
          to power the context.
        </div>
        <div className="">
          View the code for this demo{" "}
          <a
            href="https://github.com/godly-ai/tldr-demo"
            target="_blank"
            rel="noreferrer"
            className="text-blue-400"
          >
            on GitHub
          </a>
          .
        </div>
      </div>

      <div className="max-w-2xl mb-4">
        <div className=" font-bold text-sm mb-3 text-center">
          Things to ask about:
        </div>
        <div className="grid grid-cols-3 gap-6 text-sm text-black/80 mb-3">
          {questions.map((question) => (
            <div
              className="bg-black/10 p-3 rounded cursor-pointer"
              onClick={() => {
                setPrompt(question);
                handleDoCompletion(question);
              }}
              key={question}
            >
              {question}
            </div>
          ))}
        </div>
      </div>
      <div className="max-w-2xl w-full mb-4">
        <form onSubmit={handleSubmit} className="grid gap-3">
          <input
            type="text"
            placeholder="Ask Anything"
            className="px-4 py-2 rounded-md outline-none border-[1px] border-black/20 w-full"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            type="submit"
            className={clsx(
              "py-2 px-4 bg-black text-white rounded-lg w-full",
              loading && "animate-pulse"
            )}
            disabled={loading}
          >
            Submit
          </button>
          {error && <div className="text-red-400 text-sm ">{error}</div>}
        </form>
      </div>
      {loading && (
        <div className="my-8 text-back/40">
          <Spinner />
        </div>
      )}
      {result && (
        <div className="max-w-2xl grid gap-4">
          <div className="response-wrapper bg-green-100 text-green-900 p-7 rounded-2xl">
            <div
              dangerouslySetInnerHTML={{ __html: makeLinks(result.response) }}
            ></div>
          </div>

          {result?.matches?.map((match) => {
            try {
              const { title, text, link, date } = JSON.parse(
                match.item?.value || "{}"
              );

              return (
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-black/5 p-7 rounded-2xl"
                  key={match.item?.id}
                >
                  <h1 className="font-bold mb-1">{title}</h1>
                  <p>{text}</p>
                  <div className="text-sm mt-2 text-black/40">
                    Posted: {date}
                  </div>
                  {match.score && (
                    <div className="text-sm text-black/30 mt-2">
                      Relevancy: {Math.round(match.score * 100)}%
                    </div>
                  )}
                </a>
              );
            } catch (error) {
              return (
                <p className="bg-black/5 p-7 rounded-2xl">
                  <div
                    className=""
                    dangerouslySetInnerHTML={{
                      __html: makeLinks(match.item?.value || ""),
                    }}
                  ></div>
                  {match.score && (
                    <div className="text-sm text-black/30 mt-2">
                      Relevancy: {Math.round(match.score * 100)}%
                    </div>
                  )}
                </p>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="animate-spin rounded-full h-8 w-8 border-4 border-black border-t-transparent"></div>
  );
}

/**
 * LOL makeLinks built by chatgpt.
 * @param text
 * @returns
 */
function makeLinks(text: string): string {
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const urlRegex =
    /((?:<a [^>]*href=["|'])|(?:(?:^|\s)(?!@)))([^@\s]+\.[^@\s]+(?=\s|$))/gi;

  return text
    .replace(emailRegex, '<a href="mailto:$1">$1</a>')
    .replace(urlRegex, (match, p1, p2) => {
      if (p1.startsWith("<a")) {
        return match;
      } else {
        if (!p2.startsWith("http://") && !p2.startsWith("https://")) {
          return ` <a href="https://${p2}" target="_blank">${p2}</a>`;
        }
        return ` <a href="${p2}" target="_blank">${p2
          .replace("https://", "")
          .replace("http://", "")}</a>`;
      }
    });
}
