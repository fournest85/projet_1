const dbUser = require('../bd/connect');

const updatePRsWithUser = async () => {
    try {
        const prCollection = dbUser.bd().collection('pr_merge');
        const prs = await prCollection.find().toArray();
        let updatedCount = 0;

        for (const pr of prs) {
            const existingUser = pr.user;

            // Ignore si déjà enrichi avec login et html_url
            if (existingUser && existingUser.login && existingUser.html_url) {
                console.log(`ℹ️ PR #${pr.number} déjà enrichie avec ${existingUser.login}, ignorée.`);
                continue;
            }

            // Utilise les données existantes si githubId et githubUrl sont présents
            if (existingUser && existingUser.githubId && existingUser.githubUrl) {
                const enrichedUser = {
                    id: existingUser.githubId,
                    login: existingUser.githubUrl.split('/').pop(), // extrait le login depuis l'URL
                    html_url: existingUser.githubUrl,
                    avatar_url: null,
                    gravatar_id: null,
                    url: existingUser.githubUrl,
                    followers_url: null,
                    following_url: null,
                    gists_url: null,
                    starred_url: null,
                    subscriptions_url: null,
                    organizations_url: null,
                    repos_url: null,
                    events_url: null,
                    received_events_url: null,
                    type: 'User',
                    site_admin: false
                };

                await prCollection.updateOne(
                    { _id: pr._id },
                    { $set: { user: enrichedUser } }
                );

                updatedCount++;
                console.log(`🔄 PR #${pr.number} mise à jour avec l'utilisateur ${enrichedUser.login}`);
            } else {
                console.warn(`⚠️ PR #${pr.number} ignorée : utilisateur GitHub introuvable`);
            }
        }

        console.log(`✅ ${updatedCount} PR(s) mises à jour avec les données utilisateur.`);
        return updatedCount;
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour des PRs :', error.message);
        return 0;
    }
};

module.exports = { updatePRsWithUser };
