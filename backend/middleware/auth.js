import jwt from 'jsonwebtoken';

/**
 * Authentication middleware that works for all user types (users, doctors, admins)
 * Sets req.userId, req.docId, or req.adminId depending on the token type
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication failed: No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication failed: Invalid token format' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set the appropriate ID based on token type
    if (decoded.type === 'user') {
      req.userId = decoded.id;
    } else if (decoded.type === 'doctor') {
      req.docId = decoded.id;
    } else if (decoded.type === 'admin') {
      req.adminId = decoded.id;
    } else {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication failed: Invalid token type' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed: ' + (error.message || 'Invalid token')
    });
  }
}; 