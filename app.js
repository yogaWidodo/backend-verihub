require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();

// Find your Application ID and API Key at <https://app.verihubs.com>
// and set as the Environment variables.
const VERIHUBS_APP_ID = process.env.VERIHUBS_APP_ID;
// API Key must not contain newlines when sent in HTTP headers in Node.js
const VERIHUBS_API_KEY = (process.env.VERIHUBS_API_KEY || '').replace(/\r?\n/g, '');

/**
 * Helper to forward responses from Verihubs
 */
const forwardResponse = (res, axiosResponse) => {
    // Copy headers (filtering out some that might cause issues)
    const headersToIgnore = [
        'content-encoding',
        'transfer-encoding',
        'connection',
        'content-length'
    ];

    Object.entries(axiosResponse.headers).forEach(([key, value]) => {
        if (!headersToIgnore.includes(key.toLowerCase())) {
            res.setHeader(key, value);
        }
    });

    return res.status(axiosResponse.status).send(axiosResponse.data);
};

// Use raw body for liveness and deepfake to preserve bit-parity for checksums
app.post("/liveness", express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
    try {
        const response = await axios.post(
            "https://api.verihubs.com/v1/face/liveness",
            req.body, // req.body is now a Buffer due to express.raw()
            {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": req.headers["content-type"] || "application/json",
                    "App-ID": VERIHUBS_APP_ID,
                    "Api-Key": VERIHUBS_API_KEY,
                    "X-VH-SDKVER": req.headers["x-vh-sdkver"],
                    "X-VH-CHECKSUM": req.headers["x-vh-checksum"],
                    "X-Session-ID": req.headers["x-session-id"],
                },
                // Axios handles errors as exceptions by default
                validateStatus: (status) => true
            }
        );
        forwardResponse(res, response);
    } catch (error) {
        console.error("Liveness error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/deepfake", express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
    try {
        const response = await axios.post(
            "https://api.verihubs.com/v1/face/deepfake",
            req.body,
            {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": req.headers["content-type"] || "application/json",
                    "App-ID": VERIHUBS_APP_ID,
                    "Api-Key": VERIHUBS_API_KEY,
                    "X-VH-PROCID": req.headers["x-vh-procid"],
                    "X-VH-SDKVER": req.headers["x-vh-sdkver"],
                    "X-VH-CHECKSUM": req.headers["x-vh-checksum"],
                    "X-Session-ID": req.headers["x-session-id"],
                },
                validateStatus: (status) => true
            }
        );
        forwardResponse(res, response);
    } catch (error) {
        console.error("Deepfake error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/:license_id/check", express.json(), async (req, res) => {   
    try {
        const { license_id } = req.params;
        const response = await axios.post(
            `https://api.verihubs.com/v1/license/${license_id}/check`,
            req.body,
            {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": req.headers["content-type"] || "application/json",
                    "App-ID": VERIHUBS_APP_ID,
                    "Api-Key": VERIHUBS_API_KEY,
                },
                validateStatus: (status) => true
            }
        );
        forwardResponse(res, response);
    } catch (error) {
        console.error("License check error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post("/generate-key", express.json(), async (req, res) => {    
    try {
        const response = await axios.post(
            "https://api.verihubs.com/v1/encryption/generate-key",
            req.body,
            {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": req.headers["content-type"] || "application/json",
                    "App-ID": VERIHUBS_APP_ID,
                    "Api-Key": VERIHUBS_API_KEY,
                },
                validateStatus: (status) => true
            }
        );
        forwardResponse(res, response);
    } catch (error) {
        console.error("Generate key error:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// Export the Express API for Vercel
module.exports = app;
