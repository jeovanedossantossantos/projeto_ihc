class PublicControlles {

    async testeResponse(req, res) {

        return res.json({
            menssagem: "Tudo ok!"
        })
    }
}

module.exports = new PublicControlles()