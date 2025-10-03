const dbUser = require('../bd/connect');

const updatePRsWithUser = async () => {
    try {
        const prCollection = dbUser.bd().collection('pr_merge');
        const prs = await prCollection.find().toArray();
        let updatedCount = 0;

        for (const pr of prs) {
            // Si le champ user est déjà présent et contient un id, on ignore
            if (pr.user && (pr.user.id || pr.user.githubId)) continue;

            // Vérifie si on peut récupérer l'utilisateur depuis un autre champ
            const githubUser = pr.user || pr?.pull_request?.user || pr?.head?.user || null;

            if (!githubUser || !githubUser.id) {
                console.warn(`⚠️ PR #${pr.number} ignorée : utilisateur GitHub introuvable`);
                continue;
            }

            // Mise à jour de la PR avec les infos utilisateur
            await prCollection.updateOne(
                { _id: pr._id },
                {
                    $set: {
                        user: {
                            id: githubUser.id,
                            login: githubUser.login,
                            html_url: githubUser.html_url,
                            avatar_url: githubUser.avatar_url,
                            gravatar_id: githubUser.gravatar_id,
                            url: githubUser.url,
                            followers_url: githubUser.followers_url,
                            following_url: githubUser.following_url,
                            gists_url: githubUser.gists_url,
                            starred_url: githubUser.starred_url,
                            subscriptions_url: githubUser.subscriptions_url,
                            organizations_url: githubUser.organizations_url,
                            repos_url: githubUser.repos_url,
                            events_url: githubUser.events_url,
                            received_events_url: githubUser.received_events_url,
                            type: githubUser.type,
                            site_admin: githubUser.site_admin
                        }
                    }
                }
            );

            updatedCount++;
            console.log(`🔄 PR #${pr.number} mise à jour avec l'utilisateur ${githubUser.login}`);
        }

        console.log(`✅ ${updatedCount} PR(s) mises à jour avec les données utilisateur.`);
        return updatedCount;
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour des PRs :', error.message);
        return 0;
    }
};

module.exports = { updatePRsWithUser };