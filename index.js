// const express = require("express");
// const mongoose = require("mongoose");
// const session = require("express-session");
// const passport = require("passport");
// const GoogleStrategy = require("passport-google-oauth20").Strategy;
// const dotenv = require("dotenv");
// const jwt = require("jsonwebtoken");
// const shortid = require("shortid");
// const rateLimit = require("express-rate-limit");
// const requestIp = require("request-ip");
// const useragent = require("useragent");
// const redis = require("redis");
// const { promisify } = require("util");

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// const redisClient = redis.createClient({
//     host: process.env.REDIS_HOST,
//     port: process.env.REDIS_PORT,
//     legacyMode: true, // Required for compatibility with older Redis clients
// });

// redisClient.on('error', (err) => {
//     console.error('Redis Client Error:', err);
// });

// redisClient.on('connect', () => {
//     console.log('Redis Client Connected');
// });

// redisClient.connect().catch(console.error);

// const getAsync = promisify(redisClient.get).bind(redisClient);
// const setAsync = promisify(redisClient.setex).bind(redisClient);

// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => console.log("MongoDB connected"))
//   .catch(err => console.log(err));

// const UserSchema = new mongoose.Schema({
//   googleId: String,
//   name: String,
//   email: String,
// });

// const ShortUrlSchema = new mongoose.Schema({
//   longUrl: String,
//   shortUrl: String,
//   alias: { type: String, unique: true },
//   topic: String,
//   createdAt: { type: Date, default: Date.now },
//   clicks: { type: Number, default: 0 },
//   analytics: [{
//     timestamp: Date,
//     ipAddress: String,
//     userAgent: String,
//     osType: String,
//     deviceType: String
//   }]
// });

// const User = mongoose.model("User", UserSchema);
// const ShortUrl = mongoose.model("ShortUrl", ShortUrlSchema);

// app.use(express.json());
// app.use(requestIp.mw());
// app.use(session({
//   secret: process.env.SESSION_SECRET,
//   resave: false,
//   saveUninitialized: true,
// }));

// app.use(passport.initialize());
// app.use(passport.session());

// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   callbackURL: "/auth/google/callback",
// }, async (accessToken, refreshToken, profile, done) => {
//   let user = await User.findOne({ googleId: profile.id });
//   if (!user) {
//     user = new User({
//       googleId: profile.id,
//       name: profile.displayName,
//       email: profile.emails[0].value,
//     });
//     await user.save();
//   }
//   return done(null, user);
// }));

// passport.serializeUser((user, done) => {
//   done(null, user.id);
// });

// passport.deserializeUser(async (id, done) => {
//   const user = await User.findById(id);
//   done(null, user);
// });

// const authenticateJWT = (req, res, next) => {
//   const token = req.header("Authorization");
//   if (!token) return res.status(401).json({ message: "Access Denied" });
//   try {
//     const verified = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
//     req.user = verified;
//     next();
//   } catch (err) {
//     res.status(400).json({ message: "Invalid Token" });
//   }
// };

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 10,
//   message: "Too many requests, please try again later."
// });

// app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), async (req, res) => {
//   const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
//   res.json({ token, user: req.user });
// });

// app.post("/api/shorten", authenticateJWT, limiter, async (req, res) => {
//   const { longUrl, customAlias, topic } = req.body;
//   if (!longUrl) return res.status(400).json({ message: "longUrl is required" });

//   let alias = customAlias || shortid.generate();
//   const existingUrl = await ShortUrl.findOne({ alias });
//   if (existingUrl) return res.status(400).json({ message: "Alias already in use" });

//   const shortUrl = `${req.protocol}://${req.get("host")}/api/shorten/${alias}`;
//   const newShortUrl = new ShortUrl({ longUrl, shortUrl, alias, topic });
//   await newShortUrl.save();

//   res.json({ shortUrl, createdAt: newShortUrl.createdAt });
// });

// app.get("/api/analytics/topic/:topic", async (req, res) => {
//   const { topic } = req.params;
//   const urls = await ShortUrl.find({ topic });
//   if (!urls.length) return res.status(404).json({ message: "No URLs found for this topic" });

//   const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);
//   const uniqueUsers = new Set(urls.flatMap(url => url.analytics.map(a => a.ipAddress))).size;
  
//   res.json({ totalClicks, uniqueUsers, urls });
// });

// app.get("/api/analytics/overall", authenticateJWT, async (req, res) => {
//   const urls = await ShortUrl.find();
//   const totalUrls = urls.length;
//   const totalClicks = urls.reduce((sum, url) => sum + url.clicks, 0);
//   const uniqueUsers = new Set(urls.flatMap(url => url.analytics.map(a => a.ipAddress))).size;

//   res.json({ totalUrls, totalClicks, uniqueUsers });
// });

// app.get("/api/shorten/:alias", async (req, res) => {
//     const { alias } = req.params;
//     let url = await getAsync(alias);
//     if (!url) {
//       url = await ShortUrl.findOne({ alias });
//       if (!url) return res.status(404).json({ message: "Short URL not found" });
//       await setAsync(alias, 3600, JSON.stringify(url));
//     } else {
//       url = JSON.parse(url);
//     }
  
//     url.clicks += 1;
//     url.analytics.push({
//       timestamp: new Date(),
//       ipAddress: req.clientIp,
//       userAgent: req.headers["user-agent"],
//     });
//     await ShortUrl.updateOne({ alias }, { $set: { clicks: url.clicks }, $push: { analytics: url.analytics } });
  
//     let longUrl = url.longUrl.startsWith("http") ? url.longUrl : `https://${url.longUrl}`;
//     res.redirect(longUrl);
//   });

//   app.get("/api/analytics/:alias", async (req, res) => {
//     const { alias } = req.params;
//     const url = await ShortUrl.findOne({ alias });
//     if (!url) return res.status(404).json({ message: "Short URL not found" });
//     res.json({ totalClicks: url.clicks, analytics: url.analytics });
//   });
  
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
