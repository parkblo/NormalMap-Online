const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");
const http = require("http");
const { createReadStream } = require("fs");

class BatchProcessor {
  constructor() {
    this.browser = null;
    this.page = null;
    this.server = null;
    this.port = 8080;
    this.inputDir = path.join(__dirname, "input");
    this.outputDir = path.join(__dirname, "output");
  }

  async startHttpServer() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        let filePath = path.join(
          __dirname,
          req.url === "/" ? "index.html" : req.url
        );

        const extname = path.extname(filePath);
        let contentType = "text/html";

        switch (extname) {
          case ".js":
            contentType = "text/javascript";
            break;
          case ".css":
            contentType = "text/css";
            break;
          case ".json":
            contentType = "application/json";
            break;
          case ".png":
            contentType = "image/png";
            break;
          case ".jpg":
          case ".jpeg":
            contentType = "image/jpeg";
            break;
          case ".gif":
            contentType = "image/gif";
            break;
          case ".svg":
            contentType = "image/svg+xml";
            break;
        }

        fs.readFile(filePath, (error, content) => {
          if (error) {
            if (error.code == "ENOENT") {
              res.writeHead(404);
              res.end("File not found");
            } else {
              res.writeHead(500);
              res.end("Server error: " + error.code);
            }
          } else {
            res.writeHead(200, {
              "Content-Type": contentType,
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            });
            res.end(content);
          }
        });
      });

      this.server.listen(this.port, () => {
        console.log(`HTTP 서버 시작됨: http://localhost:${this.port}`);
        resolve();
      });

      this.server.on("error", reject);
    });
  }

  async init() {
    await fs.ensureDir(this.outputDir);
    await this.startHttpServer();

    this.browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--allow-running-insecure-content",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
      ],
    });

    this.page = await this.browser.newPage();

    this.page.on("console", (msg) => {
      console.log(`[브라우저] ${msg.type()}: ${msg.text()}`);
    });

    this.page.on("pageerror", (error) => {
      console.error(`[브라우저 오류] ${error.message}`);
    });

    await this.page.goto(`http://localhost:${this.port}`);
    await this.page.waitForSelector("#height_canvas");
    console.log("페이지 로딩 완료");

    console.log("JavaScript 객체 초기화 대기 중...");
    await this.page.waitForFunction(
      () => {
        return (
          typeof NMO_Main !== "undefined" &&
          typeof NMO_FileDrop !== "undefined" &&
          typeof NMO_NormalMap !== "undefined" &&
          typeof NMO_DisplacementMap !== "undefined" &&
          typeof NMO_AmbientOccMap !== "undefined" &&
          typeof NMO_SpecularMap !== "undefined"
        );
      },
      { timeout: 10000 }
    );

    console.log("모든 JavaScript 객체 초기화 완료");

    await this.injectSaveToFileSystem();
  }

  async injectSaveToFileSystem() {
    await this.page.evaluate((outputDir) => {
      window.saveToFileSystem = function (canvas, filename, type = "png") {
        return new Promise((resolve) => {
          const quality = type === "jpg" ? 0.9 : undefined;
          const mimeType = type === "jpg" ? "image/jpeg" : "image/png";

          canvas.toBlob(
            (blob) => {
              const reader = new FileReader();
              reader.onload = () => {
                const arrayBuffer = reader.result;
                const uint8Array = new Uint8Array(arrayBuffer);
                window.saveFileData = {
                  filename: filename,
                  data: Array.from(uint8Array),
                };
                resolve();
              };
              reader.readAsArrayBuffer(blob);
            },
            mimeType,
            quality
          );
        });
      };

      console.log("NMO_Main 객체 확인:", typeof NMO_Main);
      console.log(
        "기존 downloadImage 함수 확인:",
        typeof NMO_Main.downloadImage
      );

      const originalDownloadImage = NMO_Main.downloadImage;
      NMO_Main.downloadImage = async function (type) {
        console.log("Processing " + type);
        var canvas = document.createElement("canvas");
        var file_name = "download";
        var file_type = NMO_Main.getImageType();

        if (type == "NormalMap") {
          canvas.width = NMO_NormalMap.normal_canvas.width;
          canvas.height = NMO_NormalMap.normal_canvas.height;
          var context = canvas.getContext("2d");
          if (file_type == "png")
            context.globalAlpha = $("#transparency_nmb").val() / 100;
          context.drawImage(NMO_NormalMap.normal_canvas, 0, 0);
          file_name = "NormalMap";
        } else if (type == "DisplacementMap") {
          canvas.width = NMO_DisplacementMap.displacement_canvas.width;
          canvas.height = NMO_DisplacementMap.displacement_canvas.height;
          var context = canvas.getContext("2d");
          if (file_type == "png")
            context.globalAlpha = $("#transparency_nmb").val() / 100;
          context.drawImage(NMO_DisplacementMap.displacement_canvas, 0, 0);
          file_name = "DisplacementMap";
        } else if (type == "AmbientOcclusionMap") {
          canvas.width = NMO_AmbientOccMap.ao_canvas.width;
          canvas.height = NMO_AmbientOccMap.ao_canvas.height;
          var context = canvas.getContext("2d");
          if (file_type == "png")
            context.globalAlpha = $("#transparency_nmb").val() / 100;
          context.drawImage(NMO_AmbientOccMap.ao_canvas, 0, 0);
          file_name = "AmbientOcclusionMap";
        } else if (type == "SpecularMap") {
          canvas.width = NMO_SpecularMap.specular_canvas.width;
          canvas.height = NMO_SpecularMap.specular_canvas.height;
          var context = canvas.getContext("2d");
          if (file_type == "png")
            context.globalAlpha = $("#transparency_nmb").val() / 100;
          context.drawImage(NMO_SpecularMap.specular_canvas, 0, 0);
          file_name = "SpecularMap";
        }

        if (document.getElementById("file_name").value != "")
          file_name = document.getElementById("file_name").value;

        await window.saveToFileSystem(
          canvas,
          file_name + "." + file_type,
          file_type
        );
        return file_name + "." + file_type;
      };
    }, this.outputDir);
  }

  async processFile(filePath) {
    const fileName = path.basename(filePath, path.extname(filePath));
    console.log(`파일 처리 중: ${fileName}`);

    const fileBuffer = await fs.readFile(filePath);
    const fileExtension = path.extname(filePath).toLowerCase();
    let mimeType = "image/jpeg";

    if (fileExtension === ".png") mimeType = "image/png";
    else if (fileExtension === ".bmp") mimeType = "image/bmp";
    else if (fileExtension === ".tiff" || fileExtension === ".tif")
      mimeType = "image/tiff";

    const fileData = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;

    console.log("이미지 로딩 시작...");
    await this.page.evaluate((fileData) => {
      return NMO_FileDrop.loadHeightmap(fileData);
    }, fileData);

    console.log("맵 생성 완료 대기 중...");
    await this.page.waitForTimeout(1000);

    const mapStatus = await this.page.evaluate(() => {
      return {
        normalCanvas: NMO_NormalMap.normal_canvas ? "OK" : "NOT_READY",
        displacementCanvas: NMO_DisplacementMap.displacement_canvas
          ? "OK"
          : "NOT_READY",
        aoCanvas: NMO_AmbientOccMap.ao_canvas ? "OK" : "NOT_READY",
        specularCanvas: NMO_SpecularMap.specular_canvas ? "OK" : "NOT_READY",
      };
    });

    console.log("맵 상태:", mapStatus);

    console.log("커스텀 설정값 적용 중...");
    await this.page.evaluate(() => {
      document.getElementById("strength_nmb").value = 5;
      document.getElementById("strength_slider").value = 5;
      document.getElementById("level_nmb").value = 5;
      document.getElementById("level_slider").value = 5;
      document.getElementById("blur_sharp_nmb").value = 2;
      document.getElementById("blur_sharp_slider").value = 2;
      document.getElementById("dm_contrast_nmb").value = 0.11;
      document.getElementById("dm_contrast_slider").value = 0.11;
      document.getElementById("ao_strength_nmb").value = 0.78;
      document.getElementById("ao_strength_slider").value = 0.78;
      document.getElementById("specular_range_nmb").value = 0.75;
      document.getElementById("specular_range_slider").value = 0.75;

      NMO_NormalMap.setNormalSetting("strength", 5);
      NMO_NormalMap.setNormalSetting("level", 5);
      NMO_NormalMap.setNormalSetting("blur_sharp", 2);

      NMO_DisplacementMap.setDisplacementSetting("contrast", 0.11);

      NMO_AmbientOccMap.setAOSetting("strength", 0.78);

      NMO_SpecularMap.setSpecularSetting("spec_range", 0.75);

      console.log("설정값 적용 완료");

      NMO_NormalMap.createNormalMap();
      NMO_DisplacementMap.createDisplacementMap();
      NMO_AmbientOccMap.createAmbientOcclusionTexture();
      NMO_SpecularMap.createSpecularTexture();

      console.log("커스텀 설정으로 맵 재생성 완료");
    });

    const results = [];
    const includeNormal = true;
    const includeDisplacement = true;
    const includeAmbient = true;
    const includeSpecular = true;

    if (includeNormal) {
      console.log("Normal Map 생성 시작...");
      await this.page.evaluate((baseName) => {
        document.getElementById("file_name").value = `${baseName}_normal`;
        console.log("파일명 설정:", document.getElementById("file_name").value);
      }, fileName);

      try {
        const savedFileName = await this.page.evaluate(async () => {
          console.log('NMO_Main.downloadImage("NormalMap") 호출');
          const result = await NMO_Main.downloadImage("NormalMap");
          console.log("다운로드 결과:", result);
          return result;
        });

        console.log("Normal Map 파일명:", savedFileName);
        await this.saveFile(savedFileName);
        results.push(savedFileName);
        console.log("Normal Map 저장 완료");
      } catch (error) {
        console.error("Normal Map 생성 중 오류:", error);
      }
    }

    if (includeDisplacement) {
      console.log("Displacement Map 생성 시작...");
      await this.page.evaluate((baseName) => {
        document.getElementById("file_name").value = `${baseName}_displacement`;
      }, fileName);

      try {
        const savedFileName = await this.page.evaluate(async () => {
          console.log('NMO_Main.downloadImage("DisplacementMap") 호출');
          const result = await NMO_Main.downloadImage("DisplacementMap");
          console.log("다운로드 결과:", result);
          return result;
        });

        console.log("Displacement Map 파일명:", savedFileName);
        await this.saveFile(savedFileName);
        results.push(savedFileName);
        console.log("Displacement Map 저장 완료");
      } catch (error) {
        console.error("Displacement Map 생성 중 오류:", error);
      }
    }

    if (includeAmbient) {
      console.log("Ambient Occlusion Map 생성 시작...");
      await this.page.evaluate((baseName) => {
        document.getElementById("file_name").value = `${baseName}_ambient`;
      }, fileName);

      try {
        const savedFileName = await this.page.evaluate(async () => {
          console.log('NMO_Main.downloadImage("AmbientOcclusionMap") 호출');
          const result = await NMO_Main.downloadImage("AmbientOcclusionMap");
          console.log("다운로드 결과:", result);
          return result;
        });

        console.log("Ambient Occlusion Map 파일명:", savedFileName);
        await this.saveFile(savedFileName);
        results.push(savedFileName);
        console.log("Ambient Occlusion Map 저장 완료");
      } catch (error) {
        console.error("Ambient Occlusion Map 생성 중 오류:", error);
      }
    }

    if (includeSpecular) {
      console.log("Specular Map 생성 시작...");
      await this.page.evaluate((baseName) => {
        document.getElementById("file_name").value = `${baseName}_specular`;
      }, fileName);

      try {
        const savedFileName = await this.page.evaluate(async () => {
          console.log('NMO_Main.downloadImage("SpecularMap") 호출');
          const result = await NMO_Main.downloadImage("SpecularMap");
          console.log("다운로드 결과:", result);
          return result;
        });

        console.log("Specular Map 파일명:", savedFileName);
        await this.saveFile(savedFileName);
        results.push(savedFileName);
        console.log("Specular Map 저장 완료");
      } catch (error) {
        console.error("Specular Map 생성 중 오류:", error);
      }
    }

    console.log(`${fileName} 처리 완료. 생성된 파일: ${results.join(", ")}`);
    return results;
  }

  async saveFile(filename) {
    console.log(`saveFile 호출됨, 파일명: ${filename}`);

    const fileData = await this.page.evaluate(() => {
      console.log(
        "window.saveFileData 확인:",
        window.saveFileData ? "존재함" : "존재하지 않음"
      );
      return window.saveFileData;
    });

    console.log("파일 데이터 확인:", fileData ? "데이터 있음" : "데이터 없음");

    if (fileData) {
      const outputPath = path.join(this.outputDir, fileData.filename);
      const buffer = Buffer.from(fileData.data);
      console.log(`파일 크기: ${buffer.length} bytes`);
      await fs.writeFile(outputPath, buffer);
      console.log(`파일 저장됨: ${outputPath}`);

      await this.page.evaluate(() => {
        window.saveFileData = null;
      });
    } else {
      console.error("저장할 파일 데이터가 없습니다");
    }
  }

  async processAllFiles() {
    try {
      const files = await fs.readdir(this.inputDir);
      const imageFiles = files.filter((file) =>
        /\.(jpg|jpeg|png|bmp|tiff|tga)$/i.test(file)
      );

      console.log(`${imageFiles.length}개의 이미지 파일 발견`);

      for (const file of imageFiles) {
        const filePath = path.join(this.inputDir, file);
        await this.processFile(filePath);
        //await this.page.waitForTimeout(1000);
      }

      console.log("모든 파일 처리 완료");
    } catch (error) {
      console.error("파일 처리 중 오류 발생:", error);
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
    if (this.server) {
      this.server.close();
      console.log("HTTP 서버 종료됨");
    }
  }
}

async function main() {
  const processor = new BatchProcessor();

  try {
    console.log("배치 처리 시작...");
    await processor.init();
    await processor.processAllFiles();
  } catch (error) {
    console.error("배치 처리 중 오류 발생:", error);
  } finally {
    await processor.close();
    console.log("배치 처리 완료");
  }
}

if (require.main === module) {
  main();
}

module.exports = BatchProcessor;
