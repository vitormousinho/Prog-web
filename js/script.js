import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const API_URL = process.env.API_URL || "http://localhost:3001";

// Função para obter o token de autenticação
function getAuthToken() {
    return localStorage.getItem('token');
}

// Função para verificar se o usuário está autenticado
function isAuthenticated() {
    return !!getAuthToken();
}

// Função para redirecionar para login se não estiver autenticado
function checkAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

async function fetchProducts() {
    if (!checkAuth()) return;

    try {
        const response = await fetch(`${API_URL}/products`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token expirado ou inválido
                logout();
                return;
            }
            throw new Error("Erro ao buscar produtos");
        }

        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Erro:', error);
        showError('Erro ao carregar produtos');
    }
}

function displayProducts(products) {
    const productsGrid = document.querySelector(".products-grid");
    if (!productsGrid) return;

    productsGrid.innerHTML = ""; // Limpa os produtos existentes
    
    if (!products || products.length === 0) {
        productsGrid.innerHTML = '<p class="no-products">Nenhum produto encontrado</p>';
        return;
    }

    products.forEach((product) => {
        const productCard = `
            <div class="product-card">
                <img src="${product.photo || 'placeholder.jpg'}" alt="${product.name}" class="product-img">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">R$ ${product.price.toFixed(2)}</p>
                <p class="product-description">${product.description || ''}</p>
                <button type="button" class="add-to-cart-btn" data-id="${product.id}">ADICIONAR AO CARRINHO</button>
            </div>
        `;
        productsGrid.innerHTML += productCard;
    });
}

// Função para mostrar mensagens de erro
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}

// Função para mostrar mensagens de sucesso
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 5000);
}

// Adiciona produto (apenas para admin)
document.getElementById("add-product-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!checkAuth()) return;

    const name = document.getElementById("product-name").value;
    const price = parseFloat(document.getElementById("product-price").value);
    const description = document.getElementById("product-description").value;
    const photo = document.getElementById("product-photo").value;

    if (!name || !price) {
        showError('Nome e preço são obrigatórios');
        return;
    }

    const newProduct = { name, price, description, photo };

    try {
        const response = await fetch(`${API_URL}/products`, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newProduct),
        });

        if (!response.ok) {
            if (response.status === 401) {
                logout();
                return;
            }
            throw new Error("Erro ao adicionar produto");
        }

        showSuccess("Produto adicionado com sucesso!");
        event.target.reset();
        fetchProducts();
    } catch (error) {
        console.error('Erro:', error);
        showError("Erro ao adicionar produto");
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        fetchProducts();
    }
});