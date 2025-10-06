require('dotenv').config();
const dbUser = require('../bd/connect');
const { fetchAndStorePRsRaw, updatePRs } = require('../scripts/prService');

const fetchAndStorePRs = async (req, res) => {
    try {
        const message = await fetchAndStorePRsRaw();
        res.status(201).json({ message });
    } catch (error) {
        console.error('❌ Erreur :', error.message);
        res.status(500).json({ error: 'Erreur lors de la récupération des PRs.' });
    }
};

const getPRs = async (req, res) => {
    const { date, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    try {
        const collection = dbUser.bd().collection('pr_merge');
        let query = {};
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query = { updated_at: { $gte: startDate, $lte: endDate } };
        }
        const total = await collection.countDocuments(query);
        const prs = await collection.find(query).sort({ updated_at: -1 }).skip(skip).limit(parseInt(limit)).toArray();

        console.log(` 📥 getPRs appelé avec date=${date}, page=${page}, limit=${limit}`);

        res.status(200).json({
            prs,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur lors de la lecture des PRs.' });
    }
};

module.exports = { fetchAndStorePRs, getPRs, updatePRs };