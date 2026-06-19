# SignFlow – Digital Document Signature Platform

## Overview

SignFlow is a full-stack digital signature platform that enables users to upload PDF documents, place signatures, generate public signing links, and securely download signed PDFs.

The platform streamlines the document signing process by allowing both internal users and external signers to collaborate through secure, token-based signing links.

---

## Features

### Authentication

* User Registration
* User Login
* JWT Authentication

### Document Management

* Upload PDF Documents
* View Document Library
* PDF Preview
* Delete Documents

### Digital Signatures

* Upload Signature Images
* Place Signatures on PDFs
* Delete Incorrectly Placed Signatures
* Store Signature Coordinates

### Public Signing Portal

* Generate Public Signing Links
* Token-Based Access
* External Signer Workflow
* Signer Name & Email Collection

### PDF Processing

* Generate Signed PDFs
* Download Signed PDFs
* Coordinate-Based Signature Placement

### Activity Tracking

* Audit Logs
* Public Link Management
* Signing Activity Monitoring

---

## Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* React Router
* React PDF

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas
* Mongoose

### Authentication

* JWT (JSON Web Tokens)
* bcryptjs

### PDF Processing

* PDF-Lib

### File Uploads

* Multer

---

## System Workflow

1. User uploads a PDF document.
2. User places signatures on the document.
3. User generates a public signing link.
4. External signer opens the link.
5. Signer uploads a signature image.
6. Signer signs the document.
7. System generates a signed PDF.
8. Signed document can be viewed and downloaded.

---

## Project Structure

frontend/

* React
* Tailwind CSS
* React Router
* React PDF

backend/

* Express.js
* MongoDB
* JWT Authentication
* PDF Processing APIs

---

## Installation

### Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/SignFlow-document-signature-app.git
cd SignFlow-document-signature-app
```

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

## Future Enhancements

* Email-Based Signing Invitations
* Multi-Signer Workflows
* Role-Based Access Control
* Link Expiration Management
* Multi-Page Signature Placement
* Cloud Storage Integration

---

## Author

Manya Chourasiya

B.Tech Computer Science Engineering

SignFlow was developed as a secure digital document signing solution demonstrating full-stack development, authentication, PDF processing, and secure document workflows.
