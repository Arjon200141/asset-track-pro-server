const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 4000;

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

        const userCollection = client.db('assettrackproDB').collection('users');
        const assetCollection = client.db('assettrackproDB').collection('assets');
        const requestCollection = client.db('assettrackproDB').collection('requests');

        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { userId: user.uid }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'User Already Exists', insertId: null })
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        app.post('/assets', async (req, res) => {
            const asset = req.body;
            const result = await assetCollection.insertOne(asset);
            res.send(result);
        })

        app.post('/requests', async (req, res) => {
            const requests = req.body;
            const result = await requestCollection.insertOne(requests);
            res.send(result);
        })

        app.get("/requests", async (req, res) => {
            const { email, searchTerm, stockFilter, assetTypeFilter } = req.query;
            const query = { UserEmail: email };

            if (searchTerm) {
                query.ProductName = { $regex: searchTerm, $options: 'i' };
            }
            if (stockFilter) {
                query.stockStatus = stockFilter;
            }
            if (assetTypeFilter) {
                query.ProductType = assetTypeFilter;
            }

            const result = await requestCollection.find(query).toArray();
            res.send(result);
        });

        app.get("/usersemp", async (req, res) => {
            const { role } = req.query;
            const query = { role: role || 'employee' };
            try {
                const result = await userCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.error('Error fetching users', error);
                res.status(500).send({ error: 'Failed to fetch users' });
            }
        });


        // app.get('/allrequests' , async(req,res)=>{
        //     const cursor = requestCollection.find();
        //     const result= await cursor.toArray();
        //     res.send(result);
        // })


        app.get('/users', async (req, res) => {
            const cursor = userCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/assets', async (req, res) => {
            const cursor = assetCollection.find();
            const result = await cursor.toArray();
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