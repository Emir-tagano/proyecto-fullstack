const express = require('express');
const router = express.Router();
const axios = require('axios');

// Get currency rates (External API Integration)
router.get('/rates', async (req, res, next) => {
    try {
        const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
        res.json({
            base: response.data.base,
            date: response.data.date,
            rates: {
                MXN: response.data.rates.MXN,
                EUR: response.data.rates.EUR,
                GBP: response.data.rates.GBP
            }
        });
    } catch (err) {
        console.error('Error fetching currency rates:', err.message);
        if (err.response) {
            console.error('API Response status:', err.response.status);
            console.error('API Response data:', err.response.data);
        }
        res.status(500).json({ message: 'Error fetching currency rates', error: err.message });
    }
});

module.exports = router;
