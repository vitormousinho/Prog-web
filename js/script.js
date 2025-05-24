let allProducts = [];
let currentSearchToken = 0;
let currentCategoryToken = 0;

const API_URL = 'http://localhost:3001';

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

// Função para buscar produtos em destaque (mais recentes)
async function fetchFeaturedProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        if (response.ok && Array.isArray(data.products)) {
            // Ordena por data de edição (updatedAt) ou criação (createdAt), mais recentes primeiro
            const sortedProducts = data.products.sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt || 0);
                const dateB = new Date(b.updatedAt || b.createdAt || 0);
                return dateB - dateA;
            });
            const featuredProducts = sortedProducts.slice(0, 4);
            displayProducts(featuredProducts, 'featured-products');
        }
    } catch (error) {
        console.error('Erro ao buscar produtos em destaque:', error);
    }
}

// Função para buscar produtos populares (melhor avaliados)
async function fetchPopularProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        if (response.ok && Array.isArray(data.products)) {
            // Ordena por rate decrescente, depois por votes decrescente
            const sortedProducts = data.products.sort((a, b) => {
                const rateA = a.rate || 0;
                const rateB = b.rate || 0;
                const votesA = a.votes || 0;
                const votesB = b.votes || 0;
                if (rateB !== rateA) {
                    return rateB - rateA;
                } else {
                    return votesB - votesA;
                }
            });
            const popularProducts = sortedProducts.slice(0, 4);
            displayProducts(popularProducts, 'popular-products');
        }
    } catch (error) {
        console.error('Erro ao buscar produtos populares:', error);
    }
}

// Função para carregar favoritos do usuário
async function loadFavorites() {
    if (!isAuthenticated()) return [];
    
    try {
        const response = await fetch(`${API_URL}/users/favorites`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar favoritos');
        }
        
        const data = await response.json();
        return data.favorites || [];
    } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
        return [];
    }
}

// Função para atualizar contadores no header
function updateHeaderCounters(favoritesCount, cartCount) {
    const favoritesCounter = document.querySelector('.wishlist .counter');
    const cartCounter = document.querySelector('.cart .counter');
    
    if (favoritesCounter) {
        favoritesCounter.textContent = favoritesCount;
    }
    if (cartCounter) {
        cartCounter.textContent = cartCount;
    }
}

// Função para carregar carrinho do usuário
async function loadCart() {
    if (!isAuthenticated()) return [];
    
    try {
        const response = await fetch(`${API_URL}/users/cart`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar carrinho');
        }
        
        const data = await response.json();
        return data.cart || [];
    } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        return [];
    }
}

// Função para alternar carrinho
async function toggleCart(productId, button) {
    if (!isAuthenticated()) {
        showError('Faça login para adicionar produtos ao carrinho');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/cart`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId })
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar carrinho');
        }

        const data = await response.json();
        
        if (button) {
            if (data.isInCart) {
                button.textContent = 'Retirar do carrinho';
                button.classList.add('in-cart');
            } else {
                button.textContent = 'Adicionar ao carrinho';
                button.classList.remove('in-cart');
            }
        }

        // Atualiza contador do carrinho
        const cart = await loadCart();
        const favorites = await loadFavorites();
        updateHeaderCounters(favorites.length, cart.length);
    } catch (error) {
        console.error('Erro ao atualizar carrinho:', error);
        showError('Erro ao atualizar carrinho');
    }
}

// Função para alternar favorito atualizada
async function toggleFavorite(productId, button) {
    if (!isAuthenticated()) {
        showError('Faça login para favoritar produtos');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/favorites`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productId })
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar favorito');
        }

        const data = await response.json();
        if (button) {
            const icon = button.querySelector('i');
            if (data.isFavorite) {
                icon.classList.remove('fa-regular');
                icon.classList.add('fas');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('fa-regular');
            }
        }
        // Atualiza contador de favoritos
        const favorites = await loadFavorites();
        const cart = await loadCart();
        updateHeaderCounters(favorites.length, cart.length);
    } catch (error) {
        console.error('Erro ao atualizar favorito:', error);
        showError('Erro ao atualizar favorito');
    }
}

