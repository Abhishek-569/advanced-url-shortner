const express = require("express");
const ShortUrl = require("../models/ShortUrl");
const authenticateJWT = require("../middlewares/auth");
const limiter = require("../middlewares/ratelimiter");
const { getAsync, setAsync } = require("../config/redis");
const router = express.Router();


router.post("/shorten", authenticateJWT, limiter, async (req, res) => {
  const { longUrl, customAlias, topic } = req.body;
  if (!longUrl) return res.status(400).json({ message: "longUrl is required" });
  let alias = customAlias || require("shortid").generate();
  if (await ShortUrl.findOne({ alias })) return res.status(400).json({ message: "Alias already in use" });
  const shortUrl = `${req.protocol}://${req.get("host")}/api/shorten/${alias}`;
  const newShortUrl = new ShortUrl({ longUrl, shortUrl, alias, topic });
  await newShortUrl.save();
  res.json({ shortUrl, createdAt: newShortUrl.createdAt });
});

router.get("/analytics/overall", authenticateJWT, async (req, res) => {
  const urls = await ShortUrl.find();
  const totalUrls = urls.length;
  const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);
  const uniqueUsers = new Set(urls.flatMap(url => url.analytics.map(a => a.ipAddress))).size;

  res.json({ totalUrls, totalClicks, uniqueUsers });
});

router.get("/analytics/:alias", authenticateJWT,async (req, res) => {
  const url = await ShortUrl.findOne({ alias: req.params.alias });
  if (!url) return res.status(404).json({ message: "Short URL not found" });
  res.json({ totalClicks: url.clicks, analytics: url.analytics });
});



  
router.get("/shorten/:alias", async (req, res) => {
    const { alias } = req.params;
    let url = await getAsync(alias);
    if (!url) {
      url = await ShortUrl.findOne({ alias });
      if (!url) return res.status(404).json({ message: "Short URL not found" });
      await setAsync(alias, 3600, JSON.stringify(url));
    } else {
      url = JSON.parse(url);
    }
  
    url.clicks += 1;
    url.analytics.push({
      timestamp: new Date(),
      ipAddress: req.clientIp,
      userAgent: req.headers["user-agent"],
    });
    await ShortUrl.updateOne({ alias }, { $set: { clicks: url.clicks }, $push: { analytics: url.analytics } });
  
    let longUrl = url.longUrl.startsWith("http") ? url.longUrl : `https://${url.longUrl}`;
    res.redirect(longUrl);
  });


  router.get("/analytics/topic/:topic",authenticateJWT, async (req, res) => {
    const { topic } = req.params;
    const urls = await ShortUrl.find({ topic });
    if (!urls.length) return res.status(404).json({ message: "No URLs found for this topic" });
  
    const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);
    const uniqueUsers = new Set(urls.flatMap(url => url.analytics.map(a => a.ipAddress))).size;
    
    res.json({ totalClicks, uniqueUsers, urls });
  });


module.exports = router;