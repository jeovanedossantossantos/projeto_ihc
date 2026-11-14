const jwt = require("jsonwebtoken")


const createToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("A variável JWT_SECRET não foi definida.");
    }

    return jwt.sign(
        {},
        process.env.JWT_SECRET,
        {
            subject: userId.toString(),
            expiresIn: process.env.JWT_EXPIRES_IN || "1d"
        }
    );
}
const publicUser = (user) => {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
    };
}
module.exports = {
    createToken,
    publicUser

}