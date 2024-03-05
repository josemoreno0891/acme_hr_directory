const pg = require('pg');
const express = require('express');
const app = express();
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost/department');

const port = process.env.PORT || 3000;

app.use(express.json())
app.use(require('morgan')('dev'))


app.get('/api/departments', async (req, res, next) => {
    try {
      const SQL = `
        SELECT * from departments;
      `
      const response = await client.query(SQL)
      res.send(response.rows)
    } catch (ex) {
      next(ex)
    }
  })


  app.get('/api/employees', async (req, res, next) => {
    try {
      const SQL = `
        SELECT * from employees
      `
      const response = await client.query(SQL)
      res.send(response.rows)
    } catch (ex) {
      next(ex)
    }
  })

  app.post('/api/employees', async (req, res, next) => {
    try {
      const SQL = `
        INSERT INTO employees(name, department_id)
        VALUES($1, $2)
        RETURNING *
      `
      const response = await client.query(SQL, [req.body.txt, req.body.category_id])
      res.send(response.rows[0])
    } catch (ex) {
      next(ex)
    }
  }) 


  app.delete('/api/employees/:id', async (req, res, next) => {
    try {
      const SQL = `
        DELETE from employees
        WHERE id = $1
      `
      const response = await client.query(SQL, [req.params.id])
      res.sendStatus(204)
    } catch (ex) {
      next(ex)
    }
  })


app.put('/api/employees/:id', async (req, res, next) => {
    try {
      const SQL = `
        UPDATE employees
        SET name=$1, department_id=$3, updated_at= now()
        WHERE id=$4 RETURNING *
      `
      const response = await client.query(SQL, [
        req.body.name,
        req.body.department_id,
        req.params.id
      ])
      res.send(response.rows[0])
    } catch (ex) {
      next(ex)
    }
  })

const init = async() => {
    await client.connect()
    let SQL = `
    DROP TABLE IF EXISTS departments;
    DROP TABLE IF EXISTS employees;
    CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100)
      );
    CREATE TABLE notes(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100)
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        department_id INTEGER REFERENCES departments(id) NOT NULL
        );
    `;

    await client.query(SQL)
    SQL = `
    INSERT INTO departments(name) VALUES('SQL');
    INSERT INTO departments(name) VALUES('Express');
    INSERT INTO departments(name) VALUES('Shopping');
    INSERT INTO employees(name, category_id) VALUES('learn express', (SELECT id FROM departments WHERE name='Express'));
    INSERT INTO employees(name, category_id) VALUES('add logging middleware', (SELECT id FROM departments WHERE name='Express'));
    INSERT INTO employees(name, category_id) VALUES('write SQL queries', (SELECT id FROM departments WHERE name='SQL'));
    INSERT INTO employees(name, category_id) VALUES('learn about foreign keys', (SELECT id FROM departments WHERE name='SQL'));
    INSERT INTO employees(name, category_id) VALUES('buy a quart of milk', (SELECT id FROM departments WHERE name='Shopping'));
    `;

    await client.query(SQL);
    app.listen(port)
}
init();