require("dotenv").config();
const redis = require("redis");
const { promisify } = require("util");
//print redius hsot and port
console.log("redis host", process.env.REDIS_HOST);
console.log("redis port", process.env.REDIS_PORT);


const redisClient = redis.createClient({
 socket: {
   host: process.env.REDIS_HOST,
   port:  process.env.REDIS_PORT,
 },
 legacyMode: true,
});


redisClient.on('error', (err) => {
   console.error('Redis Client Error:', err);
});


redisClient.on('connect', () => {
   console.log('Redis Client Connected');
});
redisClient.connect().catch(console.error);
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.setex).bind(redisClient);
module.exports = { redisClient, getAsync, setAsync };
