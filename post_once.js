require("dotenv").config();
const { TwitterApi } = require("twitter-api-v2");
const fs = require("fs");
const path = require("path");

const TWEETS_FILE = path.join(__dirname, "tweets.json");
const LOG_FILE    = path.join(__dirname, "posted.log");

const client = new TwitterApi({
  appKey:      process.env.API_KEY,
  appSecret:   process.env.API_SECRET,
  accessToken:  process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

// 1. ここで「v2の書き込み権限を持つクライアント」を定義します
const rwClient = client.readWrite.v2; 

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

  // 2. ここで rwClient（v2版）を使ってツイートします
  await rwClient.tweet(candidate.content); 
  
  fs.appendFileSync(LOG_FILE, candidate.id + "\n");
  console.log("投稿完了:", candidate.content);
})();
