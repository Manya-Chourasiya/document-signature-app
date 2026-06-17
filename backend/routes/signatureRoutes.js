const express = require("express");
const multer = require("multer");
const path = require("path");
const Signature = require("../models/Signature");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(
      null,
      path.join(
        __dirname,
        "..",
        "uploads",
        "signatures"
      )
    );
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() + "-" + file.originalname
    );
  },
});

const upload = multer({ storage });

router.post(
  "/upload-image",
  upload.single("signature"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image uploaded",
        });
      }

      res.status(200).json({
        success: true,
        imagePath: `uploads/signatures/${req.file.filename}`,
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

router.post("/", async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);

    const signature = await Signature.create(
      req.body
    );

    console.log("SAVED:", signature);

    res.status(201).json({
      success: true,
      signature,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const signatures =
      await Signature.find();

    res.status(200).json(signatures);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/:documentId", async (req, res) => {
  try {
    const signatures =
      await Signature.find({
        documentId: req.params.documentId,
      }).sort({ createdAt: 1 });

    res.status(200).json(signatures);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;