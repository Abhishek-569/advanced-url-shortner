const express = require("express");
const cors = require("cors");
const router = express.Router();
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../doc/swagger.json"); // Ensure this path is correct

router.use(cors({ origin: true }));
router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = router;
