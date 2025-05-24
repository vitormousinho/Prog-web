// Função para verificar se o usuário está logado
function isUserLoggedIn() {
    return !!localStorage.getItem('token');
}

// Função para obter o nome do usuário logado
function getLoggedInUsername() {
    return localStorage.getItem('username');
}

// Função para verificar se o usuário é admin
function isUserAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
}

// Função para obter o token de autenticação
function getAuthToken() {
    return localStorage.getItem('token');
}

// Função para fazer logout
function logout() {
    // Limpa todos os dados do usuário
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    
    // Redireciona para a página de login
    window.location.href = 'login.html';
}

// Função para verificar se o usuário tem permissão para acessar uma página
function checkPageAccess() {
    const currentPage = window.location.pathname;
    
    // Se não estiver logado e não estiver na página de login ou cadastro
    if (!isUserLoggedIn() && !currentPage.includes('login.html') && !currentPage.includes('cadastro.html')) {
        window.location.href = 'login.html';
        return false;
    }
    
    // Se estiver tentando acessar página de admin sem ser admin
    if (currentPage.includes('admin') && !isUserAdmin()) {
        window.location.href = 'dashboard.html';
        return false;
    }
    
    return true;
}

// Função para atualizar a interface do usuário
function updateUserInterface() {
    const userMenu = document.querySelector('.user-menu');
    if (!userMenu) return;

    if (isUserLoggedIn()) {
        const username = getLoggedInUsername();
        const isAdmin = isUserAdmin();
        const currentPage = window.location.pathname;

        let adminPanelLink = '';
        if (isAdmin) {
            if (currentPage.includes('dashboardAdmin.html')) {
                // Está no painel admin, mostra "Painel do Usuário"
                adminPanelLink = `<a href="dashboard.html" id="switch-panel-link">Painel do Usuário</a>`;
            } else if (currentPage.includes('dashboard.html')) {
                // Está no painel usuário, mostra "Painel Admin"
                adminPanelLink = `<a href="dashboardAdmin.html" id="switch-panel-link">Painel Admin</a>`;
            }
        }

        userMenu.innerHTML = `
            <div class="user-info">
                <a href="#" class="user-link">
                    <i class="fas fa-user"></i>
                    <span>${username}</span>
                </a>
                <div class="user-dropdown">
                    ${adminPanelLink}
                    <a href="#" onclick="logout()">Sair</a>
                </div>
            </div>
        `;

        // Adiciona evento de clique para mostrar/esconder dropdown
        const userLink = userMenu.querySelector('.user-link');
        const dropdown = userMenu.querySelector('.user-dropdown');
        
        userLink.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.classList.toggle('show');
        });

        // Fecha o dropdown quando clicar fora
        document.addEventListener('click', (e) => {
            if (!userMenu.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    } else {
        userMenu.innerHTML = `
            <a href="login.html" class="user-link">
                <i class="fas fa-user"></i>
                <span>Entrar</span>
            </a>
        `;
    }
}

// Função para mostrar mensagens
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    checkPageAccess();
    updateUserInterface();
});