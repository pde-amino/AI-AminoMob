const express = require("express");
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const dotenv = require("dotenv").config();
const { getUserAsk, getModelResp, getUserAskAndModelResp } = require("./db.js");

const app = express();
const port = process.env.PORT || 3005;

app.use(express.json());

const MODEL_NAME = "gemini-pro";
const API_KEY = process.env.API_KEY;

async function runChat(userInput, modelResponse = "") {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.2,
      topK: 0,
      topP: 1,
      maxOutputTokens: 800,
    };

    const safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
      },
    ];

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [
        {
          role: "user",
          parts: [{ text: userInput }],
        },
        {
          role: "model",
          parts: [{ text: modelResponse }],
        },
      ],
    });

    const result = await chat.sendMessage(userInput);

    // Cek apakah hasilnya diblokir
    if (
      result.response.candidates &&
      result.response.candidates[0].safetyAttributes &&
      result.response.candidates[0].safetyAttributes.blocked
    ) {
      console.warn("Response was blocked due to safety settings.");
      return "Sorry, I cannot respond to that request.";
    }

    return result.response.text(); // Ambil teks dari respons
  } catch (error) {
    console.error("Error during chat processing:", error);
    throw new Error("Failed to process chat");
  }
}

function formatResponse(response) {
  const formatted = response
    .trim() // Remove any leading or trailing whitespace
    .replace(/(\r\n|\n|\r)/g, "\n") // Normalize line endings
    .replace(/\n\n+/g, "</p><p>") // Separate paragraphs with closing and opening paragraph tags
    .replace(/\n(?=\d+\.)/g, "<br>") // Add a line break before numbered lists
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Convert bold markdown to HTML bold tags
    .replace(/\*(.*?)\*/g, "<em>$1</em>") // Convert italic markdown to HTML italic tags
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>') // Convert URLs into clickable links
    .replace(/<p>\s*<\/p>/g, ""); // Remove empty paragraphs if any

  return `<p>${formatted}</p>`;
}

