import { createApp } from "./app.js";
import { port } from "./config.js";

const app = createApp();

app.listen(port, "0.0.0.0", () => {
  console.log(`AsafOS backend listening on port ${port}`);
});
