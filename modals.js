// modals.js

/**
 * Alterna a visibilidade de um modal baseado no seletor CSS.
 * @param {string} modalSelector - O seletor CSS (e.g., '#mass-hours-modal').
 */
function toggleModal(modalSelector) {
    const modal = document.querySelector(modalSelector);
    if (modal) {
        // Alterna o atributo 'hidden'
        modal.hidden = !modal.hidden;

        // Opcional: Adiciona/remove classe para controle de scroll do body, 
        // caso queira evitar o scroll quando o modal estiver aberto.
        // document.body.classList.toggle('modal-open', !modal.hidden);
    } else {
        console.error(`Modal com seletor ${modalSelector} não encontrado.`);
    }
}

// Exporta a função para ser usada no index.html (Embora no seu caso 
// seja global, é bom prepará-la para módulos futuros)
// window.toggleModal = toggleModal; // Se não for usar módulos, mantenha global.

// Adiciona listener para fechar modais com o botão de fechar (x) e os botões de ação
document.addEventListener('click', (e) => {
    // Ação de abrir Modais pelos cards de ação (data-action)
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'open-mass') {
        e.preventDefault();
        toggleModal('#mass-hours-modal');
        return;
    }
    if (action === 'open-confession') {
        e.preventDefault();
        toggleModal('#special-mass-hours-modal');
        return;
    }

    // Ação para o botão de fechar dentro dos modais
    const closeBtn = e.target.closest('[onclick^="toggleModal"]');
    if (closeBtn) {
        // A função de clique já está no HTML (onclick), mas se for remover 
        // o 'onclick', o código de fechamento deve vir para cá.
        // Por enquanto, o foco é a organização do JS que estava no HTML.
    }
});