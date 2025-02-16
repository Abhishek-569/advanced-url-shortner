const mongoose = require("mongoose");
const ShortUrlSchema = new mongoose.Schema({
  longUrl: String,
  shortUrl: String,
  alias: { type: String, unique: true },
  topic: String,
  createdAt: { type: Date, default: Date.now },
  clicks: { type: Number, default: 0 },
  analytics: [{ timestamp: Date, ipAddress: String, userAgent: String }],
});
module.exports = mongoose.model("ShortUrl", ShortUrlSchema);