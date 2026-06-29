const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "need",
  "dare",
  "ought",
  "used",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "what",
  "which",
  "who",
  "whom",
  "this",
  "that",
  "these",
  "those",
  "am",
  "my",
  "your",
  "his",
  "her",
  "its",
  "our",
  "their",
  "me",
  "him",
  "us",
  "them",
  "my",
  "mine",
  "yours",
  "hers",
  "ours",
  "theirs",
  "video",
  "videos",
  "game",
  "gameplay",
  "gaming",
  "playthrough",
  "review",
  "guide",
  "tips",
  "tricks",
  "how",
  "why",
  "best",
  "top",
  "new",
  "update",
  "part",
  "ep",
  "episode",
  "full",
  "hd",
  "4k",
  "live",
  "stream",
  "shorts",
  "youtube",
  "official",
  "trailer",
  "reaction",
  "vs",
  "day",
  "days",
  "week",
  "hours",
  "minute",
  "minutes",
]);

/** Pull a searchable topic/game phrase from video titles. */
export function extractTopicFromTitles(titles: string[]): string {
  const freq = new Map<string, number>();

  for (const title of titles) {
    const cleaned = title
      .replace(/[\[\](){}|]/g, " ")
      .replace(/[^\w\s'-]/g, " ")
      .toLowerCase();
    const words = cleaned.split(/\s+/).filter(Boolean);

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (STOP.has(w) || w.length < 3) continue;
      freq.set(w, (freq.get(w) ?? 0) + 2);

      if (i + 1 < words.length) {
        const w2 = words[i + 1];
        if (!STOP.has(w2) && w2.length >= 3) {
          const bigram = `${w} ${w2}`;
          if (!STOP.has(bigram)) {
            freq.set(bigram, (freq.get(bigram) ?? 0) + 3);
          }
        }
      }
    }
  }

  const ranked = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] ?? "gaming";
}

export function searchQueryFromTopic(topic: string): string {
  return topic.includes(" ") ? topic : `${topic} gameplay`;
}
