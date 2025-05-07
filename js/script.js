import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDnGd2bL9KkJK0dxe3G18aeghS6_usPBs0",
    authDomain: "api-web-441f1.firebaseapp.com",
    databaseURL: "https://api-web-441f1-default-rtdb.firebaseio.com",
    projectId: "api-web-441f1",
    storageBucket: "api-web-441f1.firebasestorage.app",
    messagingSenderId: "612614714541",
    appId: "1:612614714541:web:fa149e1837190e96994224",
    measurementId: "G-7805C8ZS5W"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const API_URL = "http://localhost:3000"; // URL da sua API

const headers = {
    "Content-Type": "application/json",
    username: "admin", // Substitua pelo username correto
    password: "admin123", // Substitua pela senha correta
};

async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`, { headers });
        if (!response.ok) {
            throw new Error("Erro ao buscar produtos");
        }
        const products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error(error);
    }
}

function displayProducts(products) {
    const productsGrid = document.querySelector(".products-grid");
    productsGrid.innerHTML = ""; // Limpa os produtos existentes
    products.forEach((product) => {
        const productCard = `
            <div class="product-card">
                <img src="${product.photo}" alt="${product.name}" class="product-img">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">R$ ${product.price.toFixed(2)}</p>
                <button type="button" class="add-to-cart-btn" data-id="${product.id}">ADICIONAR AO CARRINHO</button>
            </div>
        `;
        productsGrid.innerHTML += productCard;
    });
}

document.getElementById("add-product-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("product-name").value;
    const price = parseFloat(document.getElementById("product-price").value);
    const description = document.getElementById("product-description").value;
    const photo = document.getElementById("product-photo").value;

    const newProduct = { name, price, description, photo };

    try {
        const response = await fetch(`${API_URL}/products`, {
            method: "POST",
            headers,
            body: JSON.stringify(newProduct),
        });

        if (!response.ok) {
            throw new Error("Erro ao adicionar produto");
        }

        alert("Produto adicionado com sucesso!");
        fetchProducts(); // Atualiza a lista de produtos
    } catch (error) {
        console.error(error);
        alert("Erro ao adicionar produto");
    }
});

// Chama a função ao carregar a página
fetchProducts();