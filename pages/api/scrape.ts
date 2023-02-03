import axios from "axios";
import * as cheerio from "cheerio";
import { Configuration, GodlyApi } from "godly-ai";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function Handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return res.send({
    message:
      "Prevented from running again so we don't duplicate context items.",
  });
  const editions = getLatestEditions(100);
  const results = await scrapeEditions(editions);

  const config = new Configuration({
    accessToken: process.env.GODLY_API_KEY,
  });
  const godlyApi = new GodlyApi(config);

  await Promise.all(
    results
      .filter((item) => !!item)
      .map((item) => {
        const month = new Date(item.date).toLocaleString("default", {
          month: "long",
        });
        const year = new Date(item.date).toLocaleString("default", {
          year: "numeric",
        });

        godlyApi.createContextItem(
          process.env.GODLY_PROJECT_ID!,
          800,
          "split",
          {
            value: `{
  "title": "${item.title}",
  "text": "${item.text}",
  "link": "${item.link}",
  "date": "${item.date}"
}`,
            reference: item.link,
            tags: [item.date, month, year],
          }
        );
      })
  );

  res.status(200).send(results);
}

function getLatestEditions(n: number) {
  const currentEdition = "2023-01-24";
  const date = new Date(currentEdition);
  const editions = [];
  for (let i = 0; i < n; i++) {
    const isWeekday = date.getDay() !== 0 && date.getDay() !== 6;
    if (isWeekday) {
      const edition = date.toISOString().split("T")[0];
      editions.push(edition);
    }
    date.setDate(date.getDate() - 1);
  }
  return editions;
}

async function scrapeEditions(editions: string[]) {
  const results = await Promise.all(
    editions.map(async (edition) => {
      const url = `https://tldr.tech/tech/${edition}`;
      try {
        const result = await scrapeURL(url);
        return result;
      } catch (error) {
        return null;
      }
    })
  );

  return results.flat().filter((item) => !!item) as {
    title: string;
    text: string;
    link: string;
    date: string;
  }[];
}

async function scrapeURL(url: string) {
  const { data } = await axios.get(url);

  const $ = cheerio.load(data);

  const content = $(".content-center.max-w-xl");

  // get all the elements with class .mt-3
  const results = content
    .find(".mt-3")
    .map((i, el) => {
      const title = $(el).find("h3").text().trim();
      const text = $(el).find("div").eq(0).text().trim();
      const link = $(el).find("a").attr("href")?.trim();
      const date = url.split("/").pop()?.trim();
      return { title, text, link, date };
    })
    .get()
    .filter(
      (item) =>
        !item.title.toLowerCase().includes("sponsor") &&
        !item.link?.includes("/jobs/") &&
        item.text.length > 0 &&
        item.title.length > 0
    );

  return results;
}
