const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { PDFDocument, rgb } = require("pdf-lib");

const Document = require("../models/Document");
const Signature = require("../models/Signature");

const router = express.Router();

/*
=================================
Multer Configuration
=================================
*/

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/*
=================================
Upload PDF
=================================
*/

router.post(
  "/upload",
  upload.single("pdf"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send("No file uploaded");
      }

      const document = new Document({
        fileName: req.file.filename,
        filePath: req.file.path,
      });

      await document.save();

      res.status(201).json({
        message: "PDF Uploaded Successfully",
        document,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

/*
=================================
Get All Documents
=================================
*/

router.get("/", async (req, res) => {
  try {
    const documents = await Document.find();

    res.status(200).json(documents);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch documents",
    });
  }
});

/*
=================================
Download Signed PDF
=================================
*/

router.get(
  "/download-signed/:documentId",
  async (req, res) => {
    try {
      const document = await Document.findById(
        req.params.documentId
      );

      if (!document) {
        return res.status(404).json({
          message: "Document not found",
        });
      }

      const signatures =
        await Signature.find({
          documentId: document._id,
        });

      const pdfPath = path.join(
        __dirname,
        "..",
        document.filePath
      );

      const existingPdfBytes =
        fs.readFileSync(pdfPath);

      const pdfDoc =
        await PDFDocument.load(
          existingPdfBytes
        );

      const pages = pdfDoc.getPages();

      const firstPage = pages[0];
      console.log(
        "PDF SIZE:",
        firstPage.getWidth(),
        firstPage.getHeight()
      );

      for (const sig of signatures) {
       if (!sig.signatureImage) continue;

       const imagePath = path.join(
        __dirname,
        "..",
        sig.signatureImage
       );

       const imageBytes =
        fs.readFileSync(imagePath);

       const signatureImage =
        await pdfDoc.embedJpg(imageBytes);

       firstPage.drawImage(
        signatureImage,
        {
          x: sig.x* (792 / 500),
          y:
           firstPage.getHeight() -
           sig.y * (792 / 500),
          width: 120,
          height: 60,
        }
      );
     }

      const pdfBytes =
        await pdfDoc.save();

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=signed-document.pdf"
      );

      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message:
          "Failed to generate signed PDF",
      });
    }
  }
);

module.exports = router;