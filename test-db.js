const mysql = require('mysql2');

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'contact_management'
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Successfully connected to MySQL database');
    
    // Create database if it doesn't exist
    db.query('CREATE DATABASE IF NOT EXISTS contact_management', (err) => {
        if (err) {
            console.error('Error creating database:', err);
            return;
        }
        console.log('Database created or already exists');
        
        // Use the database
        db.query('USE contact_management', (err) => {
            if (err) {
                console.error('Error using database:', err);
                return;
            }
            console.log('Using contact_management database');
            
            // Create tables
            const createContactsTable = `
                CREATE TABLE IF NOT EXISTS contacts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    status ENUM('pending', 'replied') DEFAULT 'pending',
                    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            const createRepliesTable = `
                CREATE TABLE IF NOT EXISTS replies (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    contact_id INT NOT NULL,
                    message TEXT NOT NULL,
                    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
                )
            `;

            db.query(createContactsTable, (err) => {
                if (err) {
                    console.error('Error creating contacts table:', err);
                    return;
                }
                console.log('Contacts table created or already exists');
            });

            db.query(createRepliesTable, (err) => {
                if (err) {
                    console.error('Error creating replies table:', err);
                    return;
                }
                console.log('Replies table created or already exists');
                
                // Insert some test data
                const testContact = {
                    name: 'Test User',
                    email: 'test@example.com',
                    message: 'This is a test message',
                    status: 'pending'
                };

                db.query('INSERT INTO contacts SET ?', testContact, (err, result) => {
                    if (err) {
                        console.error('Error inserting test contact:', err);
                        return;
                    }
                    console.log('Test contact inserted successfully');
                    
                    // Close the connection
                    db.end();
                });
            });
        });
    });
}); 