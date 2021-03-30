const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const port = 5000;
require("dotenv").config();
// console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dtkkw.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

//
const app = express();
app.use(cors());
app.use(bodyParser.json());

// ?? firebase admin

const serviceAccount = require("./configs/burj-al-arab-auth-server-side-firebase-adminsdk-4359s-d9da096df9.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

//

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const bookings = client.db("burjAlArab").collection("bookings");
  // perform actions on the collection object
  //
  app.post("/addBooking", (req, res) => {
    // console.log(req.body);
    //console.log(res.body);
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
    console.log(newBooking);
  });

  // load filtered data from DB for a specific user
  app.get("/bookings", (req, res) => {
    //console.log(req.headers.authorization);
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      //console.log({ idToken });
      // idToken comes from the client app
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          // console.log(tokenEmail, queryEmail);
          if (tokenEmail == queryEmail) {
            bookings.find({ email: queryEmail }).toArray((err, documents) => {
              res.status(200).send(documents);
            });
          } else {
            res.status(401).send("Un-authorised Access");
          }

          //console.log({ uid });
        })
        .catch((error) => {
          // Handle error
          res.status(401).send("Un-authorised Access");
        });
    } else {
      res.status(401).send("Un-authorised Access");
    }
  });

  console.log("DB Connected Successfully");
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => console.log("compiled successfully"));
