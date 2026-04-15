require("dotenv").config();
const { TwitterApi } = require("twitter-api-v2");
const fs = require("fs");
const path = require("path");

const TWEETS_FILE = path.join(__dirname, "tweets.json");
const LOG_FILE    = path.join(__dirname, "posted.log");

const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);

const rwClient = client.readWrite;

(async () => {
  const tweets = JSON.parse(fs.readFileSync(TWEETS_FILE, "utf8"));
  const posted = fs.existsSync(LOG_FILE)
    ? fs.readFileSync(LOG_FILE, "utf8").split("\n").filter(Boolean)
    : [];

  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const hh = String(jst.getUTCHours()).padStart(2, "0");
  const mm = String(jst.getUTCMinutes()).padStart(2, "0");
  const currentTime = `${hh}:${mm}`;

  const candidate = tweets.find(t =>
    t.time === currentTime && !posted.includes(String(t.id))
  );

  if (!candidate) {
    console.log("投稿対象なし:", currentTime);
    process.exit(0);
  }

  if (process.env.TEST_MODE === "true") {
    console.log("[TEST]", candidate.content);
    process.exit(0);
  }

  await rwClient.v2.tweet(candidate.content);
  fs.appendFileSync(LOG_FILE, candidate.id + "\n");
  console.log("投稿完了:", candidate.content);
})();
