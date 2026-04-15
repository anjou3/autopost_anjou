require("dotenv").config();
const { TwitterApi } = require("twitter-api-v2");
const fs = require("fs");
const path = require("path");

const TWEETS_FILE = path.join(__dirname, "tweets.json");
const LOG_FILE    = path.join(__dirname, "posted.log");

const client = new TwitterApi({
  appKey:       process.env.API_KEY,
  appSecret:    process.env.API_SECRET,
  accessToken:  process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

const rwClient = client.readWrite;

(async () => {
  const tweets = JSON.parse(fs.readFileSync(TWEETS_FILE, "utf8"));
  const posted = fs.existsSync(LOG_FILE)
    ? fs.readFileSync(LOG_FILE, "utf8").split("\n").filter(Boolean)
    : [];

  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const currentMinutes = jst.getUTCHours() * 60 + jst.getUTCMinutes();

  // ツイートのtime文字列("08:10")を分に変換するヘルパー
  const toMinutes = (timeStr) => {
    const [hh, mm] = timeStr.split(":").map(Number);
    return hh * 60 + mm;
  };

  // ±10分以内 かつ 未投稿のものを候補にする
  const TOLERANCE = 10;
  const candidate = tweets.find(t =>
    Math.abs(toMinutes(t.time) - currentMinutes) <= TOLERANCE &&
    !posted.includes(String(t.id))
  );

  const hh = String(jst.getUTCHours()).padStart(2, "0");
  const mm = String(jst.getUTCMinutes()).padStart(2, "0");
  const currentTime = `${hh}:${mm}`;

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