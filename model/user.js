class User {
    constructor({ name, email, phone, githubData = {} }) {
        this.name = name;
        this.email = email;
        this.phone = phone;

        // Stocker toutes les métadonnées GitHub
        Object.assign(this, githubData);
    }

    // Méthode pour afficher uniquement les champs utiles
    getPublicProfile() {
        return {
            id: this.id,
            login: this.login,
            html_url: this.html_url
        };
    }
}

module.exports = { User };