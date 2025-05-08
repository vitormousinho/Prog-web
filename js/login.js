document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');

    // Verifica se já está logado
    if (localStorage.getItem('token')) {
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        window.location.href = isAdmin ? 'indexAdmin.html' : 'index.html';
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        // Validação básica
        if (!username || !password) {
            showMessage('Por favor, preencha todos os campos', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Login bem-sucedido
                showMessage('Login realizado com sucesso!', 'success');
                
                // Armazena o token e informações do usuário
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.user.username);
                localStorage.setItem('isAdmin', data.user.isAdmin);
                
                // Redireciona após um breve delay
                setTimeout(() => {
                    window.location.href = data.user.isAdmin ? 'indexAdmin.html' : 'index.html';
                }, 1000);
            } else {
                // Erro no login
                showMessage(data.error || 'Erro ao fazer login', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            showMessage('Erro ao conectar com o servidor', 'error');
        }
    });

    // Função para mostrar mensagens
    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        
        // Limpa a mensagem após 5 segundos
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'message';
        }, 5000);
    }
}); 