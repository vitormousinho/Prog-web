const API_URL = 'http://localhost:3001';

// Função para buscar e renderizar produtos
async function fetchAndRenderProducts(query = '') {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';
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
            if (query) {
                products = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
            }
            products.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
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
                        <span class="product-price">R$ ${Number(product.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
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
const searchForm = document.querySelector('.search-bar');
if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = document.getElementById('searchInput').value;
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

// Event Listeners para o modal
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
            photo: formData.get('photo')
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
    const productData = {
        name: document.getElementById('editProductName').value,
        description: document.getElementById('editProductDescription').value,
        price: parseFloat(document.getElementById('editProductPrice').value),
        photo: document.getElementById('editProductPhoto').value
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