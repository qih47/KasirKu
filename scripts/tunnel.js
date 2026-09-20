const ngrok = require("@ngrok/ngrok");

async function startTunnel() {
  try {
    const authtoken = process.env.NGROK_AUTHTOKEN || "3J07j1OV6QhFP494XmbMNzdFwXd_4kHUAS7miuHfQ9fUanY2m";
    const domain = process.env.NGROK_DOMAIN || "ensure-skyward-transfer.ngrok-free.dev";
    const port = parseInt(process.env.PORT || "3000", 10);

    console.log("🚀 Menghubungkan ngrok tunnel ke port", port, "...");
    
    let listener;
    try {
      listener = await ngrok.forward({
        addr: port,
        authtoken: authtoken,
        domain: domain,
      });
    } catch (err) {
      console.warn("⚠️ Gagal memakai custom domain, fallback ke auto domain:", err.message);
      listener = await ngrok.forward({
        addr: port,
        authtoken: authtoken,
      });
    }

    const url = listener.url();
    console.log("==================================================");
    console.log("🎉 NGROK TUNNEL ONLINE & AKTIF!");
    console.log(`🔗 Public URL: ${url}`);
    console.log(`📍 Forwarding ke: http://localhost:${port}`);
    console.log("==================================================");

    // Keep process alive
    process.stdin.resume();
  } catch (error) {
    console.error("❌ Error saat menjalankan ngrok tunnel:", error);
    process.exit(1);
  }
}

startTunnel();
