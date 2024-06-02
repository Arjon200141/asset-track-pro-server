const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

//assettrackpro
//07SOGynIbTcljGdS

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ej6qyrh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;



// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const hruserCollection = client.db('assettrackproDB').collection('hr_user');
        const employeeuserCollection = client.db('assettrackproDB').collection('employee_user');


        app.post('/hruser', async (req, res) => {
            const hruser = req.body;
            const result = await hruserCollection.insertOne(hruser);
            res.send(result);
        })

        app.post('/employeeuser', async (req, res) => {
            const employeeuser = req.body;
            const result = await employeeuserCollection.insertOne(employeeuser);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send("Asset Track Pro is Running !!");
})

app.listen(port, () => {
    console.log(`Asset Track Pro is Running at ${port}`);
})