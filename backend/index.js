const express = require('express');
const app = express();
const PORT = 8080;

require('dotenv').config();

app.use(express.json());

app.post('/space/:id', async (req, res) => {
    const { id } = req.params;

    const quarter = "20264"
    const url = `https://api.ucsb.edu/academics/curriculums/v3/classes/${quarter}/${id}?includeClassSections=true`
    const headers = {
        'accept' : 'application/json',
        'ucsb-api-version' : '3.0',
        'ucsb-api-key' : process.env.GOLD_API
    }
    console.log(url);
    console.log(process.env.GOLD_API);

    try {
        const response = await fetch(
            url,
            {
                method: "GET",
                headers: headers,
            }
        );

        if (!response.ok) {
            return res.status(response.status).json({ error: "UCSB API request failed "});
        }

        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Something went wrong"});
    }
})

app.listen(
    PORT,
    () => console.log(`it's alive on http://localhost:${PORT}`)
);