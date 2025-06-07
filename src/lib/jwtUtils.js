// JWT utility functions to decode token and extract user information
export const decodeJWT = (token) => {
  try {
    if (!token) return null;
<<<<<<< HEAD

=======
    
>>>>>>> d93c49517c5652f7c2fb44e15edf610db186ab14
    // JWT tokens have 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT token format');
    }
<<<<<<< HEAD

    // Decode the payload (second part)
    const payload = parts[1];

    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);

    // Decode base64
    const decodedPayload = atob(paddedPayload);

    // Parse JSON
    const parsedPayload = JSON.parse(decodedPayload);

=======
    
    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64
    const decodedPayload = atob(paddedPayload);
    
    // Parse JSON
    const parsedPayload = JSON.parse(decodedPayload);
    
>>>>>>> d93c49517c5652f7c2fb44e15edf610db186ab14
    return parsedPayload;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

export const getCurrentUserFromToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
<<<<<<< HEAD

    const decodedToken = decodeJWT(token);
    if (!decodedToken) return null;

=======
    
    const decodedToken = decodeJWT(token);
    if (!decodedToken) return null;
    
>>>>>>> d93c49517c5652f7c2fb44e15edf610db186ab14
    // Extract user information from token
    // Common JWT claims: sub (subject/username), email, name, etc.
    const userInfo = {
      username: decodedToken.sub || decodedToken.username || decodedToken.user,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.fullName,
      id: decodedToken.userId || decodedToken.id,
      // Add any other fields your JWT contains
    };
<<<<<<< HEAD

=======
    
>>>>>>> d93c49517c5652f7c2fb44e15edf610db186ab14
    return userInfo;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
};

export const isTokenExpired = (token) => {
  try {
    if (!token) return true;
<<<<<<< HEAD

    const decodedToken = decodeJWT(token);
    if (!decodedToken || !decodedToken.exp) return true;

=======
    
    const decodedToken = decodeJWT(token);
    if (!decodedToken || !decodedToken.exp) return true;
    
>>>>>>> d93c49517c5652f7c2fb44e15edf610db186ab14
    // exp is in seconds, Date.now() is in milliseconds
    const currentTime = Date.now() / 1000;
    return decodedToken.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
<<<<<<< HEAD
};
=======
};
>>>>>>> d93c49517c5652f7c2fb44e15edf610db186ab14
