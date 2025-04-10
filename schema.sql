CREATE TABLE IF NOT EXISTS permits (
  id SERIAL PRIMARY KEY,
  confirmation_id VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  country VARCHAR(255) NOT NULL,
  address TEXT,
  visit_purpose TEXT,
  visit_duration VARCHAR(255),
  valid_from TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  passport_photo_url TEXT NOT NULL,
  id_document_url TEXT NOT NULL,
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
