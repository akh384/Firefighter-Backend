const mongoose = require('mongoose');

const connectionString = process.env.COSMOSDB_CONNECTION_STRING || 'mongodb+srv://ahelms14:Tuna32%21%3FAsh1995@firefighter-mongodb-cluster.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000';
mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to Azure Cosmos DB for MongoDB!'))
    .catch(err => console.error('Error connecting to Cosmos DB:', err));
