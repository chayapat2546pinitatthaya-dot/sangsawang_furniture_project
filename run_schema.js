const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    multipleStatements: true // Allow multiple SQL statements
};

async function runSchema() {
    let connection;
    try {
        console.log('Connecting to MySQL...');
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL successfully!');

        // Read schema.sql file
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        console.log(`Reading schema file: ${schemaPath}`);
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        console.log('Executing schema.sql...');
        await connection.query(schema);
        console.log('Schema executed successfully!');

        console.log('Database setup completed!');
    } catch (error) {
        console.error('Error running schema:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
    }
}

runSchema();

