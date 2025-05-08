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
if (createBtn) {
    createBtn.addEventListener('click', () => {
        // Aqui você pode abrir um modal ou redirecionar para uma página de criação
        alert('Função de criar item ainda não implementada.');
    });
}

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
});