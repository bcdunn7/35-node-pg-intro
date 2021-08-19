const express = require('express');
const ExpressError = require('../expressError')
const router = express.Router();
const db = require('../db');
const slugify = require('slugify');


router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM companies`);
        return res.json({companies: results.rows})
    } catch (e) {
        return next(e);
    }
})

router.get('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const results = await db.query(`SELECT * FROM companies WHERE code = $1`, [code]);
        const invoices = await db.query(`SELECT * FROM invoices WHERE comp_code=$1`, [code])
        const industriesResult = await db.query(`SELECT i.name 
            FROM industries AS i 
                JOIN company_industries AS ci 
                    ON i.code = ci.industry_code
                JOIN companies AS c
                    ON ci.comp_code = c.code
            WHERE c.code = $1`, [code])

        let industries = [];

        for (let i = 0; i < industriesResult.rows.length; i++) {
            industries.push(industriesResult.rows[i]['name'])
        }

        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}.`, 404)
        }

        return res.json({company: {code:results.rows[0]['code'], name:results.rows[0]['name'], description:results.rows[0]['description'], invoices: invoices.rows}, industries: industries})
    } catch (e) {
        return next(e)
    }
})

router.post('/', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const code = slugify(name, {lower: true});
        const results = await db.query(`INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description])
        return res.status(201).json({company: results.rows[0]})
    } catch (e) {
        return next(e)
    }
})

router.put('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        const results = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`, [name, description, code])

        if (results.rows.length === 0) {
            throw new ExpressError(`Can't find company with code of ${code}.`, 404)
        }

        return res.json({company: results.rows[0]})
    } catch (e) {
        return next(e)
    }
})

router.delete('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const results = await db.query(`DELETE FROM companies WHERE code = $1`, [code])
        return res.json({status: 'deleted'})
    } catch (e) {
        return next(e)
    }
})


module.exports = router;