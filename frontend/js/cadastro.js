document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');

    // Verifica se já está logado
    if (localStorage.getItem('token')) {
        window.location.href = 'dashboard.html';
        return;
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validações
        if (!username || !password || !confirmPassword) {
            showMessage('Por favor, preencha todos os campos', 'error');
            return;
        }

        if (username.length < 3) {
            showMessage('O nome de usuário deve ter pelo menos 3 caracteres', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showMessage('As senhas não coincidem', 'error');
            return;
        }

        if (password.length < 6) {
            showMessage('A senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        // Validação de força da senha
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            showMessage('A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                showMessage('Cadastro realizado com sucesso!', 'success');
                
                // Redireciona para a página de login após 2 segundos
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                showMessage(data.error || 'Erro ao realizar cadastro', 'error');
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