// Função para exibir produtos atualizada
async function displayProducts(products, sectionId) {
    const container = document.getElementById(sectionId);
    if (!container) return;
    
    // Limpa o container antes de adicionar novos cards
    container.innerHTML = '';

    if (!products || products.length === 0) {
        container.innerHTML = '<p class="no-products">Nenhum produto encontrado</p>';
        return;
    }

    // Carrega favoritos e carrinho do usuário
    const favorites = await loadFavorites();
    const cart = await loadCart();

    // Atualiza contadores no header
    updateHeaderCounters(favorites.length, cart.length);

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const precoOriginal = Number(product.price);
        const precoComDesconto = product.desconto ? precoOriginal * (1 - product.desconto/100) : precoOriginal;
        const stars = '★'.repeat(Math.floor(product.rate || 0)) + '☆'.repeat(5 - Math.floor(product.rate || 0));
        
        const isFavorite = favorites.includes(product.id);
        const isInCart = cart.includes(product.id);
        const heartIcon = isFavorite ? 'fas fa-heart' : 'fa-regular fa-heart';
        const cartButtonText = isInCart ? 'Retirar do carrinho' : 'Adicionar ao carrinho';
        const cartButtonClass = isInCart ? 'add-to-cart-btn in-cart' : 'add-to-cart-btn';
        
        card.innerHTML = `
            <div class="product-image-area">
                <button class="favorite-btn" data-id="${product.id}" title="Favoritar">
                    <i class="${heartIcon}"></i>
                </button>
                <img src="${product.photo || '../img/no-image.png'}" alt="${product.name}" class="product-img">
            </div>
            <div class="product-info-area">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-rating">
                    <span class="stars">${stars}</span>
                    <span class="votes">(${product.votes || 0} votos)</span>
                </div>
                <div class="product-price-row">
                    ${product.desconto ? `<span class="original-price">R$ ${precoOriginal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>` : ''}
                    ${product.desconto ? `<span class="discount-badge">-${product.desconto}%</span>` : ''}
                </div>
                <div class="product-price-row">
                    <span class="current-price">R$ ${precoComDesconto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
            </div>
            <button type="button" class="${cartButtonClass}" data-id="${product.id}">${cartButtonText}</button>
        `;
        
        // Adiciona eventos de clique
        const favoriteBtn = card.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleFavorite(product.id, favoriteBtn);
        });

        const cartBtn = card.querySelector('.add-to-cart-btn');
        cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleCart(product.id, cartBtn);
        });
        
        container.appendChild(card);
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

// Função para alternar o tema
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.querySelector('#theme-toggle i');
    const isDark = body.classList.contains('dark-theme');
    
    body.classList.toggle('dark-theme');
    body.classList.toggle('light-theme');
    
    if (isDark) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        localStorage.setItem('theme', 'light');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
        localStorage.setItem('theme', 'dark');
    }
}

// Função para carregar o tema salvo
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const body = document.body;
    const themeIcon = document.querySelector('#theme-toggle i');
    
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        body.classList.remove('light-theme');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    } else {
        body.classList.add('light-theme');
        body.classList.remove('dark-theme');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM carregado');
    
    // Configuração do tema
    loadSavedTheme();
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Carrega os produtos
    await fetchAllProductsAndStore();
    fetchFeaturedProducts();
    fetchPopularProducts();

    // Adiciona evento para os links do main-menu
    const mainMenuButtons = document.querySelectorAll('.main-menu a');
    mainMenuButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const category = button.getAttribute('data-category');
            showFilteredSection(category);
        });
    });

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterProductsBySearch(e.target.value);
        });
    }

    // Redireciona para index.html ao clicar no logo
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }

    const departmentsBtn = document.getElementById('departments-toggle');
    const departmentsMenu = document.getElementById('departments-menu');
    if (departmentsBtn && departmentsMenu) {
        departmentsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            departmentsMenu.classList.toggle('open');
        });
        // Fecha o menu ao clicar fora
        document.addEventListener('click', function(e) {
            if (!departmentsMenu.contains(e.target) && !departmentsBtn.contains(e.target)) {
                departmentsMenu.classList.remove('open');
            }
        });
    }
});

