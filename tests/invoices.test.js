process.env.NODE_ENV = 'test';

const { hasUncaughtExceptionCaptureCallback } = require('process');
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
    testAppleInv1 = result2.rows[0];
    testAppleInv2 = result2.rows[1];
    testAppleInv3 = result2.rows[2];
    testIBMInv1 = result2.rows[3];
})


afterEach(async function() {
    await db.query('DELETE FROM companies');
    await db.query('DELETE FROM invoices');
})

afterAll(async function() {
    await db.end();
})

// **********************************************
// Invoices

describe("GET /invoices", () => {
    test("Gets list of invoices", async () => {
        const resp = await request(app).get('/invoices');

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            "invoice": [
              {
                "id": expect.any(Number),
                "comp_code": "apple",
                "amt": 100,
                "paid": false,
                "add_date": "2021-08-18T05:00:00.000Z",
                "paid_date": null
              },
              {
                "id": expect.any(Number),
                "comp_code": "apple",
                "amt": 200,
                "paid": false,
                "add_date": "2021-08-18T05:00:00.000Z",
                "paid_date": null
              },
              {
                "id": expect.any(Number),
                "comp_code": "apple",
                "amt": 300,
                "paid": true,
                "add_date": "2021-08-18T05:00:00.000Z",
                "paid_date": "2018-01-01T06:00:00.000Z"
              },
              {
                "id": expect.any(Number),
                "comp_code": "ibm",
                "amt": 400,
                "paid": false,
                "add_date": "2021-08-18T05:00:00.000Z",
                "paid_date": null
              },
            ]
          })
    })
})

describe("GET /invoices/:id", () => {
    test("Gets info for 1 invoice", async () => {
        const resp = await request(app).get(`/invoices/${testAppleInv1.id}`);

        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            "invoice": {
              "id": expect.any(Number),
              "comp_code": "apple",
              "amt": 100,
              "paid": false,
              "add_date": "2021-08-18T05:00:00.000Z",
              "paid_date": null
            }
          })
    })

    test("Responds 404 if invoice not found", async () => {
        const resp = await request(app).get('/invoices/12341234');

        expect(resp.statusCode).toEqual(404);
    })
})

describe("POST /invoices", function() {
    test("Creates a new invoice", async function() {
        const response = await request(app)
            .post(`/invoices`)
            .send({
            comp_code: "apple",
            amt: 123
            });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            "invoice": {
              "id": expect.any(Number),
              "comp_code": "apple",
              "amt": 123,
              "paid": false,
              "add_date": "2021-08-18T05:00:00.000Z",
              "paid_date": null
            }
          });
    });
});

describe("PUT /invoices/:id", function() {
    test("Updates a single invoice", async function() {
        const response = await request(app)
            .put(`/invoices/${testAppleInv1.id}`)
            .send({
            amt: "555"
            });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            "invoice": {
              "id": expect.any(Number),
              "comp_code": "apple",
              "amt": 555,
              "paid": false,
              "add_date": "2021-08-18T05:00:00.000Z",
              "paid_date": null
            }
          });
    });
  
    test("Responds with 404 if can't find invoice", async function() {
        const response = await request(app).put(`/invoices/12341234`);
        expect(response.statusCode).toEqual(404);
    });
});

describe("DELETE /invoices/:id", function() {
    test("Deletes a single a invoice", async function() {
        const response = await request(app)
            .delete(`/invoices/${testAppleInv1.id}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ status: "deleted" });
    });
});
