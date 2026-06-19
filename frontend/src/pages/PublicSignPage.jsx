import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = "http://localhost:5000";

function PublicSignPage() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [linkData, setLinkData] = useState(null);
  const [documentUrl, setDocumentUrl] =
  useState("");
  const [error, setError] = useState("");
  const [signatureImage, setSignatureImage] =
   useState(null);

  const [signatureImagePath, setSignatureImagePath] =
   useState("");

  useEffect(() => {
    fetchSigningLink();
  }, []);

  const handleSignatureUpload = async (
   e
  ) => {
   const file = e.target.files[0];

   if (!file) return;

   setSignatureImage(file);

   const formData = new FormData();

   formData.append(
    "signature",
    file
   );

   try {
    const response = await fetch(
      `${API_BASE}/api/signatures/upload-image`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data =
      await response.json();

    setSignatureImagePath(
      data.imagePath
    );
   } catch (error) {
     console.error(error);
   }
 };

  const handlePublicSign = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/signatures`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            documentId:
              linkData.documentId._id,
            x: 200,
            y: 200,
            page: 1,
            signer:
              "public-signer@email.com",
            signatureImage:
              signatureImagePath,
            status: "Signed",
          }),
        }
      );

      const data =
        await response.json();

      console.log(data);

      alert(
        "Document Signed Successfully"
      );
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSigningLink = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/sign-links/${token}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Invalid link"
        );
      }

      setLinkData(data);
      if (data.documentId?.fileName) {
       setDocumentUrl(
        `${API_BASE}/uploads/${data.documentId.fileName}`
      );
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
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-3xl font-bold mb-6">
          <div className="mb-6">
           <input
             type="file"
             accept="image/*"
             onChange={
              handleSignatureUpload
             }
            />

            {signatureImage && (
             <p className="mt-2 text-green-600">
               Signature Uploaded
             </p>
            )}
          </div>
          Public Signing Page
        </h1>

        <div className="space-y-3">
          <p>
            <strong>Token:</strong>{" "}
            {linkData.token}
          </p>

          <p>
            <strong>Document:</strong>{" "}
            {linkData.documentId.fileName}
          </p>

          <p>
            <strong>Active:</strong>{" "}
            {linkData.isActive
              ? "Yes"
              : "No"}
          </p>

          <p>
            <strong>Expires:</strong>{" "}
            {new Date(
              linkData.expiresAt
            ).toLocaleString()}
          </p>
        </div>
        {documentUrl && (
         <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">
           Document
          </h2>

          <iframe
           src={documentUrl}
           title="Document Preview"
           className="w-full h-[700px] border rounded"
          />

          <div className="mt-6">
            <button
              onClick={handlePublicSign}
              disabled={!signatureImagePath}
              className="bg-green-600 text-white px-6 py-3 rounded-lg"
            >
              Sign Document
            </button>
          </div>
        </div>
)}
      </div>
    </div>
    
  );
}

export default PublicSignPage;