// Abrir/fechar menus laterais
function openSidebar(type) {
    closeSidebar(type === 'favorites' ? 'cart' : 'favorites');
    document.getElementById(type + '-sidebar').classList.add('open');
    if (type === 'favorites') renderFavoritesSidebar();
    if (type === 'cart') renderCartSidebar();
}
function closeSidebar(type) {
    document.getElementById(type + '-sidebar').classList.remove('open');
}

// Botões do header
document.querySelector('.wishlist')?.addEventListener('click', e => {
    e.preventDefault();
    openSidebar('favorites');
});
document.querySelector('.cart')?.addEventListener('click', e => {
    e.preventDefault();
    openSidebar('cart');
});

// Renderizar favoritos no menu lateral
async function renderFavoritesSidebar() {
    const favoritesList = document.getElementById('favorites-list');
    favoritesList.innerHTML = '<p>Carregando...</p>';
    const favorites = await loadFavorites();
    const allProducts = await fetchAllProducts();
    const cart = await loadCart();

    if (!favorites.length) {
        favoritesList.innerHTML = '<p>Nenhum favorito.</p>';
        return;
    }

    favoritesList.innerHTML = '';
    favorites.forEach(id => {
        const product = allProducts.find(p => p.id === id);
        if (!product) return;
        const isInCart = cart.includes(product.id);
        const stars = '★'.repeat(Math.floor(product.rate || 0)) + '☆'.repeat(5 - Math.floor(product.rate || 0));
        const div = document.createElement('div');
        div.className = 'sidebar-product';
        div.innerHTML = `
            <img src="${product.photo || '../img/no-image.png'}" alt="${product.name}">
            <div class="sidebar-product-info">
                <div class="sidebar-product-title">${product.name}</div>
                <div class="sidebar-product-rating">${stars}</div>
                <div class="sidebar-product-price">R$ ${Number(product.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="sidebar-product-actions">
                    <button class="add-cart">${isInCart ? 'Retirar do carrinho' : 'Adicionar ao carrinho'}</button>
                    <button class="remove-favorite">Remover</button>
                </div>
            </div>
        `;
        // Eventos
        div.querySelector('.add-cart').onclick = () => toggleCart(product.id, div.querySelector('.add-cart'));
        div.querySelector('.remove-favorite').onclick = async () => {
            // Remove dos favoritos
            await toggleFavorite(product.id, null);
            // Atualiza o menu lateral de favoritos
            renderFavoritesSidebar();
            // Atualiza todos os corações dos cards principais
            updateAllFavoriteIcons();
        };
        favoritesList.appendChild(div);
    });
}

// Renderizar carrinho no menu lateral
async function renderCartSidebar() {
    const cartList = document.getElementById('cart-list');
    const cartSummary = document.getElementById('cart-summary');
    cartList.innerHTML = '<p>Carregando...</p>';
    cartSummary.innerHTML = '';
    const cart = await loadCart();
    const allProducts = await fetchAllProducts();

    if (!cart.length) {
        cartList.innerHTML = '<p>Carrinho vazio.</p>';
        cartSummary.innerHTML = '';
        return;
    }

    cartList.innerHTML = '';
    let total = 0, totalDesconto = 0, totalFinal = 0;
    cart.forEach(id => {
        const product = allProducts.find(p => p.id === id);
        if (!product) return;
        const precoOriginal = Number(product.price);
        const precoComDesconto = product.desconto ? precoOriginal * (1 - product.desconto/100) : precoOriginal;
        const desconto = product.desconto ? precoOriginal - precoComDesconto : 0;
        total += precoOriginal;
        totalDesconto += desconto;
        totalFinal += precoComDesconto;
        const stars = '★'.repeat(Math.floor(product.rate || 0)) + '☆'.repeat(5 - Math.floor(product.rate || 0));
        const div = document.createElement('div');
        div.className = 'sidebar-product';
        div.innerHTML = `
            <img src="${product.photo || '../img/no-image.png'}" alt="${product.name}">
            <div class="sidebar-product-info">
                <div class="sidebar-product-title">${product.name}</div>
                <div class="sidebar-product-rating">${stars}</div>
                <div class="sidebar-product-price">R$ ${precoComDesconto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                <div class="sidebar-product-actions">
                    <button class="remove-cart">Remover do carrinho</button>
                </div>
            </div>
        `;
        div.querySelector('.remove-cart').onclick = async () => {
            await toggleCart(product.id, null);
            renderCartSidebar();
            updateAllCartButtons();
        };
        cartList.appendChild(div);
    });

    cartSummary.innerHTML = `
        <div class="cart-summary-row"><span>Total sem desconto:</span><span>R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
        <div class="cart-summary-row"><span>Total de desconto:</span><span>- R$ ${totalDesconto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
        <div class="cart-summary-total"><span>Total final:</span> <span>R$ ${totalFinal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></div>
        <button class="confirm-purchase-btn">Confirmar compra</button>
    `;
    cartSummary.querySelector('.confirm-purchase-btn').onclick = async () => {
        alert('Compra confirmada! (implemente a lógica de compra aqui)');
        await clearCart();
        renderCartSidebar();
        // Atualiza contadores no header
        const favorites = await loadFavorites();
        const cart = await loadCart();
        updateHeaderCounters(favorites.length, cart.length);
        // Atualiza todos os botões de carrinho nos cards principais
        updateAllCartButtons();
    };
}

