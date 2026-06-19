import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  FiHome,
  FiFileText,
  FiUpload,
  FiDownload,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiActivity,
  FiImage,
} from "react-icons/fi";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const API_BASE = "https://signflow-document-signature-app-leli.onrender.com";

const PDF_PREVIEW_WIDTH = 750;

function App() {
  const [documents, setDocuments] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [signatureMode, setSignatureMode] = useState(false);
  const [signatureImage, setSignatureImage] = useState(null);
  const [signatureImagePath, setSignatureImagePath] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [generatedLink, setGeneratedLink] = useState("");
  const [publicLinks, setPublicLinks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [message, setMessage] = useState("");

  const signatureImagePathRef = useRef(signatureImagePath);
  useEffect(() => {
    signatureImagePathRef.current = signatureImagePath;
  }, [signatureImagePath]);

  const pdfWrapperRef = useRef(null);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/docs`);
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSignatures = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/signatures`);
      const data = await response.json();
      setSignatures(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPublicLinks = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/sign-links`);
      const data = await response.json();
      setPublicLinks(data);
    } catch (error) {
      console.error(error);
    }
  };

  const generateAuditLogs = () => {
    const logs = [];
    documents.forEach((doc) => {
      logs.push({ type: "Document Uploaded", message: doc.fileName, time: doc._id });
    });
    signatures.forEach((sig) => {
      logs.push({ type: "Signature Added", message: sig.signer, time: sig.createdAt });
    });
    publicLinks.forEach((link) => {
      logs.push({
        type: "Public Link Generated",
        message: link.documentId?.fileName || "Deleted Document",
        time: link.createdAt,
      });
    });
    setAuditLogs(logs.reverse());
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showMessage("Please select a PDF first");
      return;
    }
    const formData = new FormData();
    formData.append("pdf", selectedFile);
    try {
      const response = await fetch(`${API_BASE}/api/docs/upload`, {
        method: "POST",
        body: formData,
      });
      await response.json();
      showMessage("Document uploaded successfully");
      fetchDocuments();
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignatureImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSignatureImage(file);
    setUploadingSignature(true);

    const formData = new FormData();
    formData.append("signature", file);

    try {
      const response = await fetch(`${API_BASE}/api/signatures/upload-image`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setSignatureImagePath(data.imagePath);
      signatureImagePathRef.current = data.imagePath;
      showMessage("Signature image uploaded! Click 'Add Signature' and place it on the PDF.");
    } catch (error) {
      console.error(error);
      showMessage("Failed to upload signature image.");
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleSignaturePlacement = async (e) => {
    if (!signatureMode || !selectedDoc) return;

    if (e.target.closest("button")) return;

    const currentPath = signatureImagePathRef.current;
    if (!currentPath) {
      showMessage("Please upload a signature image first before placing it.");
      setSignatureMode(false);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    const previewWidth = rect.width;
    const previewHeight = rect.height;

    try {
      const response = await fetch(`${API_BASE}/api/signatures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedDoc._id,
          x,
          y,
          page: 1,
          signer: "manya@gmail.com",
          signatureImage: currentPath,
          pageWidth: previewWidth,
          pageHeight: previewHeight,
        }),
      });
      const result = await response.json();
      console.log(result);
      showMessage(`Signature placed at (${x}, ${y})`);
      setSignatureMode(false);
      fetchSignatures();
    } catch (error) {
      console.error(error);
    }
  };

  const generatePublicLink = async () => {
    if (!selectedDoc) {
      showMessage("Please select a document first");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/sign-links/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: selectedDoc._id }),
      });
      const data = await response.json();
      setGeneratedLink(data.publicUrl);
      showMessage("Public link generated");
    } catch (error) {
      console.error(error);
    }
  };

  const deleteDocument = async (documentId) => {
    try {
      await fetch(`${API_BASE}/api/docs/${documentId}`, { method: "DELETE" });
      fetchDocuments();
      showMessage("Document deleted");
    } catch (error) {
      console.error(error);
    }
  };

  const deleteSignature = async (signatureId) => {
    setSignatures((prev) => prev.filter((s) => s._id !== signatureId));
    try {
      const res = await fetch(`${API_BASE}/api/signatures/${signatureId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.error("Server failed to delete signature, re-fetching...");
        fetchSignatures();
      }
    } catch (error) {
      console.error(error);
      fetchSignatures();
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchSignatures();
    fetchPublicLinks();
  }, []);

  useEffect(() => {
    generateAuditLogs();
  }, [documents, signatures, publicLinks]);

  const totalDocuments = documents.length;
  const signedCount = signatures.filter((sig) => sig.status === "Signed").length;
  const pendingCount = signatures.filter((sig) => sig.status === "Pending").length;
  const rejectedCount = signatures.filter((sig) => sig.status === "Rejected").length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Toast Notification */}
      {message && (
        <div className="fixed top-5 right-5 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg z-50 transition-all">
          {message}
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-slate-900 text-white p-6 flex flex-col">
          <h1 className="text-3xl font-bold mb-10">SignFlow</h1>
          <div className="space-y-4 flex-1">
            {[
              { key: "dashboard", icon: <FiHome />, label: "Dashboard" },
              { key: "documents", icon: <FiFileText />, label: "Documents" },
              { key: "audit", icon: <FiActivity />, label: "Audit Logs" },
              { key: "links", icon: <FiDownload />, label: "Public Links" },
            ].map(({ key, icon, label }) => (
              <div
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${
                  activeSection === key ? "bg-slate-800" : "hover:bg-slate-800"
                }`}
              >
                {icon}
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">

          {/* Top Bar */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-slate-800">Dashboard</h1>
              <p className="text-slate-500">Secure Digital Signature Platform</p>
            </div>
            <button
              onClick={() => setActiveSection("documents")}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700"
            >
              <FiUpload />
              New Document
            </button>
          </div>

          {/* Dashboard Section */}
          {activeSection === "dashboard" && (
            <>
              <div className="grid grid-cols-4 gap-5 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-sm p-6 text-white hover:shadow-md transition">
                  <FiFileText size={24} />
                  <p className="text-blue-100 text-sm mt-3">Documents</p>
                  <h2 className="text-4xl font-bold mt-2">{totalDocuments}</h2>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-sm p-6 text-white hover:shadow-md transition">
                  <FiCheckCircle size={24} />
                  <p className="text-green-100 text-sm mt-3">Signed</p>
                  <h2 className="text-4xl font-bold mt-2">{signedCount}</h2>
                </div>
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-sm p-6 text-white hover:shadow-md transition">
                  <FiClock size={24} />
                  <p className="text-yellow-100 text-sm mt-3">Pending</p>
                  <h2 className="text-4xl font-bold mt-2">{pendingCount}</h2>
                </div>
                <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl shadow-sm p-6 text-white hover:shadow-md transition">
                  <FiXCircle size={24} />
                  <p className="text-red-100 text-sm mt-3">Rejected</p>
                  <h2 className="text-4xl font-bold mt-2">{rejectedCount}</h2>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100 mt-6">
                <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    ✓ Documents Uploaded: {documents.length}
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    ✓ Signatures Created: {signatures.length}
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    ✓ Signed Documents: {signedCount}
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    ✓ Pending Signatures: {pendingCount}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Documents Section */}
          {activeSection === "documents" && (
            <>
              {/* Upload PDF */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4">
                <h2 className="text-2xl font-semibold mb-4">Upload New Document</h2>
                <div className="flex gap-4 items-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                  <button
                    onClick={handleUpload}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white px-5 py-2 rounded-xl transition"
                  >
                    Upload
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Selected: {selectedFile ? selectedFile.name : "None"}
                </p>
              </div>

              {/* Signature Image Upload */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
                <h2 className="text-2xl font-semibold mb-1 flex items-center gap-2">
                  <FiImage className="text-indigo-600" />
                  Signature Image
                </h2>
                <p className="text-sm text-slate-500 mb-3">
                  Upload your signature image (PNG/JPG) before placing it on a document.
                </p>
                <div className="flex gap-4 items-center flex-wrap">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureImageUpload}
                    disabled={uploadingSignature}
                  />
                  {uploadingSignature && (
                    <span className="text-sm text-indigo-500 animate-pulse">Uploading…</span>
                  )}
                  {signatureImage && !uploadingSignature && signatureImagePath && (
                    <div className="flex items-center gap-3">
                      <img
                        src={URL.createObjectURL(signatureImage)}
                        alt="signature preview"
                        className="h-10 border border-slate-200 rounded"
                      />
                      <span className="text-sm text-green-600 font-medium">✓ Ready to place</span>
                    </div>
                  )}
                  {signatureImage && !uploadingSignature && !signatureImagePath && (
                    <span className="text-sm text-red-500">Upload failed — try again</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-12 gap-6">
                {/* Documents List */}
                <div className="col-span-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h2 className="text-2xl font-semibold mb-4">Documents</h2>
                  {documents.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="text-6xl mb-4">📄</div>
                      <h3 className="text-xl font-semibold text-slate-700">No Documents Yet</h3>
                      <p className="text-slate-500 mt-1">Upload your first PDF to begin.</p>
                    </div>
                  ) : (
                    [...documents].reverse().map((doc) => (
                      <div
                        key={doc._id}
                        onClick={() => { setSelectedDoc(doc); setGeneratedLink(""); }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer mb-3 ${
                          selectedDoc?._id === doc._id
                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-500"
                            : "hover:border-blue-400 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="truncate pr-2 text-sm">{doc.fileName}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm("Delete this document?")) {
                                deleteDocument(doc._id);
                              }
                            }}
                            className="text-red-500 font-bold flex-shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* PDF Preview */}
                <div className="col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h2 className="text-2xl font-semibold">PDF Preview</h2>
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => {
                          if (!signatureImagePath) {
                            showMessage("Please upload a signature image first.");
                            return;
                          }
                          setSignatureMode(!signatureMode);
                        }}
                        className={`text-white px-5 py-3 rounded-xl hover:opacity-90 ${
                          signatureMode
                            ? "bg-gradient-to-r from-red-500 to-rose-600"
                            : "bg-gradient-to-r from-green-600 to-emerald-600"
                        }`}
                      >
                        {signatureMode ? "Cancel Placing" : "Add Signature"}
                      </button>

                      {selectedDoc && (
                        <a
                          href={`${API_BASE}/api/docs/download-signed/${selectedDoc._id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-5 py-3 rounded-xl hover:opacity-90"
                        >
                          Download Signed PDF
                        </a>
                      )}

                      <button
                        onClick={generatePublicLink}
                        className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-5 py-3 rounded-xl hover:opacity-90"
                      >
                        Generate Link
                      </button>
                    </div>
                  </div>

                  {generatedLink && (
                    <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-xl mb-4">
                      <p className="font-medium mb-2">Public Signing Link</p>
                      <div className="flex gap-3">
                        <input
                          value={generatedLink}
                          readOnly
                          className="flex-1 border rounded-lg p-2 text-sm"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedLink);
                            showMessage("Link copied to clipboard!");
                          }}
                          className="bg-purple-600 text-white px-4 rounded-lg"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}

                  {!selectedDoc ? (
                    <div className="flex flex-col items-center justify-center h-[600px] text-slate-400">
                      <div className="text-6xl mb-4">📋</div>
                      <h3 className="text-xl font-semibold text-slate-500">No Document Selected</h3>
                      <p className="text-slate-400 mt-1">Choose a document from the list to preview it here.</p>
                    </div>
                  ) : (
                    <>
                      {signatureMode && (
                        <p className="mb-2 text-sm text-green-600 font-medium">
                          🖊 Click anywhere on the PDF to place your signature
                        </p>
                      )}

                      <div
                        ref={pdfWrapperRef}
                        className={`relative inline-block ${signatureMode ? "cursor-crosshair" : ""}`}
                        onClick={handleSignaturePlacement}
                      >
                        <Document
                          file={`${API_BASE}/uploads/${selectedDoc.fileName}`}
                          onLoadError={(error) => console.error("PDF ERROR:", error)}
                        >
                          <Page
                            pageNumber={1}
                            width={PDF_PREVIEW_WIDTH}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                          />
                        </Document>

                        {signatures
                          .filter((sig) => sig.documentId === selectedDoc._id)
                          .map((sig) => (
                            <div
                              key={sig._id}
                              style={{
                                position: "absolute",
                                left: `${sig.x}px`,
                                top: `${sig.y}px`,
                                transform: "translate(-50%, -50%)",
                              }}
                            >
                              <img
                                src={`${API_BASE}/${sig.signatureImage}`}
                                alt="signature"
                                style={{ width: "120px" }}
                              />
                              {confirmDeleteId === sig._id ? (
                                <div
                                  className="absolute -top-8 -right-2 flex gap-1 z-50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDeleteId(null);
                                      deleteSignature(sig._id);
                                    }}
                                    className="bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg hover:bg-red-700"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDeleteId(null);
                                    }}
                                    className="bg-slate-500 text-white text-xs px-2 py-1 rounded shadow-lg hover:bg-slate-600"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setConfirmDeleteId(sig._id);
                                  }}
                                  className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center shadow-md hover:bg-red-700"
                                  title="Delete signature"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Audit Logs Section */}
          {activeSection === "audit" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-2xl font-semibold mb-4">Audit Logs</h2>
              {auditLogs.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🗒️</div>
                  <h3 className="text-xl font-semibold text-slate-700">No Activity Yet</h3>
                  <p className="text-slate-500 mt-1">Actions like uploads and signatures will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                      <p className="font-semibold">{log.type}</p>
                      <p className="text-slate-600">{log.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Public Links Section */}
          {activeSection === "links" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-2xl font-semibold mb-4">Public Links</h2>
              {publicLinks.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">🔗</div>
                  <h3 className="text-xl font-semibold text-slate-700">No Links Generated</h3>
                  <p className="text-slate-500 mt-1">Select a document and click "Generate Link" to create a shareable signing link.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {publicLinks.map((link) => (
                    <div key={link._id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                      <p>
                        <strong>Document:</strong>{" "}
                        {link.documentId ? link.documentId.fileName : "Document Deleted"}
                      </p>
                      <p>
                        <strong>Expires:</strong>{" "}
                        {new Date(link.expiresAt).toLocaleString()}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        {link.isActive ? "Active" : "Inactive"}
                      </p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `http://localhost:5173/sign/${link.token}`
                            );
                            showMessage("Link copied to clipboard!");
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                        >
                          Copy
                        </button>
                        <a
                          href={`http://localhost:5173/sign/${link.token}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-green-600 text-white px-4 py-2 rounded-lg"
                        >
                          Open
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-slate-500 bg-white border-t border-slate-100">
        SignFlow • Digital Signature Platform
      </footer>
    </div>
  );
}

export default App;