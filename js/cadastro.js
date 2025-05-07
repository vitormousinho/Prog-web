document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validação básica
        if (password !== confirmPassword) {
            messageDiv.textContent = 'As senhas não coincidem';
            messageDiv.className = 'message error';
            return;
        }

        if (password.length < 6) {
            messageDiv.textContent = 'A senha deve ter pelo menos 6 caracteres';
            messageDiv.className = 'message error';
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
                    password,
                    isAdmin: false
                })
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.textContent = 'Cadastro realizado com sucesso!';
                messageDiv.className = 'message success';
                
                // Redireciona para a página de login após 2 segundos
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                messageDiv.textContent = data.error || 'Erro ao realizar cadastro';
                messageDiv.className = 'message error';
            }
        } catch (error) {
            console.error('Erro:', error);
            messageDiv.textContent = 'Erro ao conectar com o servidor';
            messageDiv.className = 'message error';
        }
    });
}); 