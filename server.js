const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

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
    console.log('Connected to MySQL database');
    createTables();
});

// Create tables if they don't exist
function createTables() {
    const createContactsTable = `
        CREATE TABLE IF NOT EXISTS contacts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            status ENUM('pending', 'replied') DEFAULT 'pending',
            date DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    const createRepliesTable = `
        CREATE TABLE IF NOT EXISTS replies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            contact_id INT NOT NULL,
            message TEXT NOT NULL,
            date DATETIME DEFAULT CURRENT_TIMESTAMP,
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
    });
}

// API Routes

// Get all contacts with pagination and filtering
app.get('/api/contacts', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || 'all';
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM contacts';
    let countQuery = 'SELECT COUNT(*) as total FROM contacts';
    const conditions = [];
    const params = [];

    if (status !== 'all') {
        conditions.push('status = ?');
        params.push(status);
    }

    if (search) {
        conditions.push('(name LIKE ? OR email LIKE ? OR message LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
        countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY date DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    db.query(countQuery, params.slice(0, -2), (err, countResult) => {
        if (err) {
            console.error('Error counting contacts:', err);
            res.status(500).json({ error: 'Error counting contacts' });
            return;
        }

        db.query(query, params, (err, results) => {
            if (err) {
                console.error('Error fetching contacts:', err);
                res.status(500).json({ error: 'Error fetching contacts' });
                return;
            }

            res.json({
                contacts: results,
                total: countResult[0].total
            });
        });
    });
});

// Get a single contact with replies
app.get('/api/contacts/:id', (req, res) => {
    const contactId = req.params.id;

    db.query(
        'SELECT * FROM contacts WHERE id = ?',
        [contactId],
        (err, contactResult) => {
            if (err) {
                console.error('Error fetching contact:', err);
                res.status(500).json({ error: 'Error fetching contact' });
                return;
            }

            if (contactResult.length === 0) {
                res.status(404).json({ error: 'Contact not found' });
                return;
            }

            db.query(
                'SELECT * FROM replies WHERE contact_id = ? ORDER BY date DESC',
                [contactId],
                (err, repliesResult) => {
                    if (err) {
                        console.error('Error fetching replies:', err);
                        res.status(500).json({ error: 'Error fetching replies' });
                        return;
                    }

                    res.json({
                        contact: contactResult[0],
                        replies: repliesResult
                    });
                }
            );
        }
    );
});

// Add a new contact
app.post('/api/contacts', (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }

    db.query(
        'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)',
        [name, email, message],
        (err, result) => {
            if (err) {
                console.error('Error adding contact:', err);
                res.status(500).json({ error: 'Error adding contact' });
                return;
            }

            res.status(201).json({
                id: result.insertId,
                message: 'Contact added successfully'
            });
        }
    );
});

// Add a reply to a contact
app.post('/api/contacts/:id/reply', (req, res) => {
    const contactId = req.params.id;
    const { message } = req.body;

    if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
    }

    // Start a transaction
    db.beginTransaction((err) => {
        if (err) {
            console.error('Error starting transaction:', err);
            res.status(500).json({ error: 'Error starting transaction' });
            return;
        }

        // Add the reply
        db.query(
            'INSERT INTO replies (contact_id, message) VALUES (?, ?)',
            [contactId, message],
            (err, result) => {
                if (err) {
                    db.rollback(() => {
                        console.error('Error adding reply:', err);
                        res.status(500).json({ error: 'Error adding reply' });
                    });
                    return;
                }

                // Update contact status
                db.query(
                    'UPDATE contacts SET status = "replied" WHERE id = ?',
                    [contactId],
                    (err) => {
                        if (err) {
                            db.rollback(() => {
                                console.error('Error updating contact status:', err);
                                res.status(500).json({ error: 'Error updating contact status' });
                            });
                            return;
                        }

                        // Commit the transaction
                        db.commit((err) => {
                            if (err) {
                                db.rollback(() => {
                                    console.error('Error committing transaction:', err);
                                    res.status(500).json({ error: 'Error committing transaction' });
                                });
                                return;
                            }

                            res.status(201).json({
                                id: result.insertId,
                                message: 'Reply added successfully'
                            });
                        });
                    }
                );
            }
        );
    });
});

// Delete a contact
app.delete('/api/contacts/:id', (req, res) => {
    const contactId = req.params.id;

    db.query(
        'DELETE FROM contacts WHERE id = ?',
        [contactId],
        (err, result) => {
            if (err) {
                console.error('Error deleting contact:', err);
                res.status(500).json({ error: 'Error deleting contact' });
                return;
            }

            if (result.affectedRows === 0) {
                res.status(404).json({ error: 'Contact not found' });
                return;
            }

            res.json({ message: 'Contact deleted successfully' });
        }
    );
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 