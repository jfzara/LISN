// testAnthropic.js

require("dotenv").config({ path: ".env.local" });

console.log("ENV TEST:");
console.log(process.env.ANTHROPIC_API_KEY);

async function listModels() {
  const res = await fetch("https://api.anthropic.com/v1/models", {
    method: "GET",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    }
  });

  const data = await res.json();

  console.log("AVAILABLE MODELS:");
  console.log(JSON.stringify(data, null, 2));
}

listModels();