// Função para buscar todos os produtos (auxiliar para os menus laterais)
async function fetchAllProducts() {
    const response = await fetch(`${API_URL}/products`);
    const data = await response.json();
    return data.products || [];
}

async function clearCart() {
    if (!isAuthenticated()) return;
    try {
        await fetch(`${API_URL}/users/cart/clear`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Erro ao esvaziar carrinho:', error);
    }
}

async function updateAllFavoriteIcons() {
    const favorites = await loadFavorites();
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const productId = btn.getAttribute('data-id');
        const icon = btn.querySelector('i');
        if (favorites.includes(productId)) {
            icon.classList.remove('fa-regular');
            icon.classList.add('fas');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('fa-regular');
        }
    });
    // Atualiza o contador no header
    const cart = await loadCart();
    updateHeaderCounters(favorites.length, cart.length);
}

async function updateAllCartButtons() {
    const cart = await loadCart();
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        const productId = btn.getAttribute('data-id');
        if (cart.includes(productId)) {
            btn.textContent = 'Retirar do carrinho';
            btn.classList.add('in-cart');
        } else {
            btn.textContent = 'Adicionar ao carrinho';
            btn.classList.remove('in-cart');
        }
    });
    // Atualiza o contador no header
    const favorites = await loadFavorites();
    updateHeaderCounters(favorites.length, cart.length);
}

// Função para filtrar produtos por categoria
async function filterProductsByCategory(category, containerId = 'featured-products') {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    // Controle de token para evitar duplicação
    currentCategoryToken++;
    const thisCategoryToken = currentCategoryToken;

    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        if (response.ok && Array.isArray(data.products)) {
            let products = data.products;
            // Mapeamento de categorias para tags
            const categoryToTag = {
                'promocoes': '#PROMOÇÕES',
                'pc-gamer': '#PC GAMER',
                'kit-upgrade': '#KIT UPGRADE',
                'hardware': '#HARDWARE',
                'notebooks': '#NOTEBOOKS',
                'monitores': '#MONITORES',
                'perifericos': '#PERIFÉRICOS',
                'cadeiras': '#CADEIRAS',
                'redes': '#REDES'
            };
            // Filtrar produtos pela tag correspondente à categoria
            const tagToFilter = categoryToTag[category];
            if (tagToFilter) {
                products = products.filter(p => p.tags && p.tags.includes(tagToFilter));
            }
            if (products.length === 0) {
                if (thisCategoryToken === currentCategoryToken) {
                    container.innerHTML = '<p class="no-results">Nenhum produto encontrado nesta categoria.</p>';
                }
                return;
            }
            if (thisCategoryToken !== currentCategoryToken) return;
            displayProducts(products, containerId);
        } else {
            container.innerHTML = '<p>Nenhum produto encontrado.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p>Erro ao carregar produtos.</p>';
    }
}

