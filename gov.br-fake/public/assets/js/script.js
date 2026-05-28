// CPF MASK

function maskCPF(value) {

    value = value.replace(/\D/g, '').slice(0, 11);
  
    if (value.length > 9) {
      value = value.replace(
        /(\d{3})(\d{3})(\d{3})(\d+)/,
        '$1.$2.$3-$4'
      );
  
    } else if (value.length > 6) {
  
      value = value.replace(
        /(\d{3})(\d{3})(\d+)/,
        '$1.$2.$3'
      );
  
    } else if (value.length > 3) {
  
      value = value.replace(
        /(\d{3})(\d+)/,
        '$1.$2'
      );
    }
  
    return value;
  }
  
  const cpfInput = document.getElementById('cpf-input');
  
  cpfInput.addEventListener('input', function () {
    this.value = maskCPF(this.value);
  });
  
  // PAGES
  
  const mainPage = document.getElementById('main-page');
  const govbrPage = document.getElementById('govbr-page');
  
  function showGovBr() {
  
    mainPage.style.display = 'none';
  
    govbrPage.style.display = 'flex';
  
    govbrPage.classList.add('visible');
  
    cpfInput.focus();
  }
  
  function showMain() {
  
    govbrPage.style.display = 'none';
  
    govbrPage.classList.remove('visible');
  
    mainPage.style.display = 'block';
  }
  
  // CARD CLICK
  
  const card = document.getElementById('servidor-card');
  
  card.addEventListener('click', showGovBr);
  
  // BACK
  
  document
    .getElementById('back-to-main')
    .addEventListener('click', showMain);
  
  // CPF → SENHA
  
  document
    .getElementById('btn-continuar')
    .addEventListener('click', function () {
  
      const raw = cpfInput.value.replace(/\D/g, '');
  
      if (raw.length < 11) {
  
        alert('Digite um CPF válido');
  
        return;
      }
  
      document.getElementById('cpf-display').textContent =
        cpfInput.value;
  
      document
        .getElementById('step-cpf')
        .classList.remove('active');
  
      document
        .getElementById('step-senha')
        .classList.add('active');
    });
  
  // BACK CPF
  
  document
    .getElementById('back-to-cpf')
    .addEventListener('click', function () {
  
      document
        .getElementById('step-senha')
        .classList.remove('active');
  
      document
        .getElementById('step-cpf')
        .classList.add('active');
    });
  
  // LOGIN
  
  document
    .getElementById('btn-entrar')
    .addEventListener('click', function () {
  
      this.textContent = 'Autenticando...';
  
      this.disabled = true;
  
      setTimeout(() => {
  
        this.textContent = 'Entrar';
  
        this.disabled = false;
  
        alert('Login realizado com sucesso!');
  
      }, 1500);
    });