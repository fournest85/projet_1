const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const { getExportFilePath } = require('./githubService');

function generateRapportMarkdown(dateStr) {
    const exportPath = getExportFilePath('export_prs', dateStr);
    const rapportPath = path.join(__dirname, 'exports', `rapport_${dateStr}.md`);

    console.log(`🛠️ Génération du rapport pour la date : ${dateStr}`)

    if (!fs.existsSync(exportPath)) {
        console.warn(`Fichier d'export non trouvé : ${exportPath}`);
        return;
    }

    if (fs.existsSync(rapportPath)) {
        console.log(`📄 Le rapport ${path.basename(rapportPath)} existe déjà. Génération ignorée.`);
        return;
    }

    const prs = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));

    // Regroupement par utilisateur
    const prsByUser = {};
    prs.forEach(pr => {
        const login = pr.user?.login || 'inconnu';
        if (!prsByUser[login]) {
            prsByUser[login] = [];
        }
        prsByUser[login].push(pr);
    });


    let markdown = `# Rapport des PRs - ${dateStr}\n\n`;
    markdown += `Nombre total de PRs : ${prs.length}\n\n`;

    // Points forts (à adapter selon ton projet)
    markdown += `## ✅ Points forts\n`;
    markdown += `- Bonne répartition des contributions.\n`;
    markdown += `- Plusieurs PRs fusionnées avec succès.\n\n`;

    // Analyse par utilisateur
    markdown += `## 👥 Analyse par utilisateur\n`;

    for (const [user, userPRs] of Object.entries(prsByUser)) {

        const totalFiles = userPRs.reduce((sum, pr) => sum + (pr.changed_files || 0), 0);
        const totalAdditions = userPRs.reduce((sum, pr) => sum + (pr.additions || 0), 0);
        const totalDeletions = userPRs.reduce((sum, pr) => sum + (pr.deletions || 0), 0);

        markdown += `### 🔹 ${user}\n`;
        markdown += `- Nombre de PRs : ${userPRs.length}\n`;
        markdown += `- Fichiers modifiés : ${totalFiles}\n`;
        markdown += `- Lignes ajoutées : ${totalAdditions}\n`;
        markdown += `- Lignes supprimées : ${totalDeletions}\n\n`;


        userPRs.forEach(pr => {

            markdown += `#### PR #${pr.number} - ${pr.title}\n`;
            markdown += `- 🔗 [Lien vers la PR](${pr.html_url})  - 🕒 Créée le: ${dayjs(pr.created_at).format('YYYY-MM-DD HH:mm')} \n`;
            markdown += `- 📂 Fichiers modifiés: ${pr.changed_files} \n`;
            markdown += `- ➕ Additions: ${pr.additions}, ➖ Deletions: ${pr.deletions} \n`;
            markdown += `- 📌 Statut: ${pr.state} \n\n`;

        });
    }

    // Suggestions d'amélioration
    markdown += `## 🛠️ Améliorations recommandées\n`;
    markdown += `- Vérifier les PRs avec peu ou pas de description.\n`;
    markdown += `- Encourager des commits plus atomiques.\n`;
    markdown += `- Ajouter des reviewers pour les PRs critiques.\n`;


    // Nettoyage de code
    markdown += `## 🧹 Nettoyage de code\n`;
    markdown += `- Suppression de variables inutilisées : \`today\`, \`dateStr\`\n`;
    markdown += `- Suppression d’un import non utilisé : \`const os = require('os')\`\n`;
    
    fs.writeFileSync(rapportPath, markdown, 'utf-8');
    console.log(`Rapport généré: ${rapportPath} `);
}


module.exports = { generateRapportMarkdown };