function showFilteredSection(category) {
    // Esconde todas as seções principais
    document.querySelector('.banner').style.display = 'none';
    document.querySelector('.featured-section').style.display = 'none';
    document.querySelector('.categories-section').style.display = 'none';
    document.querySelector('.promo-banners').style.display = 'none';
    document.querySelectorAll('.featured-section').forEach(sec => sec.style.display = 'none');
    document.querySelector('.newsletter').style.display = 'none';

    // Mostra a seção filtrada
    document.getElementById('filtered-section').style.display = 'block';

    // Filtra e exibe os produtos
    filterProductsByCategory(category, 'filtered-products');
}

function filterProductsBySearch(query) {
    query = query.trim().toLowerCase();
    const filteredSection = document.getElementById('filtered-section');
    const filteredProductsContainer = document.getElementById('filtered-products');
    filteredProductsContainer.innerHTML = '';

    // Gera um token único para esta busca
    currentSearchToken++;
    const thisSearchToken = currentSearchToken;

    if (!query) {
        filteredSection.style.display = 'none';
        document.querySelector('.banner').style.display = '';
        document.querySelector('.featured-section').style.display = '';
        document.querySelector('.categories-section').style.display = '';
        document.querySelector('.promo-banners').style.display = '';
        document.querySelectorAll('.featured-section').forEach(sec => sec.style.display = '');
        document.querySelector('.newsletter').style.display = '';
        return;
    }

    document.querySelector('.banner').style.display = 'none';
    document.querySelector('.featured-section').style.display = 'none';
    document.querySelector('.categories-section').style.display = 'none';
    document.querySelector('.promo-banners').style.display = 'none';
    document.querySelectorAll('.featured-section').forEach(sec => sec.style.display = 'none');
    document.querySelector('.newsletter').style.display = 'none';

    filteredSection.style.display = 'block';

    // Filtra usando startsWith
    const filtered = allProducts.filter(p =>
        (p.name && p.name.toLowerCase().startsWith(query)) ||
        (p.description && p.description.toLowerCase().startsWith(query)) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().startsWith(query)))
    );

    // Chama a exibição de forma assíncrona e só mostra se for a busca mais recente
    displayProducts(filtered, 'filtered-products').then(() => {
        if (thisSearchToken !== currentSearchToken) {
            // Se não for a busca mais recente, limpa o container
            filteredProductsContainer.innerHTML = '';
        }
    });
}

async function fetchAllProductsAndStore() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        if (response.ok && Array.isArray(data.products)) {
            allProducts = data.products;
        }
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
    }
}

function ajustarMenu() {
        const mainMenu = document.querySelector('.main-menu');
        const departamentosMenu = document.querySelector('#departments-menu ul');
        if (!mainMenu || !departamentosMenu) return;

        // Itens fixos do menu de departamentos (não mexer neles)
        const itensFixos = Array.from(departamentosMenu.querySelectorAll('li[data-fixo="true"]'));

        // Move todos os itens dinâmicos de volta para a main-menu antes de recalcular
        Array.from(departamentosMenu.querySelectorAll('li[data-dinamico="true"]')).forEach(li => {
            mainMenu.appendChild(li);
        });

        // Agora verifica se algum item da main-menu está fora da tela e move para departamentos
        const mainMenuItems = Array.from(mainMenu.children);
        const navLimite = mainMenu.parentElement.getBoundingClientRect().right;

        mainMenuItems.forEach(item => {
            // Pega o texto do link do item da main-menu
            const textoItem = item.textContent.trim().toUpperCase();

            // Verifica se já existe um item fixo com o mesmo texto no menu de departamentos
            const existeFixo = itensFixos.some(li => {
                const textoFixo = li.textContent.trim().toUpperCase();
                return textoFixo === textoItem;
            });

            // Só move se não existir como fixo
            if (!existeFixo && item.getBoundingClientRect().right > navLimite) {
                item.setAttribute('data-dinamico', 'true');
                departamentosMenu.appendChild(item);
            }
        });
    }

// Chame ao carregar e ao redimensionar
window.addEventListener('resize', ajustarMenu);
window.addEventListener('DOMContentLoaded', ajustarMenu);

