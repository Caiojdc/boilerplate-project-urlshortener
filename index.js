require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');
const dns = require('dns');
const urlparser = require('url');
const { url } = require('inspector');



const Client = new MongoClient(process.env.DB_URL);
const db = Client.db('urlshortener');
const urls = db.collection('urls');



// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl/', function(req, res) {
  console.log(req.body);
  const url = req.body.url;
  const dnslookup = dns.lookup(urlparser.parse(url).hostname, async(err, address) => {
    if(!address) {
      return res.json({error: 'invalid url'});
    } else{


      const urlCount = await urls.countDocuments({})
      const urlDoc = {
        url,
        short_url: urlCount
      }

      const result = await urls.insertOne(urlDoc);
      console.log(result);
      res.json({
        'original_url': url, 'short_url': urlCount
      })


    }
})});

app.get('/api/shorturl/:shorturl', async function(req, res) {
  const shorturl = parseInt(req.params.shorturl);
  const urlDoc = await urls.findOne({short_url: shorturl});
  if(!urlDoc) {
    return res.json({error: 'No short URL found for the given input'});
  } else {
    res.redirect(urlDoc.url);
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
