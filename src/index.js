const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const rummyRoutes = require('./route/rummyRoutes');
const userRoutes = require('./route/userRoutes');
const initializeSocket = require('./socket/socket');


const http = require('http');
const cors = require("cors");



const app = express();
const server = http.createServer(app);


app.use(bodyParser.json());
//app.use(multer().any())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // Enable if you need to send cookies with the request
}));
mongoose.connect("mongodb+srv://BIKASH:2NQSqnkWjFq2TWNe@cluster0.bbmcbft.mongodb.net/rummy", { useNewUrlParser: true })
  .then(() => console.log("MongoDB is connected"))
  .catch((err) => console.log(err.message));

  initializeSocket(server);  // Rummy calling server
  

app.use("/rakesh", rummyRoutes);
app.use('/users', userRoutes);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

