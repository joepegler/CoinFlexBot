require("dotenv").config();
const axios = require("axios");
const websocket = require("./websocket.js");
const appData = require("./data.js");
const { BUCKETS_DOMAIN } = process.env;

websocket.init();
websocket.send(
  {
    tag: 2,
    method: "GetBalances"
  },
  ({ balances }) => (appData.balances = balances)
);

axios.get(BUCKETS_DOMAIN).then(({ data }) => (appData.buckets = data));
