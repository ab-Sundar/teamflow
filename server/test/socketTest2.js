const { io } = require("socket.io-client");

const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzIiwiaWF0IjoxNzkxMjY2MjE3LCJleHAiOjE3OTEyNjkyMTd9.QwwwLXccjAl5h9ch8I4VZ5BTb1I_VmfgaPqZJw2FEaQ";
const WORKSPACE_ID = "1";

const socket = io("http://localhost:3000", {
  auth: {
    token: TOKEN,
  },
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  socket.emit(
    "workspace:join",
    WORKSPACE_ID,
    (response) => {
      console.log("Workspace join response:", response);
    }
  );
});

socket.on("card:created", (data) => {
  console.log("\n=== CARD CREATED EVENT ===");
  console.log(JSON.stringify(data, null, 2));
});

socket.on("card:moved", (data) => {
  console.log("\n=== CARD MOVED EVENT ===");
  console.log(JSON.stringify(data, null, 2));
});

socket.on("card:updated", (data) => {
  console.log("\n=== CARD UPDATED EVENT ===");
  console.log(JSON.stringify(data, null, 2));
});

socket.on("card:deleted", (data) => {
  console.log("\n=== CARD DELETED EVENT ===");
  console.log(JSON.stringify(data, null, 2));
});

//-----------List-------------
socket.on("list:created", (data) => {
  console.log("\n=== LIST CREATED EVENT ===");
  console.log(JSON.stringify(data, null, 2));
});

socket.on("list:updated", (data) => {
  console.log("\n=== LIST UPDATED ===");
  console.log(JSON.stringify(data, null, 2));
});

socket.on("list:deleted", (data) => {
  console.log("\n=== LIST DELETED ===");
  console.log(JSON.stringify(data, null, 2));
});
//---------------Board----------------
socket.on("board:created", (data) => {
  console.log("\n=== BOARD CREATED ===");
  console.log(JSON.stringify(data, null, 2));
});

socket.on("board:updated", (data) => {
  console.log("\n=== BOARD UPDATED ===");
  console.log(JSON.stringify(data, null, 2));
});

socket.on("board:deleted", (data) => {
  console.log("\n=== BOARD DELETED ===");
  console.log(JSON.stringify(data, null, 2));
});
//-------------------comment---------------------
socket.on("comment:created", (data) => {
  console.log("\n=== COMMENT CREATED ===");
  console.log(JSON.stringify(data, null, 2));
});

socket.on("comment:deleted", (data) => {
  console.log("\n=== COMMENT DELETED ===");
  console.log(JSON.stringify(data, null, 2));
});
//---------------memeber--------------------
socket.on("member:added", (data) => {
  console.log("\n=== MEMBER ADDED ===");
  console.log(JSON.stringify(data, null, 2));
});

socket.on("member:removed", (data) => {
  console.log("\n=== MEMBER REMOVED ===");
  console.log(JSON.stringify(data, null, 2));
});

socket.on("member:role-updated", (data) => {
  console.log("\n=== MEMBER ROLE UPDATED ===");
  console.log(JSON.stringify(data, null, 2));
});

//--------------------------
socket.on("connect_error", (error) => {
  console.error("Connection error:", error.message);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});