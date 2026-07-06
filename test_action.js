const { getUserById } = require("./src/app/actions");
require("dotenv").config({ path: ".env.local" });

getUserById("1").then(console.log).catch(console.error);
