const API_URL = 'http://localhost:3001';

let currentSearchToken = 0;
let currentCategoryToken = 0;

// Função para buscar e renderizar produtos
async function fetchAndRenderProducts(query = '') {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';

    // Controle de token para evitar duplicação
    currentSearchToken++;
    const thisSearchToken = currentSearchToken;

    try {
        const response = await fetch(`${API_URL}/products`, {
            headers: {
                'username': localStorage.getItem('username'),
                'password': localStorage.getItem('password')
            }
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data.products)) {
            let products = data.products;
            
            // Filtro de pesquisa - agora busca produtos que começam com a sequência
            if (query) {
                products = products.filter(p => 
                    (p.name && p.name.toLowerCase().startsWith(query)) || 
                    (p.description && p.description.toLowerCase().startsWith(query)) ||
                    (p.tags && p.tags.some(tag => tag.toLowerCase().startsWith(query)))
                );
            }
            
            if (products.length === 0) {
                // Só mostra se for a busca mais recente
                if (thisSearchToken === currentSearchToken) {
                    container.innerHTML = '<p class="no-results">Nenhum produto encontrado.</p>';
                }
                return;
            }

            // Só mostra se for a busca mais recente
            if (thisSearchToken !== currentSearchToken) return;

            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                
                // Calcular preço com desconto
                const precoOriginal = Number(product.price);
                const precoComDesconto = product.desconto ? 
                    precoOriginal * (1 - product.desconto/100) : 
                    precoOriginal;

                // Gerar estrelas baseado na avaliação
                const stars = '★'.repeat(Math.floor(product.rate || 0)) + 
                            '☆'.repeat(5 - Math.floor(product.rate || 0));

                // Gerar tags HTML
                const tagsHtml = (product.tags || [])
                    .map(tag => `<span class="product-tag">${tag}</span>`)
                    .join('');

                card.innerHTML = `
                    <div class="product-image-wrapper">
                        <img src="${product.photo || '../img/no-image.png'}" alt="Produto" class="product-image">
                        <button class="edit-btn" data-id="${product.id}" title="Editar">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p>${product.description || ''}</p>
                        <div class="product-tags">${tagsHtml}</div>
                        <div class="product-rating">
                            <span class="stars">${stars}</span>
                            <span class="votes">(${product.votes || 0} votos)</span>
                        </div>
                        <div class="product-price">
                            ${product.desconto ? 
                                `<span class="original-price">R$ ${precoOriginal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>` 
                                : ''}
                            <span class="current-price">R$ ${precoComDesconto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                            ${product.desconto ? 
                                `<span class="discount-badge">-${product.desconto}%</span>` 
                                : ''}
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p>Nenhum produto encontrado.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p>Erro ao carregar produtos.</p>';
    }
}

// Evento de busca
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        fetchAndRenderProducts(query);
    });
}

// Evento para criar item
const createBtn = document.getElementById('createProductBtn');

// Evento para editar produto
const container = document.getElementById('productsContainer');

// Função de alternância de tema
function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
        document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// Função para mostrar o modal de criação de produto
function showCreateProductModal() {
    const modal = document.getElementById('createProductModal');
    modal.style.display = 'block';
}

// Função para fechar o modal
function closeCreateProductModal() {
    const modal = document.getElementById('createProductModal');
    modal.style.display = 'none';
    document.getElementById('createProductForm').reset();
}

// Função para criar um novo produto
async function createProduct(productData) {
    try {
        // Coletar tags selecionadas
        const selectedTags = Array.from(document.querySelectorAll('input[name="tags"]:checked'))
            .map(checkbox => checkbox.value);
        
        productData.tags = selectedTags;
        
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            throw new Error('Erro ao criar produto');
        }

        const newProduct = await response.json();
        return newProduct;
    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}

// Event Listeners para o menu principal
document.addEventListener('DOMContentLoaded', () => {
    // Tema salvo
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    fetchAndRenderProducts();

    // Alternância de tema
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.contains('dark-theme');
            setTheme(isDark ? 'light' : 'dark');
        });
    }

    // Evento para os botões do menu principal
    const mainMenuButtons = document.querySelectorAll('.main-menu a');
    mainMenuButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const category = button.getAttribute('data-category');
            filterProductsByCategory(category);
        });
    });

    // Evento para os botões do menu de departamentos
    const departmentsButtons = document.querySelectorAll('.departments-menu a');
    departmentsButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const category = button.getAttribute('data-category');
            filterProductsByCategory(category);
        });
    });

    const createProductBtn = document.getElementById('createProductBtn');
    const cancelCreateBtn = document.getElementById('cancelCreateBtn');
    const createProductForm = document.getElementById('createProductForm');

    createProductBtn.addEventListener('click', showCreateProductModal);
    cancelCreateBtn.addEventListener('click', closeCreateProductModal);

    createProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(createProductForm);
        const productData = {
            name: formData.get('name'),
            description: formData.get('description'),
            price: parseFloat(formData.get('price')),
            photo: formData.get('photo'),
            desconto: parseFloat(formData.get('desconto')) || 0
        };

        try {
            await createProduct(productData);
            closeCreateProductModal();
            fetchAndRenderProducts();
            alert('Produto criado com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao criar produto. Por favor, tente novamente.');
        }
    });

    // Redireciona para indexAdmin.html ao clicar no logo
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', function() {
            window.location.href = 'indexAdmin.html';
        });
    }
});

// Utilitário para abrir/fechar modais
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Variáveis para guardar o produto em edição/exclusão
let editingProductId = null;

// Abrir modal de edição ao clicar no lápis
container.addEventListener('click', async (e) => {
    if (e.target.closest('.edit-btn')) {
        const id = e.target.closest('.edit-btn').dataset.id;
        // Buscar dados do produto atual
        const response = await fetch(`${API_URL}/products`, {
            headers: {
                'username': localStorage.getItem('username'),
                'password': localStorage.getItem('password')
            }
        });
        const data = await response.json();
        const product = data.products.find(p => p.id === id);
        if (!product) return alert('Produto não encontrado!');
        editingProductId = id;
        
        // Preencher campos do modal
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductDescription').value = product.description;
        document.getElementById('editProductPrice').value = product.price;
        document.getElementById('editProductPhoto').value = product.photo;
        document.getElementById('editProductDesconto').value = product.desconto || 0;
        
        // Marcar checkboxes das tags
        const checkboxes = document.querySelectorAll('input[name="edit-tags"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = product.tags && product.tags.includes(checkbox.value);
        });
        
        showModal('editProductModal');
    }
});

// Fechar modal de edição
document.getElementById('cancelEditBtn').onclick = () => {
    closeModal('editProductModal');
    editingProductId = null;
};

// Salvar alterações (PUT)
document.getElementById('editProductForm').onsubmit = async (e) => {
    e.preventDefault();
    
    // Coletar tags selecionadas
    const selectedTags = Array.from(document.querySelectorAll('input[name="edit-tags"]:checked'))
        .map(checkbox => checkbox.value);
    
    const productData = {
        name: document.getElementById('editProductName').value,
        description: document.getElementById('editProductDescription').value,
        price: parseFloat(document.getElementById('editProductPrice').value),
        photo: document.getElementById('editProductPhoto').value,
        tags: selectedTags,
        desconto: parseFloat(document.getElementById('editProductDesconto').value) || 0
    };
    
    try {
        const response = await fetch(`${API_URL}/products/${editingProductId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(productData)
        });
        if (!response.ok) throw new Error('Erro ao atualizar produto');
        closeModal('editProductModal');
        fetchAndRenderProducts();
        alert('Produto atualizado com sucesso!');
    } catch (error) {
        alert('Erro ao atualizar produto.');
    }
};

// Abrir modal de confirmação de exclusão
document.getElementById('deleteProductBtn').onclick = () => {
    showModal('confirmDeleteModal');
};

// Cancelar exclusão
document.getElementById('cancelDeleteBtn').onclick = () => {
    closeModal('confirmDeleteModal');
};

// Confirmar exclusão (DELETE)
document.getElementById('confirmDeleteBtn').onclick = async () => {
    try {
        const response = await fetch(`${API_URL}/products/${editingProductId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            }
        });
        if (!response.ok) throw new Error('Erro ao excluir produto');
        closeModal('confirmDeleteModal');
        closeModal('editProductModal');
        fetchAndRenderProducts();
        alert('Produto excluído com sucesso!');
    } catch (error) {
        alert('Erro ao excluir produto.');
    }
};

// Função para filtrar produtos por categoria
async function filterProductsByCategory(category) {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';

    // Controle de token para evitar duplicação
    currentCategoryToken++;
    const thisCategoryToken = currentCategoryToken;

    try {
        const response = await fetch(`${API_URL}/products`, {
            headers: {
                'username': localStorage.getItem('username'),
                'password': localStorage.getItem('password')
            }
        });
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
                products = products.filter(p => 
                    p.tags && p.tags.includes(tagToFilter)
                );
            }
            
            if (products.length === 0) {
                if (thisCategoryToken === currentCategoryToken) {
                    container.innerHTML = '<p class="no-results">Nenhum produto encontrado nesta categoria.</p>';
                }
                return;
            }

            // Renderizar produtos filtrados
            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                
                // Calcular preço com desconto
                const precoOriginal = Number(product.price);
                const precoComDesconto = product.desconto ? 
                    precoOriginal * (1 - product.desconto/100) : 
                    precoOriginal;

                // Gerar estrelas baseado na avaliação
                const stars = '★'.repeat(Math.floor(product.rate || 0)) + 
                            '☆'.repeat(5 - Math.floor(product.rate || 0));

                // Gerar tags HTML
                const tagsHtml = (product.tags || [])
                    .map(tag => `<span class="product-tag">${tag}</span>`)
                    .join('');

                card.innerHTML = `
                    <div class="product-image-wrapper">
                        <img src="${product.photo || '../img/no-image.png'}" alt="Produto" class="product-image">
                        <button class="edit-btn" data-id="${product.id}" title="Editar">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p>${product.description || ''}</p>
                        <div class="product-tags">${tagsHtml}</div>
                        <div class="product-rating">
                            <span class="stars">${stars}</span>
                            <span class="votes">(${product.votes || 0} votos)</span>
                        </div>
                        <div class="product-price">
                            ${product.desconto ? 
                                `<span class="original-price">R$ ${precoOriginal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>` 
                                : ''}
                            <span class="current-price">R$ ${precoComDesconto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                            ${product.desconto ? 
                                `<span class="discount-badge">-${product.desconto}%</span>` 
                                : ''}
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p>Nenhum produto encontrado.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p>Erro ao carregar produtos.</p>';
    }
}