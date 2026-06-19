import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = "https://signflow-document-signature-app-leli.onrender.com";

function PublicSignPage() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [linkData, setLinkData] = useState(null);
  const [documentUrl, setDocumentUrl] = useState("");
  const [error, setError] = useState("");

  const [signatureImage, setSignatureImage] = useState(null);
  const [signatureImagePath, setSignatureImagePath] = useState("");
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState("");

  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signedPdfUrl, setSignedPdfUrl] = useState("");

  // Where the signer clicked on the overlay (in overlay-pixel space)
  const [placedPos, setPlacedPos] = useState(null);

  const overlayRef = useRef(null);

  useEffect(() => {
    fetchSigningLink();
  }, []);

  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSignatureImage(file);
    setSignaturePreviewUrl(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("signature", file);

    try {
      const response = await fetch(`${API_BASE}/api/signatures/upload-image`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setSignatureImagePath(data.imagePath);
    } catch (error) {
      console.error(error);
    }
  };

  // When signer clicks on the overlay, record position relative to the overlay div
  const handleOverlayClick = (e) => {
    if (!signatureImagePath) return; // must upload signature first

    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPlacedPos({ x, y });
  };

  const handlePublicSign = async () => {
    if (!placedPos) {
      alert("Please click on the document to choose where to place your signature.");
      return;
    }

    const overlay = overlayRef.current;
    const pageWidth = overlay.offsetWidth;
    const pageHeight = overlay.offsetHeight;

    try {
      const response = await fetch(`${API_BASE}/api/signatures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: linkData.documentId._id,
          x: placedPos.x,
          y: placedPos.y,
          page: 1,
          pageWidth,
          pageHeight,
          signerName,
          signer: signerEmail,
          signatureImage: signatureImagePath,
          status: "Signed",
        }),
      });

      const data = await response.json();
      console.log(data);

      if (!response.ok) throw new Error(data.message);

      setSignedPdfUrl(
        `${API_BASE}/api/docs/download-signed/${linkData.documentId._id}`
      );

      alert("Document Signed Successfully");
    } catch (error) {
      console.error(error);
      alert(error.message || "Signing failed");
    }
  };

  const fetchSigningLink = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/sign-links/${token}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Invalid link");

      setLinkData(data);

      if (data.documentId?.fileName) {
        setDocumentUrl(`${API_BASE}/uploads/${data.documentId.fileName}`);
      }
    } catch (error) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-lg border border-slate-100 p-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-800">SignFlow</h1>
          <p className="text-slate-500">Secure Digital Signature Platform</p>
        </div>

        {/* Signer details */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Full Name"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            className="w-full border border-slate-300 p-3 rounded-xl mb-3"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={signerEmail}
            onChange={(e) => setSignerEmail(e.target.value)}
            className="w-full border border-slate-300 p-3 rounded-xl"
          />
        </div>

        {/* Signature upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Upload your signature image
          </label>
          <input type="file" accept="image/*" onChange={handleSignatureUpload} />
          {signatureImage && (
            <p className="mt-2 text-green-600 text-sm">✓ Signature uploaded</p>
          )}
        </div>

        {/* Link metadata */}
        <div className="space-y-2 mb-6 text-sm text-slate-600">
          <p><strong>Document:</strong> {linkData.documentId.fileName}</p>
          <p><strong>Active:</strong> {linkData.isActive ? "Yes" : "No"}</p>
          <p><strong>Expires:</strong> {new Date(linkData.expiresAt).toLocaleString()}</p>
        </div>

        {/* Document preview with click-to-place overlay */}
        {documentUrl && (
          <div className="mt-2">
            <h2 className="text-xl font-semibold mb-1">Document</h2>

            {signatureImagePath && !placedPos && (
              <p className="text-sm text-amber-600 mb-2">
                👆 Click anywhere on the document below to place your signature
              </p>
            )}
            {placedPos && (
              <p className="text-sm text-green-600 mb-2">
                ✓ Signature placed — click again to reposition, or click &quot;Sign Document&quot; to confirm
              </p>
            )}

            {/* Overlay wrapper — click events captured here */}
            <div
              className="relative border rounded"
              ref={overlayRef}
              onClick={handleOverlayClick}
              style={{
                cursor: signatureImagePath ? "crosshair" : "default",
                height: "700px",
              }}
            >
              <iframe
                src={documentUrl}
                title="Document Preview"
                className="w-full h-full border-0 pointer-events-none"
              />

              {/* Transparent click-capture layer so iframe doesn't steal events */}
              <div className="absolute inset-0" />

              {/* Placed signature preview */}
              {placedPos && signaturePreviewUrl && (
                <img
                  src={signaturePreviewUrl}
                  alt="Signature preview"
                  style={{
                    position: "absolute",
                    left: placedPos.x,
                    top: placedPos.y,
                    width: 120,
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none",
                    opacity: 0.85,
                    border: "1.5px dashed #16a34a",
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.6)",
                  }}
                />
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={handlePublicSign}
                disabled={
                  !signatureImagePath ||
                  !signerName ||
                  !signerEmail ||
                  !placedPos
                }
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sign Document
              </button>

              {signedPdfUrl && (
                <a
                  href={signedPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
                >
                  Download Signed PDF
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicSignPage;