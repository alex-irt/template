import pg from 'pg';

const pool = new pg.Pool({
    connectionString: 'postgresql://postgres:123@localhost:5432/template',
});

pool.connect();

// Simple functions that return Models

/**
 * @param  {} table
 * @param  {} match
 * @param  {} Model
 */
export async function getOne(table, match, Model) {
    const result = await queryOneOn(table, match);

    return result ? new Model(result) : null;
}

export async function getMany(table, match, Model, orderBy) {
    const results = await querySetOn(table, match, orderBy);

    return results.map(r => new Model(r));
}

export async function create(table, values, Model) {
    const result = await insert(table, values);

    return result ? getOne(table, { id: result.id }, Model) : null;
}

export async function update(table, id, changes, Model) {
    await queryUpdate(table, id, changes);

    return getOne(table, { id }, Model);
}

export async function updateMatching(table, match, changes, Model) {
    await queryMatchUpdate(table, match, changes);

    return getOne(table, match, Model);
}

// Functions that transform simple data into queries

export async function queryOneOn(table, match) {
    const whereEqualsValue = [];
    const values = [];

    Object.keys(match).forEach((key, index) => {
        const transformedKey = transformKeyForDb(key);

        whereEqualsValue.push(transformedKey + ' = $' + (index + 1));
        values.push(match[key]);
    });

    return await queryOne(`SELECT * FROM ${table}
        WHERE ${whereEqualsValue.join(' AND ')}`, ...values);
}

export async function querySetOn(table, match, orderBy) {
    const whereEqualsValue = [];
    const values = [];

    Object.keys(match).forEach((key, index) => {
        const transformedKey = transformKeyForDb(key);

        whereEqualsValue.push(transformedKey + ' = $' + (index + 1));
        values.push(match[key]);
    });

    return await querySet(`SELECT * FROM ${table}
        WHERE ${whereEqualsValue.join(' AND ')} ${orderBy ? ('ORDER BY ' + orderBy) : '' }`, ...values);
}

export async function insert(table, items) {
    const keys = [];
    const values = [];

    Object.keys(items).forEach(key => {
        keys.push(transformKeyForDb(key));
        values.push(items[key]);
    });

    const query = `
    INSERT INTO ${table} (${keys.join(',')})
        VALUES (${keys.map((k, i) => '$' + (i + 1)).join(',')}) RETURNING *;`;

    try {
        const res = await pool.query(query, values);

        return transformRowFromDb(res.rows[0]);
    } catch (e) {
        console.error('query failed');
        console.error(query, values);
        console.error(e);
    }
}

export async function queryUpdate(table, id, changes) {
    const setValues = [];
    const values = [];

    // $1 is id
    values.push(id);

    Object.keys(changes).forEach((key, index) => {
        // +2 because $1 is id
        setValues.push(transformKeyForDb(key) + ' = $' + (index + 2));
        values.push(changes[key]);
    });

    const query = `
    UPDATE ${table}
        SET ${setValues.join(',')}
        WHERE id = $1;
    `;

    try {
        await pool.query(query, values);
    } catch (e) {
        console.error('query failed');
        console.error(query, values);
        console.error(e);
    }
}

export async function queryMatchUpdate(table, match, changes) {
    const setValues = [];
    const values = [];

    let index = 1;

    Object.keys(changes).forEach((key) => {
        setValues.push(transformKeyForDb(key) + ' = $' + (index));
        values.push(changes[key]);

        index += 1;
    });

    const whereEqualsValue = [];

    Object.keys(match).forEach((key) => {
        const transformedKey = transformKeyForDb(key);
        
        whereEqualsValue.push(transformedKey + ' = $' + (index));
        values.push(match[key]);

        index += 1;
    });

    const query = `
    UPDATE ${table}
        SET ${setValues.join(',')}
        WHERE ${whereEqualsValue.join(' AND ')}`;

    try {
        await pool.query(query, values);
    } catch (e) {
        console.error('query failed');
        console.error(query, values);
        console.error(e);
    }
}

export async function remove(table, match) {
    const whereEqualsValue = [];
    const values = [];

    Object.keys(match).forEach((key, index) => {
        const transformedKey = transformKeyForDb(key);
        
        whereEqualsValue.push(transformedKey + ' = $' + (index + 1));
        values.push(match[key]);
    });

    return await queryOne(`DELETE FROM ${table}
        WHERE ${whereEqualsValue.join(' AND ')}`, ...values);
}

// Functions that execute sql. Avoid unless necessary.

export async function run(text, ...values) {
    try {
        await pool.query(text, values);
    } catch (e) {
        console.error('query failed');
        console.error(text, values);
        console.error(e);

        throw e;
    }
}

export async function queryOne(text, ...values) {
    const result = await pool.query(text, values);

    if (result.rows.length > 0) {
        return transformRowFromDb(result.rows[0]);
    } else {
        return null;
    }
}

export async function querySet(text, ...values) {
    try {
        const result = await pool.query(text, values);
        const rows = result.rows.map(transformRowFromDb);

        return rows || [];
    } catch (e) {
        console.error('query failed');
        console.error(text, values);
        console.error(e);

        throw e;
    }
}

// helpers

export function transformRowFromDb(row) {
    const result = {};

    Object.keys(row).forEach(key => {
        result[key.replace(/\_[a-z]/gi, m => m[1].toUpperCase())] = row[key];
    });
    
    return result;
}

export function transformKeyForDb(key) {
    return key.replace(/[A-Z]/g, m => '_' + m);
}
