require('dotenv/config')
const app = require("./app.js")


const PORT = process.env.VAR_PORT || 4000

app.listen(PORT, () => console.log("server started in port " + PORT));