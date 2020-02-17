import {
  hash_string_to_words,
  string_to_words,
  words_to_string
} from "./auth/coinflex_worker";
import { ecp_sign, mpn_new, mpn_pack, mpn_unpack } from "./auth/ecp";
import {
  secp224k1_a,
  secp224k1_G,
  secp224k1_n,
  secp224k1_p
} from "./auth/constants";

const { WS_API_URL, CORE_ID, PRIVATE_KEY, API_KEY } = process.env;
const WebSocket = require("ws");
const btoa = require("btoa");
const atob = require("atob");

let websocket = new WebSocket(WS_API_URL);
let globalCallback = {};
let reConnect = false;
let reConnectCount = 10;

export const init = () => {
  websocket.on("error", console.error);
  websocket.on("message", onMessage);
  websocket.on("close", onClose);
  websocket.on("open", onOpen);
};

export const onOpen = () => {
  reConnect = false;
  reConnectCount = 10;
};

export const onClose = () => {
  reConnect = true;
  let timer = setInterval(() => {
    if (reConnectCount > 0 && reConnect) {
      init();
    } else {
      clearInterval(timer);
    }
    reConnectCount--;
  }, 1000);
};

export const send = (agentData, callback) => {
  agentData.tag && (globalCallback[agentData.tag] = callback);
  agentData.channel && (globalCallback[agentData.channel] = callback);
  if (websocket && websocket.readyState === websocket.OPEN) {
    wsSend(agentData);
  } else if (websocket && websocket.readyState === websocket.CONNECTING) {
    setTimeout(() => send(agentData, callback), 1000);
  } else {
    setTimeout(() => send(agentData, callback), 1000);
  }
};

export const wsSend = agentData => {
  websocket && websocket.send(JSON.stringify(agentData));
};

export const onWelcome = nonce => {
  const cookies = API_KEY;
  const packed_user_id = String.fromCharCode(
    0,
    0,
    0,
    0,
    (CORE_ID >> 24) & 0xff,
    (CORE_ID >> 16) & 0xff,
    (CORE_ID >> 8) & 0xff,
    CORE_ID & 0xff
  );
  let client_nonce = "";
  for (let i = 0; i < 16; ++i) {
    client_nonce += String.fromCharCode(Math.random() * 256);
  }

  const data = {
    content: packed_user_id + atob(nonce) + client_nonce,
    privkey: atob(PRIVATE_KEY)
  };
  const d = mpn_pack(string_to_words(data.privkey));
  const z = mpn_pack(hash_string_to_words(data.content));
  const r = mpn_new(8),
    s = mpn_new(8);
  ecp_sign(r, s, secp224k1_p, secp224k1_a, secp224k1_G, secp224k1_n, d, z, 8);
  const data2 = [
    words_to_string(mpn_unpack(r)),
    words_to_string(mpn_unpack(s))
  ];
  wsSend({
    method: "Authenticate",
    user_id: parseInt("" + CORE_ID),
    cookie: cookies,
    nonce: btoa(client_nonce),
    signature: [btoa(data2[0]), btoa(data2[1])],
    tag: 1
  });
};

export const onMessage = e => {
  const data = typeof e === "string" ? JSON.parse(e) : e;
  if (data.tag === 1 || data.error_code) return;
  data.tag && globalCallback[data.tag](data);
  data.channel && globalCallback[data.channel](data);
  let notice = data.notice;
  switch (notice) {
    case "Welcome":
      onWelcome(data.nonce);
      break;
    case "TickerChanged":
      break;
    case "OrdersMatched":
      break;
    case "OrderClosed":
      break;
    case "OrderOpened":
    case "OrderModified":
      break;
    case "BalanceChanged":
      break;
    default:
      break;
  }
};
