import jwt from "jsonwebtoken";

export const verifyToken = async (req, res, next) => {
    try {
        const token = req.header("Authorization");
        let jwtSecretKey = process.env.JWT_SECRET_TOKEN;
        if (!token)
            return res.status(403).json({ Result_Status: false, Result_Message: "A token is required for authentication", });
        const bearerToken = token.split(" ")[1];
        const decode = jwt.verify(bearerToken, jwtSecretKey);
        req.user = decode;
        next();
    } catch (error) {
        if (error.name == "TokenExpiredError") {
            return res.status(401).json({ Result_Status: false, Result_Message: "TokenExpiredError" });
        }
        return res.status(401).json({ Result_Status: false, Result_Message: "Invalid Token!" });
    }
};
