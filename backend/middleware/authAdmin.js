import jwt from "jsonwebtoken"

// admin authentication middleware
const authAdmin = async (req, res, next) => {
    try {
        console.log('authAdmin middleware called');
        console.log('Headers received:', req.headers);
        
        const { atoken } = req.headers
        if (!atoken) {
            console.log('No atoken found in headers');
            return res.status(401).json({ success: false, message: 'Not Authorized Login Again' })
        }
        
        console.log('Verifying token with secret:', process.env.JWT_SECRET ? 'Secret exists' : 'No secret');
        try {
            const token_decode = jwt.verify(atoken, process.env.JWT_SECRET)
            console.log('Token decoded:', token_decode);
            
            if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
                console.log('Token verification failed');
                return res.status(401).json({ success: false, message: 'Not Authorized Login Again' })
            }
            
            console.log('Admin authentication successful');
            next()
        } catch (jwtError) {
            console.log('JWT verification error:', jwtError);
            return res.status(401).json({ success: false, message: 'Invalid token' })
        }
    } catch (error) {
        console.log('authAdmin error:', error)
        res.status(500).json({ success: false, message: error.message })
    }
}

export default authAdmin;