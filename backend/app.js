const express = require('express');
const cors = require('cors');
require('dotenv').config();

const exampleRoutes = require('./routes/exampleRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', exampleRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 