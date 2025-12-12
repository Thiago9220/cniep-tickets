// ============== OPTIONAL CLAMAV SCAN ==============
// ClamAV integration for production (requires clamd running)
export async function scanFileWithClamAV(filePath: string): Promise<{ clean: boolean; message?: string }> {
  // Only scan in production if CLAMAV_HOST is configured
  if (process.env.NODE_ENV !== "production" || !process.env.CLAMAV_HOST) {
    return { clean: true };
  }

  try {
    const net = await import("net");
    const fs = await import("fs");

    return new Promise((resolve) => {
      const client = new net.Socket();
      const host = process.env.CLAMAV_HOST || "localhost";
      const port = parseInt(process.env.CLAMAV_PORT || "3310");

      const timeout = setTimeout(() => {
        client.destroy();
        console.warn("[ClamAV] Scan timeout, allowing file");
        resolve({ clean: true, message: "Scan timeout" });
      }, 30000);

      client.connect(port, host, () => {
        const fileBuffer = fs.readFileSync(filePath);
        const size = Buffer.alloc(4);
        size.writeUInt32BE(fileBuffer.length, 0);

        client.write("zINSTREAM\0");
        client.write(size);
        client.write(fileBuffer);
        client.write(Buffer.alloc(4)); // End of stream
      });

      let response = "";
      client.on("data", (data) => {
        response += data.toString();
      });

      client.on("close", () => {
        clearTimeout(timeout);
        const isClean = response.includes("OK") && !response.includes("FOUND");
        resolve({
          clean: isClean,
          message: isClean ? undefined : response.trim()
        });
      });

      client.on("error", (err) => {
        clearTimeout(timeout);
        console.warn("[ClamAV] Connection error:", err.message);
        resolve({ clean: true, message: "Scan unavailable" });
      });
    });
  } catch (error) {
    console.warn("[ClamAV] Scan error:", error);
    return { clean: true, message: "Scan error" };
  }
}
