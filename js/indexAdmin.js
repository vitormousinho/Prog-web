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
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p>${product.description || ''}</p>
                        <span>R$ ${product.price}</span>
                    </div>
                    <button class="edit-btn" data-id="${product.id}" title="Editar">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
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
if (container) {
    container.addEventListener('click', (e) => {
        if (e.target.closest('.edit-btn')) {
            const id = e.target.closest('.edit-btn').dataset.id;
            // Aqui você pode abrir um modal de edição ou redirecionar
            alert('Função de editar produto ainda não implementada. ID: ' + id);
        }
    });
}

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