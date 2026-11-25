CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO employees (name, email, department)
VALUES
    ('John Smith', 'john@example.com', 'Engineering'),
    ('David Kumar', 'david@example.com', 'DevOps'),
    ('Sarah Wilson', 'sarah@example.com', 'Finance')
ON CONFLICT (email) DO NOTHING;