// Função para detectar o tamanho da tela e ajustar o layout
function adjustLayoutForScreenSize() {
    const isMobile = window.innerWidth <= 768;
    const header = document.querySelector('header .container');
    const logo = document.querySelector('.logo');
    const searchBar = document.querySelector('.search-bar');
    const userLinks = document.querySelector('.user-links');
    const mainMenu = document.querySelector('.main-menu');
    const departmentsToggle = document.getElementById('departments-toggle');
    const departmentsMenu = document.getElementById('departments-menu');
    
    // Se não encontrar os elementos necessários, sai da função
    if (!header || !logo || !searchBar || !userLinks || !mainMenu || !departmentsToggle) {
        console.warn('Elementos necessários não encontrados no DOM');
        return;
    }
    
    // Reset da estrutura antes de aplicar as mudanças
    resetHeaderLayout();
    
    if (isMobile) {
        // Cria a estrutura para dispositivos móveis
        createMobileLayout(header, logo, searchBar, userLinks, departmentsToggle);
    } else {
        // Retorna para o layout desktop
        restoreDesktopLayout(header, logo, searchBar, userLinks, mainMenu, departmentsToggle);
    }
    
    // Atualiza o menu de departamentos
    ajustarMenu();
}

// Função para limpar classes e estruturas anteriores
function resetHeaderLayout() {
    // Remove elementos criados anteriormente se existirem
    const existingTopRow = document.querySelector('.header-top-row');
    const existingLogoIconsContainer = document.querySelector('.logo-icons-container');
    const existingHeaderIcons = document.querySelector('.header-icons');
    
    if (existingTopRow) {
        // Move os filhos de volta para o container original antes de remover
        const header = document.querySelector('header .container');
        while (existingTopRow.firstChild) {
            header.appendChild(existingTopRow.firstChild);
        }
        existingTopRow.remove();
    }
    
    if (existingLogoIconsContainer) {
        const parent = existingLogoIconsContainer.parentNode;
        while (existingLogoIconsContainer.firstChild) {
            parent.appendChild(existingLogoIconsContainer.firstChild);
        }
        existingLogoIconsContainer.remove();
    }
    
    if (existingHeaderIcons) {
        const parent = existingHeaderIcons.parentNode;
        while (existingHeaderIcons.firstChild) {
            parent.appendChild(existingHeaderIcons.firstChild);
        }
        existingHeaderIcons.remove();
    }
}

// JavaScript para reorganização responsiva da navbar do Recanto do Zé
document.addEventListener('DOMContentLoaded', function() {
    // Inicializa o sistema responsivo
    setupResponsiveHeader();
    
    // Adiciona evento de resize para ajustar quando o tamanho da tela mudar
    window.addEventListener('resize', debounce(function() {
        setupResponsiveHeader();
        handleSidePanels(); // Gerencia os painéis laterais no redimensionamento
    }, 250));
    
    // Configura funcionalidade do menu de departamentos
    setupDepartmentsMenu();
    
    // Configura comportamento dos menus laterais (carrinho e favoritos)
    setupSidePanels();
});

// Função de debounce para evitar múltiplas chamadas em sequência
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
}

