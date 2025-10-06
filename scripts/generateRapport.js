const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');

function generateRapportMarkdown() {
    const today = dayjs().format('YYYY-MM-DD');
    const exportPath = path.join(__dirname, 'exports', `export_prs_${today}.json`);
    const rapportPath = path.join(__dirname, 'exports', `rapport_${today}.md`);

    if (!fs.existsSync(exportPath)) {
        console.warn(`Fichier d'export non trouvé : ${exportPath}`);
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


    let markdown = `# Rapport des PRs - ${today}\n\n`;
    markdown += `Nombre total de PRs : ${prs.length}\n\n`;

    for (const [user, userPRs] of Object.entries(prsByUser)) {
        markdown += `## Utilisateur : ${user}\n`;
        markdown += `Nombre de PRs : ${userPRs.length}\n\n`;

        userPRs.forEach(pr => {
            markdown += `## PR #${pr.number} - ${pr.title}\n`;
            markdown += `- URL : [${pr.html_url}](${pr.htmlkdown}`
            markdown += `- Créée le : ${pr.created_at}\n`;
            markdown += `- Statut : ${pr.state}\n\n`;
        });
    }

    fs.writeFileSync(rapportPath, markdown, 'utf-8');
    console.log(`Rapport généré : ${rapportPath}`);
}


module.exports = { generateRapportMarkdown };
