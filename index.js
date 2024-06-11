const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ej6qyrh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        const userCollection = client.db('assettrackproDB').collection('users');
        const assetCollection = client.db('assettrackproDB').collection('assets');
        const requestCollection = client.db('assettrackproDB').collection('requests');

        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { userId: user.userId };
            const existingUser = await userCollection.findOne(query);

            if (existingUser) {
                if (existingUser.role !== user.role) {
                    return res.status(403).send({ message: 'User cannot switch roles', insertedId: null });
                } else {
                    return res.send({ message: 'User Already Exists', insertedId: null });
                }
            }

            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        app.put('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updateUser = req.body;
            const newUser = {
                $set: {
                    name: updateUser.name
                }
            }
            const result = await userCollection.updateOne(filter, newUser, options);
            res.send(result);
        })

        app.post('/assets', async (req, res) => {
            const asset = req.body;
            const result = await assetCollection.insertOne(asset);
            res.send(result);
        });

        app.post('/requests', async (req, res) => {
            const request = req.body;
            const result = await requestCollection.insertOne(request);
            res.send(result);
        });

        app.delete('/assets/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await assetCollection.deleteOne(query);
            res.send(result);
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        })

        app.get('/requests', async (req, res) => {
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

        app.get('/usersemp', async (req, res) => {
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

        app.get('/allrequests', async (req, res) => {
            const result = await requestCollection.find().toArray();
            res.send(result);
        });

        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });

        app.get('/assets', async (req, res) => {
            const result = await assetCollection.find().toArray();
            res.send(result);
        });

        app.put('/allrequests/approve/:id', async (req, res) => {
            const requestId = req.params.id;
            try {
                const result = await requestCollection.updateOne(
                    { _id: new ObjectId(requestId) },
                    { $set: { RequestStatus: 'Approved' } }
                );
                if (result.modifiedCount > 0) {
                    res.status(200).json({ message: 'Request approved successfully' });
                } else {
                    res.status(404).json({ error: 'Request not found' });
                }
            } catch (error) {
                console.error('Error approving request:', error);
                res.status(500).json({ error: 'Failed to approve request' });
            }
        });

        app.put('/allrequests/reject/:id', async (req, res) => {
            const requestId = req.params.id;
            try {
                const result = await requestCollection.updateOne(
                    { _id: new ObjectId(requestId) },
                    { $set: { RequestStatus: 'Rejected' } }
                );
                if (result.modifiedCount > 0) {
                    res.status(200).json({ message: 'Request rejected successfully' });
                } else {
                    res.status(404).json({ error: 'Request not found' });
                }
            } catch (error) {
                console.error('Error rejecting request:', error);
                res.status(500).json({ error: 'Failed to reject request' });
            }
        });

        app.post('/cancelRequest', async (req, res) => {
            const { id } = req.body;
            try {
                const result = await requestCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { RequestStatus: 'Cancelled' } }
                );
                if (result.modifiedCount > 0) {
                    res.status(200).json({ message: 'Request cancelled successfully' });
                } else {
                    res.status(404).json({ error: 'Request not found' });
                }
            } catch (error) {
                console.error('Error cancelling request:', error);
                res.status(500).json({ error: 'Failed to cancel request' });
            }
        });

        app.post('/returnAsset', async (req, res) => {
            const { id } = req.body;
            try {
                const assetRequest = await requestCollection.findOne({ _id: new ObjectId(id) });
                if (!assetRequest) {
                    return res.status(404).json({ error: 'Request not found' });
                }

                const result = await requestCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { RequestStatus: 'Returned' } }
                );

                if (result.modifiedCount > 0) {
                    await assetCollection.updateOne(
                        { _id: new ObjectId(assetRequest.assetId) },
                        { $inc: { quantity: 1 } }
                    );
                    res.status(200).json({ message: 'Asset returned successfully' });
                } else {
                    res.status(404).json({ error: 'Request not found' });
                }
            } catch (error) {
                console.error('Error returning asset:', error);
                res.status(500).json({ error: 'Failed to return asset' });
            }
        });

        app.get('/', (req, res) => {
            res.send("Asset Track Pro is Running!!");
        });

        app.listen(port, () => {
            console.log(`Asset Track Pro is Running at ${port}`);
        });

        console.log("Connected to MongoDB successfully!");
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
    }
}
run().catch(console.dir);