// Configura o comportamento dos painéis laterais (favoritos e carrinho)
function setupSidePanels() {
    const wishlistToggle = document.querySelector('.wishlist');
    const cartToggle = document.querySelector('.cart');
    const wishlistPanel = document.getElementById('wishlist-panel');
    const cartPanel = document.getElementById('cart-panel');
    
    // Configurar comportamento para Favoritos
    if (wishlistToggle && wishlistPanel) {
        wishlistToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Verifica se não estamos em tela muito pequena
            if (window.innerWidth > 480) {
                togglePanel(wishlistPanel);
                
                // Fecha o outro painel se estiver aberto
                if (cartPanel && cartPanel.classList.contains('open')) {
                    cartPanel.classList.remove('open');
                }
            } else {
                // Em telas muito pequenas, redireciona para a página de favoritos
                window.location.href = wishlistToggle.getAttribute('href') || '/favoritos';
            }
        });
    }
    
    // Configurar comportamento para Carrinho
    if (cartToggle && cartPanel) {
        cartToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Verifica se não estamos em tela muito pequena
            if (window.innerWidth > 480) {
                togglePanel(cartPanel);
                
                // Fecha o outro painel se estiver aberto
                if (wishlistPanel && wishlistPanel.classList.contains('open')) {
                    wishlistPanel.classList.remove('open');
                }
            } else {
                // Em telas muito pequenas, redireciona para a página de carrinho
                window.location.href = cartToggle.getAttribute('href') || '/carrinho';
            }
        });
    }
    
    // Fecha os painéis ao clicar fora
    document.addEventListener('click', function(e) {
        if (wishlistPanel && !wishlistToggle.contains(e.target) && !wishlistPanel.contains(e.target)) {
            wishlistPanel.classList.remove('open');
        }
        
        if (cartPanel && !cartToggle.contains(e.target) && !cartPanel.contains(e.target)) {
            cartPanel.classList.remove('open');
        }
    });
    
    // Inicializa o estado dos painéis
    handleSidePanels();
}

// Gerencia o comportamento dos painéis laterais com base no tamanho da tela
function handleSidePanels() {
    const isSmallScreen = window.innerWidth <= 480;
    const wishlistPanel = document.getElementById('wishlist-panel');
    const cartPanel = document.getElementById('cart-panel');
    
    // Fecha os painéis em telas muito pequenas
    if (isSmallScreen) {
        if (wishlistPanel && wishlistPanel.classList.contains('open')) {
            wishlistPanel.classList.remove('open');
        }
        
        if (cartPanel && cartPanel.classList.contains('open')) {
            cartPanel.classList.remove('open');
        }
    }
}

// Função auxiliar para alternar painéis
function togglePanel(panel) {
    if (panel) {
        panel.classList.toggle('open');
    }
}

// Configura o comportamento do menu de departamentos
function setupDepartmentsMenu() {
    const deptToggle = document.getElementById('departments-toggle');
    const deptMenu = document.getElementById('departments-menu');
    
    if (deptToggle && deptMenu) {
        deptToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            deptMenu.classList.toggle('open');
        });
        
        // Fecha ao clicar fora
        document.addEventListener('click', function(e) {
            if (!deptMenu.contains(e.target) && !deptToggle.contains(e.target)) {
                deptMenu.classList.remove('open');
            }
        });
    }
    
    // Para versão mobile
    const deptToggleMobile = document.querySelector('.departments-btn-mobile');
    if (deptToggleMobile && deptMenu) {
        deptToggleMobile.addEventListener('click', function(e) {
            e.stopPropagation();
            deptMenu.classList.toggle('open');
        });
    }
}

// Reorganiza o header baseado no tamanho da tela
function setupResponsiveHeader() {
    const isMobile = window.innerWidth <= 768;
    
    // Elementos principais
    const header = document.querySelector('header .container');
    const topHeader = document.querySelector('.top-header');
    const logo = document.querySelector('.logo');
    const searchBar = document.querySelector('.search-bar');
    const userActions = document.querySelector('.user-actions');
    const departmentsBtn = document.getElementById('departments-toggle');
    const nav = document.querySelector('nav');
    const mainMenu = document.querySelector('.main-menu');
    const departmentsMenu = document.getElementById('departments-menu');
    
    // Removendo estruturas anteriores se existirem
    removeExistingMobileStructures();
    
    if (isMobile) {
        createMobileLayout(header, topHeader, logo, searchBar, userActions, departmentsBtn);
        moveMainMenuItemsToDepartments(mainMenu, departmentsMenu);
    } else {
        restoreDesktopLayout(header, topHeader, logo, searchBar, userActions, departmentsBtn, nav, mainMenu);
    }
}

