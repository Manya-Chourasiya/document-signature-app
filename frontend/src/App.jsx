import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc =
  `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  
function App() {
  const [documents, setDocuments] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [signatureMode, setSignatureMode] = useState(false);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/docs");
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSignatures = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/signatures");
      const data = await response.json();
      setSignatures(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a PDF");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", selectedFile);

    try {
      const response = await fetch(
        "http://localhost:5000/api/docs/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      await response.json();

      alert("PDF Uploaded Successfully");

      fetchDocuments();

      setSelectedFile(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignaturePlacement = async (e) => {
    if (!signatureMode || !selectedDoc) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    try {
      const response = await fetch(
        "http://localhost:5000/api/signatures",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: selectedDoc._id,
            x,
            y,
            signer: "manya@gmail.com",
          }),
        }
      );

      await response.json();

      alert(`Signature Saved at (${x}, ${y})`);

      setSignatureMode(false);

      fetchSignatures();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchSignatures();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        Document Signature App
      </h1>

      {/* Upload */}
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="text-2xl font-semibold mb-4">
          Upload PDF
        </h2>

        <div className="flex gap-4">
          <input
            type="file"
            accept=".pdf"
            onChange={(e) =>
              setSelectedFile(e.target.files[0])
            }
          />

          <button
            onClick={handleUpload}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Upload
          </button>
        </div>

        <p className="mt-2">
          Selected File:{" "}
          {selectedFile ? selectedFile.name : "None"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">

        {/* Documents */}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="text-2xl font-semibold mb-4">
            Documents
          </h2>

          {documents.map((doc) => (
            <div
              key={doc._id}
              onClick={() => setSelectedDoc(doc)}
              className="border p-3 rounded-lg mb-3 cursor-pointer hover:bg-gray-100"
            >
              {doc.fileName}
            </div>
          ))}
        </div>

        {/* PDF */}
        <div className="col-span-2 bg-white p-4 rounded-xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">
              PDF Preview
            </h2>

            <button
              onClick={() =>
                setSignatureMode(!signatureMode)
              }
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {signatureMode
                ? "Cancel"
                : "Add Signature"}
            </button>
          </div>

          {!selectedDoc ? (
            <p>Select a document</p>
          ) : (
            <>
              <p className="mb-2 text-red-500">
               {`http://localhost:5000/uploads/${selectedDoc.fileName}`}
              </p>

              <Document
                file={`http://localhost:5000/uploads/${selectedDoc.fileName}`}
                onLoadError={(error) => {
                  console.error("PDF ERROR:", error);
                }}
              >
                <Page
                  pageNumber={1}
                  width={700}
                />
              </Document>

              <div
                className={`mt-4 h-48 border-4 rounded flex items-center justify-center ${
                  signatureMode
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300"
                }`}
                onClick={handleSignaturePlacement}
              >
                {signatureMode
                  ? "Click Here To Place Signature"
                  : "Signature Placement Area"}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Signatures */}
      <div className="bg-white p-6 rounded-xl shadow mt-6">
        <h2 className="text-2xl font-semibold mb-4">
          Saved Signatures
        </h2>

        {signatures.map((sig) => (
          <div
            key={sig._id}
            className="border p-3 rounded mb-3"
          >
            <p>Document: {sig.documentId}</p>
            <p>X: {sig.x}</p>
            <p>Y: {sig.y}</p>
            <p>Signer: {sig.signer}</p>
            <p>Status: {sig.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;