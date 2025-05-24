require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Validação das variáveis de ambiente
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
    console.error('Variáveis de ambiente do Firebase não configuradas');
    process.exit(1);
}

// Inicialização do Firebase Admin com tratamento de erro
try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL
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
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const snapshot = await db.ref(`users/${decoded.uid}`).once('value');
        const user = snapshot.val();
        
        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }
        
        req.user = { ...user, uid: decoded.uid };
        next();
    } catch (error) {
        console.error('Erro na autenticação:', error);
        res.status(401).json({ error: 'Token inválido' });
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
        return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    try {
        const snapshot = await db.ref('users').once('value');
        const users = snapshot.val();
        const userExists = Object.values(users).some(u => u.username === username);
        
        if (userExists) {
            return res.status(400).json({ error: 'Nome de usuário já existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            username,
            password: hashedPassword,
            isAdmin: false,
            favorites: [], // Array para armazenar IDs dos produtos favoritos
            cart: [], // Array para armazenar itens do carrinho
            createdAt: admin.database.ServerValue.TIMESTAMP
        };

        const ref = db.ref('users').push();
        await ref.set(newUser);
        res.status(201).json({ message: 'Usuário registrado com sucesso' });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const snapshot = await db.ref('users').once('value');
        const users = snapshot.val();
        const userEntry = Object.entries(users).find(([_, u]) => u.username === username);
        
        if (!userEntry) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const [uid, user] = userEntry;
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { uid, username: user.username, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            message: 'Login realizado com sucesso',
            token,
            user: {
                username: user.username,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
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
    const { name, price, description, photo, tags, desconto } = req.body;
    if (!name || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const newProduct = { 
        name, 
        price, 
        description, 
        photo,
        rate: 0, // Inicializa com 0 estrelas
        votes: 0, // Inicializa com 0 votos
        tags: tags || [], // Lista de tags
        desconto: desconto || 0, // Porcentagem de desconto
        createdAt: admin.database.ServerValue.TIMESTAMP
    };
    try {
        const ref = db.ref('products').push();
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
    const { name, price, description, photo, tags, desconto } = req.body;
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
            ...(tags && { tags }),
            ...(desconto !== undefined && { desconto }),
            updatedAt: admin.database.ServerValue.TIMESTAMP
        };
        await productRef.set(updatedProduct);
        res.json({ message: 'Product updated', product: updatedProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Nova rota para atualizar a avaliação do produto (público)
app.put('/products/:id/rate', async (req, res) => {
    const { id } = req.params;
    const { rate } = req.body;
    
    if (rate < 0 || rate > 5) {
        return res.status(400).json({ error: 'Avaliação deve estar entre 0 e 5' });
    }

    try {
        const productRef = db.ref(`products/${id}`);
        const snapshot = await productRef.once('value');
        if (!snapshot.exists()) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const product = snapshot.val();
        const currentVotes = product.votes || 0;
        const currentRate = product.rate || 0;
        
        // Calcula a nova média
        const newVotes = currentVotes + 1;
        const newRate = ((currentRate * currentVotes) + rate) / newVotes;
        
        const updatedProduct = {
            ...product,
            rate: Number(newRate.toFixed(1)), // Arredonda para 1 casa decimal
            votes: newVotes
        };
        
        await productRef.set(updatedProduct);
        res.json({ 
            message: 'Avaliação atualizada', 
            product: updatedProduct 
        });
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

// Rota para listar todos os produtos (público ou autenticado, como preferir)
app.get('/products', async (req, res) => {
    try {
        const snapshot = await db.ref('products').once('value');
        const productsObj = snapshot.val() || {};
        // Transforma o objeto em array e inclui o id
        const products = Object.entries(productsObj).map(([id, prod]) => ({
            id,
            ...prod
        }));
        res.json({ products });
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
});

// Nova rota para gerenciar favoritos
app.post('/users/favorites', authenticate, async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.uid;

    try {
        const userRef = db.ref(`users/${userId}`);
        const snapshot = await userRef.once('value');
        const user = snapshot.val();

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const favorites = user.favorites || [];
        const isFavorite = favorites.includes(productId);

        if (isFavorite) {
            // Remove dos favoritos
            const newFavorites = favorites.filter(id => id !== productId);
            await userRef.update({ favorites: newFavorites });
            res.json({ message: 'Produto removido dos favoritos', isFavorite: false });
        } else {
            // Adiciona aos favoritos
            favorites.push(productId);
            await userRef.update({ favorites });
            res.json({ message: 'Produto adicionado aos favoritos', isFavorite: true });
        }
    } catch (error) {
        console.error('Erro ao atualizar favoritos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para obter favoritos do usuário
app.get('/users/favorites', authenticate, async (req, res) => {
    const userId = req.user.uid;

    try {
        const snapshot = await db.ref(`users/${userId}`).once('value');
        const user = snapshot.val();

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ favorites: user.favorites || [] });
    } catch (error) {
        console.error('Erro ao buscar favoritos:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para gerenciar carrinho
app.post('/users/cart', authenticate, async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.uid;

    try {
        const userRef = db.ref(`users/${userId}`);
        const snapshot = await userRef.once('value');
        const user = snapshot.val();

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const cart = user.cart || [];
        const isInCart = cart.includes(productId);

        if (isInCart) {
            // Remove do carrinho
            const newCart = cart.filter(id => id !== productId);
            await userRef.update({ cart: newCart });
            res.json({ message: 'Produto removido do carrinho', isInCart: false });
        } else {
            // Adiciona ao carrinho
            cart.push(productId);
            await userRef.update({ cart });
            res.json({ message: 'Produto adicionado ao carrinho', isInCart: true });
        }
    } catch (error) {
        console.error('Erro ao atualizar carrinho:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para obter carrinho do usuário
app.get('/users/cart', authenticate, async (req, res) => {
    const userId = req.user.uid;

    try {
        const snapshot = await db.ref(`users/${userId}`).once('value');
        const user = snapshot.val();

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({ cart: user.cart || [] });
    } catch (error) {
        console.error('Erro ao buscar carrinho:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para esvaziar o carrinho do usuário
app.post('/users/cart/clear', authenticate, async (req, res) => {
    const userId = req.user.uid;
    try {
        const userRef = db.ref(`users/${userId}`);
        await userRef.update({ cart: [] });
        res.json({ message: 'Carrinho esvaziado com sucesso' });
    } catch (error) {
        console.error('Erro ao esvaziar carrinho:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
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