// Remove estruturas previamente criadas para mobile
function removeExistingMobileStructures() {
    const mobileHeaderRow = document.querySelector('.mobile-header-row');
    const logoDeptContainer = document.querySelector('.logo-dept-container');
    const iconsContainer = document.querySelector('.icons-container');
    const deptBtnMobile = document.querySelector('.departments-btn-mobile');
    
    if (mobileHeaderRow) mobileHeaderRow.remove();
    if (logoDeptContainer) {
        while (logoDeptContainer.firstChild) {
            logoDeptContainer.parentNode.appendChild(logoDeptContainer.firstChild);
        }
        logoDeptContainer.remove();
    }
    if (iconsContainer) {
        while (iconsContainer.firstChild) {
            iconsContainer.parentNode.appendChild(iconsContainer.firstChild);
        }
        iconsContainer.remove();
    }
    if (deptBtnMobile) deptBtnMobile.remove();
}

// Cria o layout para dispositivos móveis
function createMobileLayout(header, topHeader, logo, searchBar, userActions, departmentsBtn) {
    // 1. Cria a primeira linha do header mobile
    const mobileHeaderRow = document.createElement('div');
    mobileHeaderRow.className = 'mobile-header-row';
    
    // 2. Cria container para logo e botão de departamentos
    const logoDeptContainer = document.createElement('div');
    logoDeptContainer.className = 'logo-dept-container';
    
    // 3. Cria botão de departamentos para mobile (agora com apenas o ícone)
    const deptBtnMobile = document.createElement('button');
    deptBtnMobile.className = 'departments-btn-mobile';
    deptBtnMobile.innerHTML = `<i class="fas fa-bars"></i><span>DEPARTAMENTOS</span>`;
    
    // 4. Adiciona botão de departamentos e logo ao container
    logoDeptContainer.appendChild(deptBtnMobile);
    logoDeptContainer.appendChild(logo);
    
    // 5. Cria container para ícones de usuário
    const iconsContainer = document.createElement('div');
    iconsContainer.className = 'icons-container';
    iconsContainer.appendChild(userActions);
    
    // 6. Adiciona os containers à primeira linha
    mobileHeaderRow.appendChild(logoDeptContainer);
    mobileHeaderRow.appendChild(iconsContainer);
    
    // 7. Reorganiza elementos no topHeader
    topHeader.innerHTML = '';
    topHeader.appendChild(mobileHeaderRow);
    topHeader.appendChild(searchBar);
    
    // 8. Esconde o botão de departamentos original (que ficará na nav)
    if (departmentsBtn) departmentsBtn.style.display = 'none';
}

// Restaura o layout para desktop
function restoreDesktopLayout(header, topHeader, logo, searchBar, userActions, departmentsBtn, nav, mainMenu) {
    // Restaura o layout original
    topHeader.innerHTML = '';
    topHeader.appendChild(logo);
    topHeader.appendChild(searchBar);
    topHeader.appendChild(userActions);
    
    // Restaura visibilidade do botão de departamentos original
    if (departmentsBtn) departmentsBtn.style.display = '';
    
    // Restaura a visibilidade do menu principal
    if (mainMenu) mainMenu.style.display = '';
}

// Move os itens do menu principal para o menu de departamentos em mobile
function moveMainMenuItemsToDepartments(mainMenu, departmentsMenu) {
    if (!mainMenu || !departmentsMenu) return;
    
    const departmentsList = departmentsMenu.querySelector('ul');
    if (!departmentsList) return;
    
    // Marca os itens originais do departamentos como fixos se ainda não estiverem marcados
    Array.from(departmentsList.children).forEach(item => {
        if (!item.hasAttribute('data-fixo')) {
            item.setAttribute('data-fixo', 'true');
        }
    });
    
    // Remove itens dinâmicos anteriores
    Array.from(departmentsList.querySelectorAll('li[data-dinamico="true"]')).forEach(item => {
        item.remove();
    });
    
    // Clona e adiciona itens do menu principal para o menu de departamentos
    Array.from(mainMenu.children).forEach(item => {
        const menuText = item.textContent.trim();
        
        // Verifica se já existe um item com o mesmo texto
        const existingItem = Array.from(departmentsList.children).find(deptItem => {
            return deptItem.textContent.trim() === menuText;
        });
        
        // Se não existir, adiciona
        if (!existingItem) {
            const newItem = item.cloneNode(true);
            newItem.setAttribute('data-dinamico', 'true');
            departmentsList.appendChild(newItem);
        }
    });
    
    // Esconde o menu principal
    mainMenu.style.display = 'none';
}