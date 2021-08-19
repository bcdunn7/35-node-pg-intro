const express = require('express');
const ExpressError = require('../expressError')
const router = express.Router();
const db = require('../db');
const slugify = require('slugify');



router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`
        SELECT i.code, i.name FROM industries AS i;`);

        let industries = {};

        for (industry of results.rows) {
            const code = industry['code'];
            const name = industry['name'];
            const indResults = await db.query(`
            SELECT c.code 
                FROM companies as c
                    JOIN company_industries as ci
                        ON c.code = ci.comp_code
                    JOIN industries as i
                        ON ci.industry_code = i.code
                WHERE ci.industry_code=$1`, [code]);
            industries[name] = [indResults.rows];
        }

        return res.json({industries: industries})
    } catch (e) {
        return next(e);
    }
})

router.post('/', async (req, res, next) => {
    try {
        const { name } = req.body;
        const code = slugify(name, {lower: true});
        const results = await db.query(`INSERT INTO industries (code, name) VALUES ($1, $2) RETURNING code, name`, [code, name])
        return res.status(201).json({industry: results.rows[0]})
    } catch (e) {
        return next(e)
    }
})

// associates industry and company
router.post('/company', async (req, res, next) => {
    try {
        const { comp_code, industry_code } = req.body;
        const results = await db.query(`INSERT INTO company_industries (comp_code, industry_code) VALUES ($1, $2) RETURNING comp_code, industry_code`, [comp_code, industry_code])
        return res.status(201).json({company_industry_connection: results.rows[0]})
    } catch (e) {
        return next(e)
    }
})


module.exports = router;