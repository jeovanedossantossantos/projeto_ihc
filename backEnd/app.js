const express = require("express");
const cors = require('cors');
require("./src/config/database")
const routes = require("./src/routes/index");

class App {

    constructor() {
        this.server = express()
        this.middleware()
        this.routes()

    }
    routes() {
        this.server.use(routes);
    }
    middleware() {

        this.server.use((req, res, next) => {

            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
            res.header("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type, Authorization");
            this.server.use(cors());
            next();
        })

        this.server.use(express.json())
    }

}

module.exports = new App().server