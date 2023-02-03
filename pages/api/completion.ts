// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { Configuration, GodlyApi } from "godly-ai";
import type { NextApiRequest, NextApiResponse } from "next";
import { CompletionResopnse as CompletionResponse } from "../../types";

export default async function Handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const prompt = req.query.prompt as string;
    const config = new Configuration({
      accessToken: process.env.GODLY_API_KEY,
    });
    const godlyApi = new GodlyApi(config);

    const engineeredPrompt = `Here are some items from the TLDR email newsletter:\n[context]\n Use all the relevant items from the newsletter to answer the user question and include links to references in this format <a href="https://LINK">Short natural text to link</a>. Don't mention reading times.\n\nQuestion:\n${prompt}.\nAnswer:`;

    const { data } = await godlyApi.completionWithContext(
      process.env.GODLY_PROJECT_ID!,
      {
        prompt: engineeredPrompt,
        context_search_prompt: prompt,
        model: "text-davinci-003",
        max_tokens: 1000,
        min_match_relevancy_score: 0.75,
      }
    );

    const resonse: CompletionResponse = {
      response: data.choices?.[0].text || "",
      matches: data.matches,
    };

    res.status(200).send(resonse);
  } catch (error) {
    console.log(error);
  }
}
