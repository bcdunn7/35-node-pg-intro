process.env.NODE_ENV = 'test';

const request = require('supertest');

const app = require('../app');
const db = require('../db');


beforeEach(async function() {
    let result = await db.query(`
    INSERT INTO companies
    VALUES 
        ('apple', 'Apple Computer', 'Maker of OSX.'),
        ('ibm', 'IBM', 'Big blue.')
    RETURNING code, name, description`);
    testApple = result.rows[0];
    testIBM = result.rows[1];

    let result2 = await db.query(`
    INSERT INTO invoices (comp_Code, amt, paid, paid_date)
    VALUES 
        ('apple', 100, false, null),
        ('apple', 200, false, null),
        ('apple', 300, true, '2018-01-01'),
        ('ibm', 400, false, null)
    RETURNING id, comp_code, amt, paid, add_date, paid_date`);
    testAppleInv1 = result.rows[0];
    testAppleInv2 = result.rows[1];
    testAppleInv3 = result.rows[2];
    testIBMInv1 = result.rows[3];
})


afterEach(async function() {
    await db.query('DELETE FROM companies');
    await db.query('DELETE FROM invoices');
})

afterAll(async function() {
    await db.end();
})


// **********************************************
// Companies

describe("GET /companies", () => {
    test("Gets list of companies", async () => {
        const resp = await request(app).get('/companies');

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            "companies": [testApple, testIBM]
        })
    })
})

describe("GET /companies/:code", () => {
    test("Gets info for 1 company", async () => {
        const resp = await request(app).get('/companies/apple');

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            "company": {
              "code": "apple",
              "name": "Apple Computer",
              "description": "Maker of OSX.",
              "invoices": [
                {
                  "id": expect.any(Number),
                  "comp_code": "apple",
                  "amt": 100,
                  "paid": false,
                  "add_date": expect.anything(),
                  "paid_date": null
                },
                {
                  "id": expect.any(Number),
                  "comp_code": "apple",
                  "amt": 200,
                  "paid": false,
                  "add_date": expect.anything(),
                  "paid_date": null
                },
                {
                  "id": expect.any(Number),
                  "comp_code": "apple",
                  "amt": 300,
                  "paid": true,
                  "add_date": expect.anything(),
                  "paid_date": expect.anything()
                }
              ]
            }
        })
    })

    test("Responds 404 if company not found", async () => {
        const resp = await request(app).get('/companies/asdfasdf');

        expect(resp.statusCode).toEqual(404);
    })
})

describe("POST /companies", function() {
    test("Creates a new company", async function() {
        const response = await request(app)
            .post(`/companies`)
            .send({
            name: "Tesla",
            description: "Car company"
            });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            company: {code: 'tesla', name:'Tesla', description: 'Car company'}
        });
    });
});

describe("PUT /companies/:code", function() {
    test("Updates a single company", async function() {
        const response = await request(app)
            .put(`/companies/apple`)
            .send({
            name: "banana", description: "a banana"
            });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: {code: 'apple', name:'banana', description: 'a banana'}
        });
    });
  
    test("Responds with 404 if can't find company", async function() {
        const response = await request(app).put(`/companies/randomasdf`);
        expect(response.statusCode).toEqual(404);
    });
});

describe("DELETE /companies/:code", function() {
    test("Deletes a single a company", async function() {
        const response = await request(app)
            .delete(`/companies/apple`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ status: "deleted" });
    });
});
