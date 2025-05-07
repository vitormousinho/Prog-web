// Função para verificar se o usuário está logado
function isUserLoggedIn() {
    return localStorage.getItem('username') !== null;
}

// Função para obter o nome do usuário logado
function getLoggedInUsername() {
    return localStorage.getItem('username');
}

// Função para verificar se o usuário é admin
function isUserAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
}

// Função para fazer logout
function logout() {
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userId');
    window.location.href = 'login.html';
}

// Função para atualizar a interface do usuário
function updateUserInterface() {
    const userMenu = document.querySelector('.user-menu');
    if (!userMenu) return;

    if (isUserLoggedIn()) {
        // Usuário está logado
        const username = getLoggedInUsername();
        const isAdmin = isUserAdmin();
        
        userMenu.innerHTML = `
            <a href="#" class="user-link">
                <i class="fas fa-user"></i>
                <span>${username}</span>
            </a>
            <div class="user-dropdown">
                ${isAdmin ? '<a href="admin.html">Painel Admin</a>' : ''}
                <a href="#" onclick="logout()">Sair</a>
            </div>
        `;
    } else {
        // Usuário não está logado
        userMenu.innerHTML = `
            <a href="login.html" class="user-link">
                <i class="fas fa-user"></i>
                <span>Entrar</span>
            </a>
        `;
    }
}

// Atualiza a interface quando o documento carregar
document.addEventListener('DOMContentLoaded', updateUserInterface);