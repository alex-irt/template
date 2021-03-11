import * as db from './db.mjs';
import User from '../models/User.mjs';

const table = 'users';

/**
 * @param {any} match selector to match record on
 * @returns {Promise<User>} The matched asset or null
 */
export async function get(match) {
    return db.getOne(table, match, User);
}

/**
 * @param {any} match selector to match records on
 * @returns {Promise<User[]>} The matched Users
 */
export async function getSet(match) {
    return db.getMany(table, match, User);
}

/**
 * @param {any} changes Hash of changes
 * @param {Number} id id of record to update
 * @returns {Promise<User>} The changed model
 */
export function update(id, changes) {
    return db.update(table, id, changes, User);
}

/**
 * @param {any} values Hash of new record's values
 * @returns {Promise<User>} The new model
 */
export function create(values) {
    return db.create(table, values, User);
}

/**
 * @param {Number} id id of record to delete
 */
export function remove(id) {
    return db.remove(table, { id });
}

export async function getHashForUserId(id) {
    const params = await db.queryOneOn(table, { id });

    return params ? params.hash : null;
}

export async function getUserByToken(token) {
    if (!token) {
        return null;
    }

    const params = await db.queryOne(`
        SELECT users.id, users.name, users.avatar_src, tokens.last_active FROM tokens
            JOIN users ON tokens.user_id = users.id
            WHERE tokens.token = $1
            GROUP BY users.id, tokens.last_active`,
        token);

    if (!params) {
        return null;
    }

    const dayInMs = 1000 * 60 * 60 * 24;
    const lastActive = params.lastActive.getTime();

    // Over 30 days since the token was used, expired.
    if (lastActive + (dayInMs * 30) < Date.now()) {
        return null;
    }

    if (lastActive + dayInMs < Date.now()) {
        await db.run(`UPDATE tokens set last_active = $1 where token = $2;`, new Date(), token);
    }

    return new User(params);
}

export async function createToken(token, userId) {
    await db.insert('tokens', { token, userId, created: new Date(), lastActive: new Date() });
}

export async function deleteToken(token) {
    await db.queryOne(`DELETE FROM tokens WHERE token = $1`, token);
}
