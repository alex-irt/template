import correctUsername from '../helpers/correctUsername.mjs';
import * as dbUsers from '../db/users.mjs';
import route from './route.mjs';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export default function(app) {
    route(app, 'get', '/api/v1/users/:id', getUser, { auth: true });
    route(app, 'post', '/api/v1/users', createUser, { auth: false });
    route(app, 'post', '/api/v1/tokens', createUserToken, { auth: false });
    route(app, 'delete', '/api/v1/tokens', deleteToken, { auth: false });
}

async function getUser({ id }, req) {
    if (req.user.id === parseInt(id)) {
        return req.user;
    } else {
        throw { status: 401 };
    }
}

// The log in function
async function createUserToken({ name, password }, req, res) {
    let user = await dbUsers.get({ name: correctUsername(name) });

    if (!user) {
        return { error: 'There is no user with that username' };
    }

    const hash = await dbUsers.getHashForUserId(user.id);

    if (!bcrypt.compareSync(password, hash)) {
        return { error: 'The password was incorrect' };
    }

    await createToken(user.id, res);

    return user;
}

async function deleteToken({}, req, res) {
    if (req.cookies.token) {
        await dbUsers.deleteToken(req.cookies.token);
    }
    
    res.clearCookie('token', { httpOnly: true, expires: 0 });
}

async function createToken(id, res) {
    const token = uuidv4();
    const milliseconds1Year = 1000 * 60 * 60 * 24 * 365;

    await dbUsers.createToken(token, id);

    res.cookie('token', token, { httpOnly: true, maxAge: milliseconds1Year });

    return token;
}


async function createUser({ name, password }, req, res) {
    if (!password || password.length < 4) {
        return { error: 'This password is too short' };
    }
    
    if (!name || name.length < 1) {
        return { error: 'You haven\'t entered a username' };
    }

    name = correctUsername(name);

    const existingUsername = await dbUsers.get({ name });

    if (existingUsername !== null) {
        return { error: 'This username is taken'};
    }

    const hash = bcrypt.hashSync(password, 12);
    const user = await dbUsers.create({ name, hash });

    await createToken(user.id, res);

    return user;
}
