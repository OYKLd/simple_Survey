class SurveyApp {
    constructor() {
        this.surveys = [];
        this.currentSurvey = null;
        this.userVotes = {};
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.bindEvents();
        this.renderSurveysList();
    }

    // LocalStorage
    loadFromStorage() {
        const storedSurveys = localStorage.getItem('surveys');
        const storedVotes = localStorage.getItem('userVotes');
        
        if (storedSurveys) {
            this.surveys = JSON.parse(storedSurveys);
        }
        
        if (storedVotes) {
            this.userVotes = JSON.parse(storedVotes);
        }
    }

    saveToStorage() {
        localStorage.setItem('surveys', JSON.stringify(this.surveys));
        localStorage.setItem('userVotes', JSON.stringify(this.userVotes));
    }

    // Gestion des événements
    bindEvents() {
        // Formulaire de création
        document.getElementById('survey-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createSurvey();
        });

        // Ajout d'option
        document.getElementById('add-option').addEventListener('click', () => {
            this.addOptionInput();
        });

        // Retour à la liste
        document.getElementById('back-to-list').addEventListener('click', () => {
            this.showSurveysList();
        });
    }

    // Création de sondage
    createSurvey() {
        const question = document.getElementById('question').value.trim();
        const optionInputs = document.querySelectorAll('#options-container input');
        const options = [];

        optionInputs.forEach(input => {
            const value = input.value.trim();
            if (value) {
                options.push({
                    id: Date.now() + Math.random(),
                    text: value,
                    votes: 0
                });
            }
        });

        if (!question) {
            this.showMessage('Veuillez entrer une question', 'error');
            return;
        }

        if (options.length < 2) {
            this.showMessage('Veuillez ajouter au moins 2 options', 'error');
            return;
        }

        const survey = {
            id: Date.now(),
            question,
            options,
            createdAt: new Date().toISOString(),
            totalVotes: 0
        };

        this.surveys.push(survey);
        this.saveToStorage();
        this.resetForm();
        this.renderSurveysList();
        this.showMessage('Sondage créé avec succès!', 'success');
    }

    // Gestion des options du formulaire
    addOptionInput() {
        const container = document.getElementById('options-container');
        const optionCount = container.children.length;
        
        if (optionCount >= 4) {
            this.showMessage('Maximum 4 options autorisées', 'error');
            return;
        }

        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-input';
        optionDiv.innerHTML = `
            <input type="text" placeholder="Option ${optionCount + 1}" required>
            <button type="button" class="remove-option">×</button>
        `;

        container.appendChild(optionDiv);
        this.updateOptionButtons();

        // Ajouter l'événement pour le bouton de suppression
        optionDiv.querySelector('.remove-option').addEventListener('click', () => {
            this.removeOptionInput(optionDiv);
        });
    }

    removeOptionInput(optionDiv) {
        const container = document.getElementById('options-container');
        if (container.children.length > 2) {
            optionDiv.remove();
            this.updateOptionButtons();
        }
    }

    updateOptionButtons() {
        const container = document.getElementById('options-container');
        const removeButtons = container.querySelectorAll('.remove-option');
        const addButton = document.getElementById('add-option');

        removeButtons.forEach(button => {
            button.style.display = container.children.length > 2 ? 'block' : 'none';
        });

        addButton.style.display = container.children.length < 4 ? 'block' : 'none';
    }

    // Affichage de la liste des sondages
    renderSurveysList() {
        const container = document.getElementById('surveys-container');
        
        if (this.surveys.length === 0) {
            container.innerHTML = '<p class="message info">Aucun sondage disponible. Créez votre premier sondage!</p>';
            return;
        }

        container.innerHTML = this.surveys.map(survey => `
            <div class="survey-card" onclick="app.showSurveyDetail(${survey.id})">
                <button class="delete-survey" onclick="event.stopPropagation(); app.deleteSurvey(${survey.id})">×</button>
                <h3>${this.escapeHtml(survey.question)}</h3>
                <div class="options-preview">
                    ${survey.options.map(opt => this.escapeHtml(opt.text)).join(' • ')}
                </div>
                <div class="votes-count">${survey.totalVotes} vote(s) • ${survey.options.length} option(s)</div>
            </div>
        `).join('');
    }

    // Affichage du détail d'un sondage
    showSurveyDetail(surveyId) {
        const survey = this.surveys.find(s => s.id === surveyId);
        if (!survey) return;

        this.currentSurvey = survey;
        
        document.getElementById('create-survey').style.display = 'none';
        document.getElementById('surveys-list').style.display = 'none';
        document.getElementById('survey-detail').style.display = 'block';

        const content = document.getElementById('survey-content');
        const hasVoted = this.userVotes[surveyId];
        
        content.innerHTML = `
            <h2>${this.escapeHtml(survey.question)}</h2>
            <p class="survey-info">${survey.totalVotes} vote(s) au total</p>
            
            ${hasVoted ? this.renderResults(survey) : this.renderVoteOptions(survey)}
        `;
    }

    // Options de vote
    renderVoteOptions(survey) {
        return `
            <div class="vote-options">
                ${survey.options.map(option => `
                    <div class="vote-option" onclick="app.vote(${survey.id}, '${option.id}')">
                        <div class="option-text">${this.escapeHtml(option.text)}</div>
                        <div class="vote-count">${option.votes} vote(s)</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Résultats avec barres de progression
    renderResults(survey) {
        const totalVotes = survey.totalVotes;
        
        return `
            <div class="results-container">
                <h3>Résultats</h3>
                ${survey.options.map(option => {
                    const percentage = totalVotes > 0 ? (option.votes / totalVotes * 100).toFixed(1) : 0;
                    return `
                        <div class="result-item">
                            <div class="result-label">
                                <span>${this.escapeHtml(option.text)}</span>
                                <span>${option.votes} vote(s) - ${percentage}%</span>
                            </div>
                            <div class="result-bar">
                                <div class="result-fill" style="width: ${percentage}%">
                                    ${percentage > 10 ? percentage + '%' : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="message success">Vous avez déjà voté pour ce sondage</div>
        `;
    }

    // Vote
    vote(surveyId, optionId) {
        if (this.userVotes[surveyId]) {
            this.showMessage('Vous avez déjà voté pour ce sondage', 'error');
            return;
        }

        const survey = this.surveys.find(s => s.id === surveyId);
        const option = survey.options.find(o => o.id == optionId);
        
        if (!option) return;

        option.votes++;
        survey.totalVotes++;
        this.userVotes[surveyId] = optionId;
        
        this.saveToStorage();
        this.showSurveyDetail(surveyId);
        this.showMessage('Vote enregistré!', 'success');
    }

    // Suppression de sondage
    deleteSurvey(surveyId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce sondage?')) {
            return;
        }

        this.surveys = this.surveys.filter(s => s.id !== surveyId);
        delete this.userVotes[surveyId];
        
        this.saveToStorage();
        this.renderSurveysList();
        this.showMessage('Sondage supprimé', 'success');
    }

    // Navigation
    showSurveysList() {
        document.getElementById('create-survey').style.display = 'block';
        document.getElementById('surveys-list').style.display = 'block';
        document.getElementById('survey-detail').style.display = 'none';
        this.currentSurvey = null;
    }

    // Utilitaires
    resetForm() {
        document.getElementById('survey-form').reset();
        const container = document.getElementById('options-container');
        container.innerHTML = `
            <div class="option-input">
                <input type="text" placeholder="Option 1" required>
                <button type="button" class="remove-option" style="display: none;">×</button>
            </div>
            <div class="option-input">
                <input type="text" placeholder="Option 2" required>
                <button type="button" class="remove-option" style="display: none;">×</button>
            </div>
        `;
        this.updateOptionButtons();
    }

    showMessage(text, type = 'info') {
        // Supprimer les messages existants
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        const firstSection = document.querySelector('.survey-section');
        firstSection.insertBefore(message, firstSection.firstChild);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialisation de l'application
const app = new SurveyApp();
