import Sentiment from "sentiment";

const sentiment = new Sentiment();

function getSentimentEmoji(text) {
  const score = sentiment.analyze(text).score;
  if (score > 1) return "😊";
  if (score < -1) return "😢";
  return "🤖";
}

export default getSentimentEmoji;
