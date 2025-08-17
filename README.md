# 🛡️ FHE Playground – Encrypted Computation Simulator

This project simulates Fully Homomorphic Encryption (FHE) using modern symmetric encryption (AES-GCM) to demonstrate how encrypted data can be **processed without exposing the raw data**.

It is designed to show the concept:  
**Encrypt → Compute → Decrypt** – similar to how FHE works in theory, but using practical cryptography and Web APIs.

---

##  Project Purpose

The goal is to help developers and learners understand:

- How encrypted client data can be sent to a server.
- How a server can operate on that data without seeing the plaintext.
- How the results are sent back encrypted to be decrypted only on the client side.

This mimics real-world privacy-preserving systems (like medical or financial data processing), and explains the idea behind FHE – using a simpler and practical stack.

---

##  How It Works

### 1. 🔒 On the **client side**:
- The user enters two numbers and selects an operation (add, multiply, average).
- The input is encrypted **in the browser** using WebCrypto (AES-GCM).
- The encrypted payload is sent to the server (`/compute` route).

### 2. 🖥️ On the **server side** (Flask):
- The server receives the encrypted payload, decrypts it using the AES key.
- It performs the computation **on the decrypted data**.
- It then re-encrypts the result and sends it back.

### 3. 🔓 On the **client side** again:
- The encrypted result is decrypted in the browser.
- The final value is displayed to the user.

At no point is the raw input or result exposed on the network or stored unencrypted on the server.

---

##  Tech Stack

### 🔧 Backend (Python + Flask)
- **Flask**: Lightweight REST server
- **cryptography**: AES-GCM encryption/decryption
- **dotenv**: Manage AES key via `.env`
- Route:  
  - `POST /compute` → Decrypt → Compute → Encrypt → Return
  - `GET /health` → Simple liveness check

###  Frontend (React + Vite)
- **React** (with hooks like `useState` and `useEffect`)
- **Vite**: Fast development server with proxy config
- **WebCrypto**: Client-side AES-GCM
- Live simulation of encryption and computation flow

---

##  Encryption Details

- **AES-GCM (Galois/Counter Mode)**:  
  - Provides both confidentiality and integrity.
  - IV (Initialization Vector): 12 bytes (randomly generated)
  - Tag: 16 bytes (appended and split)
- **Key Management**:
  - Shared AES key (Base64) is stored in `.env` file on both client and server.
  - Not suitable for production (for demo only).

---

##  Example Payload

Encrypted request to server:

```json
{
  "payload": {
    "iv": "b64...",
    "ct": "b64...",
    "tag": "b64..."
  }
}