const getCategoryId = (userInput) => {
  const lowerCaseInput = userInput.toLowerCase();

  // Sapaan
  if (
    lowerCaseInput.includes(["hai", "hey", "halo", "hello", "hei"])
    // lowerCaseInput.includes() ||
    // lowerCaseInput.includes() ||
    // lowerCaseInput.includes() ||
    // lowerCaseInput.includes()
  ) {
    return 1; // ID untuk sapaan
  }

  // Pertanyaan tentang RSJD Dr. Amino Gondohutomo
  if (
    lowerCaseInput.includes("visi") ||
    lowerCaseInput.includes("misi") ||
    lowerCaseInput.includes("visi misi")
  ) {
    return 2; // ID untuk RSJD
  }

  if (
    lowerCaseInput.includes("fasilitas") ||
    lowerCaseInput.includes("layanan")
  ) {
    return 3; // ID untuk Fasilitas dan Layanan
  }

  if (
    lowerCaseInput.includes("kontak") ||
    lowerCaseInput.includes("alamat") ||
    lowerCaseInput.includes("menghubungi")
  ) {
    return 4; // ID untuk Kontak
  }

  if (lowerCaseInput.includes("jadwal dokter")) {
    return 5; // ID untuk Jadwal Dokter
  }

  // Pendaftaran
  if (
    lowerCaseInput.includes("mendaftar") ||
    lowerCaseInput.includes("pendaftaran") ||
    lowerCaseInput.includes("daftar")
  ) {
    return 13; // ID untuk pendaftaran
  }

  // Biaya Pendaftaran
  if (
    lowerCaseInput.includes("biaya mendaftar") ||
    lowerCaseInput.includes("biaya pendaftaran") ||
    lowerCaseInput.includes("biaya daftar")
  ) {
    return 14; // ID untuk biaya pendaftaran
  }

  // Syarat BPJS
  if (lowerCaseInput.includes("syarat bpjs")) {
    return 15; // ID untuk syarat BPJS
  }

  // Poli
  if (lowerCaseInput.includes("poli jiwa dewasa")) {
    return 16; // ID untuk poli jiwa dewasa
  }

  if (lowerCaseInput.includes("poli kandungan")) {
    return 17; // ID untuk poli kandungan
  }

  if (lowerCaseInput.includes("poli syaraf")) {
    return 18; // ID untuk poli syaraf
  }

  if (lowerCaseInput.includes("poli penyakit dalam")) {
    return 19; // ID untuk poli penyakit dalam
  }

  if (lowerCaseInput.includes("poli gigi")) {
    return 20; // ID untuk poli gigi
  }

  if (lowerCaseInput.includes("poli bedah mulut")) {
    return 21; // ID untuk poli bedah mulut
  }

  if (lowerCaseInput.includes("poli kesehatan anak")) {
    return 22; // ID untuk poli kesehatan anak
  }

  if (lowerCaseInput.includes("poli bedah umum")) {
    return 23; // ID untuk poli bedah umum
  }

  if (lowerCaseInput.includes("poli adiksi")) {
    return 24; // ID untuk poli adiksi
  }

  // Penjemputan pasien
  if (
    lowerCaseInput.includes("penjemputan pasien") ||
    lowerCaseInput.includes("menjemput pasien")
  ) {
    return 25; // ID untuk penjemputan pasien
  }

  // Biaya Persalinan
  if (lowerCaseInput.includes("biaya persalinan")) {
    return 26; // ID untuk biaya persalinan
  }

  // Informasi Lain
  if (
    lowerCaseInput.includes("informasi lain") ||
    lowerCaseInput.includes("informasi lainnya") ||
    lowerCaseInput.includes("info lainnya") ||
    lowerCaseInput.includes("info lain")
  ) {
    return 27; // ID untuk informasi lain
  }

  // Pengaduan
  if (
    lowerCaseInput.includes("pengaduan") ||
    lowerCaseInput.includes("kritik dan saran") ||
    lowerCaseInput.includes("krisar")
  ) {
    return 28; // ID untuk pengaduan
  }

  // Jenguk Pasien
  if (
    lowerCaseInput.includes("jenguk pasien") ||
    lowerCaseInput.includes("jam besuk")
  ) {
    return 29; // ID untuk jenguk pasien
  }

  // Jenguk Pasien
  if (
    lowerCaseInput.includes("Tes Dev") ||
    lowerCaseInput.includes("tes dev")
  ) {
    return 30; // ID untuk jenguk pasien
  }

  if (
    lowerCaseInput.includes("Disclaimer Chat") ||
    lowerCaseInput.includes("disclaimer chat")
  ) {
    return 31; // ID untuk jenguk pasien
  }

  // Fallback untuk input yang tidak dikenali
  if (
    lowerCaseInput.includes("apa") ||
    lowerCaseInput.includes("bagaimana") ||
    lowerCaseInput.includes("gimana") ||
    lowerCaseInput.includes("tanya") ||
    lowerCaseInput.includes("bertanya") ||
    lowerCaseInput.includes("menanyakan")
  ) {
    return 6; // ID untuk topik kesehatan mental umum
  }

  if (
    lowerCaseInput.includes("gejala") ||
    lowerCaseInput.includes("mengenali") ||
    lowerCaseInput.includes("cara") ||
    lowerCaseInput.includes("mendeteksi") ||
    lowerCaseInput.includes("membedakan") ||
    lowerCaseInput.includes("perbedaan") ||
    lowerCaseInput.includes("tanda-tanda")
  ) {
    return 7; // ID untuk topik kesehatan mental lebih mendalam
  }

  if (
    lowerCaseInput.includes("merawat") ||
    lowerCaseInput.includes("pengobatan") ||
    lowerCaseInput.includes("dosis") ||
    lowerCaseInput.includes("obat") ||
    lowerCaseInput.includes("sembuh") ||
    lowerCaseInput.includes("menyembuhkan") ||
    lowerCaseInput.includes("disembuhkan")
  ) {
    return 8; // ID untuk terapi dan pengobatan
  }

  if (
    lowerCaseInput.includes("perawatan") ||
    lowerCaseInput.includes("kerabat") ||
    lowerCaseInput.includes("keluarga") ||
    lowerCaseInput.includes("obat")
  ) {
    return 9; // ID untuk perawatan orang di sekitar
  }

  // Ucapan selamat tinggal
  if (
    lowerCaseInput.includes("terima kasih") ||
    lowerCaseInput.includes("makasih") ||
    lowerCaseInput.includes("sampai jumpa") ||
    lowerCaseInput.includes("selamat tinggal")
  ) {
    return 12; // ID untuk ucapan selamat tinggal
  }

  // Jika tidak ada kategori yang sesuai
  console.warn("Input tidak dikenali, mengembalikan ID default 10.");
  return 10; // ID default untuk input yang tidak sesuai kategori
};

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/loader.gif", (req, res) => {
  res.sendFile(__dirname + "/loader.gif");
});

app.get("/logo.png", (req, res) => {
  res.sendFile(__dirname + "/logo.png");
});

app.post("/chat", async (req, res) => {
  try {
    const userInput = req.body?.userInput;
    console.log("incoming /chat req", userInput);

    if (!userInput) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const categoryId = getCategoryId(userInput);
    let modelResponse = "";

    // Ambil respons yang sesuai dari database
    const modelResp = await getModelResp();
    const matchedResp = modelResp.find((item) => item.id === categoryId);
    if (matchedResp) {
      modelResponse = matchedResp.text;
    }

    // Jika ID adalah 10 atau 11, tambahkan logika khusus
    let response = modelResponse;
    if (categoryId === 10) {
      response =
        "Terima kasih telah menggunakan layanan chat AI Otomatis Amino Hospital, namun sayangnya kami tidak memiliki akses terkait tentang hal yang telah anda tanyakan. Untuk informasi lebih lanjut, anda bisa mencarinya sendiri di sumber terkait";
    } else if (categoryId === 11) {
      response = "Maaf, apakah anda bisa mengulangi pertanyaan anda?";
    } else if (categoryId >= 6) {
      response = await runChat(userInput, modelResponse);
    }

    const formattedResponse = formatResponse(response);

    if (formattedResponse === "Sorry, I cannot respond to that request.") {
      return res.json({
        response:
          "Your request cannot be processed due to safety restrictions.",
      });
    }

    res.json({ response: formattedResponse });
  } catch (error) {
    console.error("Error in chat endpoint:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on ${process.env.DB_HOST}:${port}`);
});
