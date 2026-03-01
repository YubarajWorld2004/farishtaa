
const jwt=require('jsonwebtoken');

exports.isLoggedIn=(req,res,next)=>{
    try {
        const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization);
        if (!authHeader) return res.status(401).json({ error: 'Unauthorized: missing Authorization header' });

        const parts = authHeader.split(' ');
        const token = parts.length === 2 ? parts[1] : parts[0];
        if (!token) return res.status(401).json({ error: 'Unauthorized: missing token' });

        const { userId, userType } = jwt.verify(token, process.env.JWT_SECRET);
        console.log(userId,userType);
        req.userId = userId;
        req.userType = userType;
        console.log(req.body);
        return next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}
exports.isPatient=(req,res,next)=>{
    if(req.userType!=='Patient')
        return res.status(403).json({error : 'Forbidden'});
    next();
}

exports.isDoctor=(req,res,next)=>{
    if(req.userType!=='Doctor')
        return res.status(403).json({error : 'Forbidden: Doctor access only'});
    next();
}

exports.isHospital=(req,res,next)=>{
    if(req.userType!=='Hospital')
        return res.status(403).json({error : 'Forbidden: Hospital access only'});
    next();
}
