import { TwitterApi } from "twitter-api-v2";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const client = new TwitterApi({
appKey: process.env.API_KEY,
appSecret: process.env.API_SECRET,
accessToken: process.env.ACCESS_TOKEN,
accessSecret: process.env.ACCESS_SECRET,
});

async function main() {
try {
console.log("=== X自動投稿 開始 ===");

// tweets.json を正しく読み込む
const tweetsData = fs.readFileSync("tweets.json", "utf-8");
const tweets = JSON.parse(tweetsData);

if (tweets.length === 0) {
console.log("tweets.json に投稿内容がありません");
return;
}

// 最初の投稿を必ず使う（テスト用）
const tweetText = tweets[0].content;
console.log("投稿しようとしている内容:");
console.log(tweetText);
console.log("---------------------------");

// 実際に投稿
const res = await client.v2.tweet(tweetText);

console.log("✅ 投稿成功！");
console.log("Tweet ID:", res.data.id);
console.log("投稿日時:", new Date().toLocaleString("ja-JP"));

} catch (e) {
console.error("❌ エラー発生");
console.error("エラー種類:", e.name || "Unknown");

if (e.code === 403) {
console.error("403 Forbidden エラーです。Freeプラン制限か権限の問題の可能性が高いです。");
if (e.data) console.error("詳細:", JSON.stringify(e.data, null, 2));
} else if (e.code === 401) {
console.error("401 Unauthorized - 認証情報（API_KEYなど）が間違っている可能性があります。");
} else {
console.error("エラー詳細:", e.message || e);
}
}
}

main();
