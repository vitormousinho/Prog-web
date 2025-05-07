require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./config/serviceAccountKey.json');

// Inicialização do Firebase Admin com tratamento de erro
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://api-web-441f1-default-rtdb.firebaseio.com"
    });
    console.log('Firebase Admin inicializado com sucesso');
} catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
    process.exit(1);
}

const db = admin.database();
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Middleware de autenticação
async function authenticate(req, res, next) {
    const { username, password } = req.headers;
    try {
        const snapshot = await db.ref('users').once('value');
        const users = snapshot.val();
        const user = Object.values(users).find(
            (u) => u.username === username && u.password === password
        );
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.user = user;
        next();
    } catch (error) {
        console.error('Erro na autenticação:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Admin authorization middleware
function authorizeAdmin(req, res, next) {
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
}

// Rota de registro público
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const snapshot = await db.ref('users').once('value');
        const users = snapshot.val();
        const userExists = Object.values(users).some(u => u.username === username);
        
        if (userExists) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const newUser = {
            username,
            password,
            isAdmin: false
        };

        const ref = db.ref('users').push();
        await ref.set(newUser);
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const snapshot = await db.ref('users').once('value');
        const users = snapshot.val();
        const user = Object.values(users).find(
            (u) => u.username === username && u.password === password
        );
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ message: 'Login successful', user });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create new user (admin only)
app.post('/users', authenticate, authorizeAdmin, async (req, res) => {
    const { username, password, isAdmin } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const newUser = {
        username,
        password,
        isAdmin: isAdmin || false
    };
    try {
        const ref = db.ref('users').push();
        await ref.set(newUser);
        res.status(201).json({ message: 'User created', user: newUser });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Rota para adicionar produtos corrigida
app.post('/products', authenticate, authorizeAdmin, async (req, res) => {
    const { name, price, description, photo } = req.body;
    if (!name || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const newProduct = { name, price, description, photo };
    try {
        const ref = db.ref('products').push(); // Para Realtime Database
        await ref.set(newProduct);
        res.status(201).json({ message: 'Product added', product: newProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Edit product (admin only)
app.put('/products/:id', authenticate, authorizeAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, price, description, photo } = req.body;
    try {
        const productRef = db.ref(`products/${id}`);
        const snapshot = await productRef.once('value');
        if (!snapshot.exists()) {
            return res.status(404).json({ error: 'Product not found' });
        }
        const updatedProduct = {
            ...snapshot.val(),
            ...(name && { name }),
            ...(price && { price }),
            ...(description && { description }),
            ...(photo && { photo }),
        };
        await productRef.set(updatedProduct);
        res.json({ message: 'Product updated', product: updatedProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete product (admin only)
app.delete('/products/:id', authenticate, authorizeAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const productRef = db.ref(`products/${id}`);
        const snapshot = await productRef.once('value');
        if (!snapshot.exists()) {
            return res.status(404).json({ error: 'Product not found' });
        }
        await productRef.remove();
        res.json({ message: 'Product deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Promessa rejeitada não tratada:', error);
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`API rodando em http://localhost:${port}`);
    console.log('Pressione Ctrl+C para encerrar o servidor');
});