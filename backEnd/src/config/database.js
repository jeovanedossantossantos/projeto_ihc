
const mongoose = require("mongoose");

class Database {
  constructor() {
    this.init();
  }

  async init() {
    try {
      const mongoUri = process.env.MONGODB_URI;


      if (!mongoUri) {
        throw new Error("MONGODB_URI não foi definida.");
      }

      await mongoose.connect(mongoUri);

      this.connection = mongoose.connection;

      console.log("MongoDB conectado com sucesso.");

    } catch (error) {
      console.error("Erro ao conectar ao MongoDB:", error);
      process.exit(1);
    }
  }
}

module.exports = new Database();
