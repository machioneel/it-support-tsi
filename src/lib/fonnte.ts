const FONNTE_TOKEN = import.meta.env.VITE_FONNTE_TOKEN;

export async function sendWhatsAppMessage(target: string, message: string) {
  if (!FONNTE_TOKEN) {
    console.warn("Fonnte token is missing. Please set VITE_FONNTE_TOKEN in .env");
    return false;
  }

  try {
    const data = new FormData();
    data.append('target', target);
    data.append('message', message);
    data.append('countryCode', '62'); // Optional tapi membantu jika nomor tidak ada kode negaranya

    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Authorization": FONNTE_TOKEN.trim(),
      },
      body: data,
    });

    const result = await response.json();
    console.log("Fonnte Response:", result);
    return result.status === true; // API Fonnte mengembalikan { status: true/false, ... }
  } catch (error) {
    console.error("Error sending WhatsApp message via Fonnte:", error);
    return false;
  }
}
