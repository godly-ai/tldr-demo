import { CompletionWithContext200ResponseMatchesInner } from "godly-ai";

export type CompletionResopnse = {
  response: string;
  matches?: CompletionWithContext200ResponseMatchesInner[];
};
