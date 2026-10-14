const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const copyBtn = document.getElementById("copy-btn");
const clearBtn = document.getElementById("clear-btn");
const fileInput = document.getElementById("file-input");
const statusText = document.getElementById("status");
const resultBox = document.getElementById("result");

const scanner = new Html5Qrcode("reader");

let cameraRunning = false;
let lastResult = "";

function showResult(text) {
  lastResult = text;
  resultBox.replaceChildren();

  // Transforma links HTTP/HTTPS em links clicáveis.
  try {
    const url = new URL(text);

    if (url.protocol === "http:" || url.protocol === "https:") {
      const link = document.createElement("a");
      link.href = url.href;
      link.textContent = text;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      resultBox.appendChild(link);
    } else {
      resultBox.textContent = text;
    }
  } catch {
    resultBox.textContent = text;
  }

  copyBtn.disabled = false;
  statusText.textContent = "QR Code lido com sucesso!";
}

async function stopCamera() {
  if (!cameraRunning) return;

  try {
    await scanner.stop();
    cameraRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusText.textContent = "Câmera desligada.";
  } catch (error) {
    statusText.textContent = "Não foi possível parar a câmera.";
    console.error(error);
  }
}

startBtn.addEventListener("click", async () => {
  try {
    statusText.textContent = "Procurando câmera...";
    startBtn.disabled = true;

    const cameras = await Html5Qrcode.getCameras();

    if (!cameras || cameras.length === 0) {
      throw new Error("Nenhuma câmera encontrada.");
    }

    // Prefere a câmera traseira em celulares.
    const camera =
      cameras.find((item) =>
        /back|rear|traseira|environment/i.test(item.label),
      ) || cameras[cameras.length - 1];

    await scanner.start(
      camera.id,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      (decodedText) => {
        showResult(decodedText);
      },
      () => {
        // Ignora tentativas em que nenhum QR Code foi encontrado.
      },
    );

    cameraRunning = true;
    stopBtn.disabled = false;
    statusText.textContent = "Aponte a câmera para um QR Code.";
  } catch (error) {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusText.textContent =
      "Não foi possível abrir a câmera. Verifique as permissões.";
    console.error(error);
  }
});

stopBtn.addEventListener("click", stopCamera);

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];

  if (!file) return;

  try {
    await stopCamera();

    statusText.textContent = "Lendo a imagem...";

    const decodedText = await scanner.scanFile(file, true);
    showResult(decodedText);
  } catch (error) {
    statusText.textContent = "Não encontramos um QR Code nessa imagem.";
    console.error(error);
  } finally {
    fileInput.value = "";
  }
});

copyBtn.addEventListener("click", async () => {
  if (!lastResult) return;

  try {
    await navigator.clipboard.writeText(lastResult);
    statusText.textContent = "Resultado copiado!";
  } catch (error) {
    statusText.textContent =
      "Não foi possível copiar. Selecione o resultado manualmente.";
    console.error(error);
  }
});
