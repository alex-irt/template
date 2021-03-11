import { getUserByToken } from '../db/users.mjs';

export default function(req, res, next) {
    res.set('Vary', 'Cookie');

    getUserByToken(req.cookies.token).then(user => {
        req.user = user;
        req.isAuthenticated = user !== null;

        next();
    }).catch((error) => {
        req.isAuthenticated = false;
        console.log(error);

        next();
    });
}