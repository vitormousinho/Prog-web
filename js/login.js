document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

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
                messageDiv.textContent = 'Login realizado com sucesso!';
                messageDiv.className = 'message success';
                
                // Armazena as informações do usuário
                localStorage.setItem('username', username);
                localStorage.setItem('password', password);
                localStorage.setItem('isAdmin', data.user.isAdmin);
                localStorage.setItem('userId', data.user.id);
                
                // Redireciona baseado no papel do usuário
                if (data.user.isAdmin) {
                    window.location.href = 'indexAdmin.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                // Erro no login
                messageDiv.textContent = data.error || 'Erro ao fazer login';
                messageDiv.className = 'message error';
            }
        } catch (error) {
            console.error('Erro:', error);
            messageDiv.textContent = 'Erro ao conectar com o servidor';
            messageDiv.className = 'message error';
        }
    });
}); 