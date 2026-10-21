import type { ReportVote, VoteCount } from "../types";

export function countVotes(votes: readonly ReportVote[]): VoteCount {
  const up = votes.filter((vote) => vote.value === 1).length;
  const down = votes.length - up;
  return { up, down, total: up - down };
}
