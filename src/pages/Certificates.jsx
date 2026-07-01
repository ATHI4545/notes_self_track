import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiAwardLine, RiAddLine, RiDeleteBinLine, RiExternalLinkLine,
  RiUploadCloud2Line, RiLoader5Line, RiFileTextLine
} from 'react-icons/ri';
import { doc, getDoc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

// Helper to ensure external links are absolute URLs
const ensureAbsoluteUrl = (url) => {
  if (!url) return '';
  if (/^(https?:\/\/|data:)/i.test(url)) {
    return url;
  }
  return `https://${url}`;
};

export default function Certificates() {
  const { profile } = useAuth();
  const uid = profile?.uid;

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [linkType, setLinkType] = useState('upload'); // 'upload' | 'url'
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  // Subscribe to Certificates stored as an array in users/{uid} document
  useEffect(() => {
    if (!uid) {
      setCertificates([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userDocRef = doc(db, 'users', uid);

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const list = data.certificates || [];
        // Sort by createdAt descending
        const sortedList = [...list].sort((a, b) => b.createdAt - a.createdAt);
        setCertificates(sortedList);
      } else {
        setCertificates([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching certificates: ", error);
      toast.error("Failed to load certificates");
      setLoading(false);
    });

    return unsubscribe;
  }, [uid]);

  const uploadToCloudinary = async (fileToUpload) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration is missing in .env');
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('upload_preset', uploadPreset);

    // Upload using auto endpoint so both PDFs and images are processed securely
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error?.message || 'Failed to upload file');
    }

    const data = await res.json();
    return data.secure_url || data.url;
  };

  const handleAddCertificate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a certificate name');
      return;
    }

    let certificateUrl = '';
    setAdding(true);

    try {
      if (linkType === 'upload') {
        if (!file) {
          toast.error('Please select a certificate file');
          setAdding(false);
          return;
        }
        setUploading(true);
        toast.info('☁️ Uploading certificate…', { autoClose: false, toastId: 'cert-upload' });
        certificateUrl = await uploadToCloudinary(file);
        toast.dismiss('cert-upload');
      } else {
        if (!url.trim()) {
          toast.error('Please enter a certificate URL');
          setAdding(false);
          return;
        }
        certificateUrl = ensureAbsoluteUrl(url);
      }

      // Add to Firestore array inside user document
      const userDocRef = doc(db, 'users', uid);
      const newCert = {
        id: Date.now().toString(),
        name: name.trim(),
        url: certificateUrl,
        createdAt: Date.now() // timestamp
      };

      // Set options to merge: true in case the document is new/empty
      await setDoc(userDocRef, {
        certificates: [...certificates, newCert]
      }, { merge: true });

      toast.success('🎓 Certificate added successfully!');
      
      // Reset form
      setName('');
      setFile(null);
      setUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.dismiss('cert-upload');
      toast.error('Failed to add certificate: ' + err.message);
    } finally {
      setAdding(false);
      setUploading(false);
    }
  };

  const handleDeleteCertificate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) return;

    try {
      const userDocRef = doc(db, 'users', uid);
      const updatedList = certificates.filter(c => c.id !== id);
      await updateDoc(userDocRef, {
        certificates: updatedList
      });
      toast.success('Certificate deleted successfully');
    } catch (err) {
      toast.error('Failed to delete certificate: ' + err.message);
    }
  };

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'inherit' }}>
          Certificates
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.2rem' }}>
          Upload and showcase your academic and professional credentials
        </p>
      </motion.div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="responsive-grid">
        
        {/* Add Certificate Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="glass-card" 
          style={{ padding: '1.75rem', height: 'fit-content' }}
        >
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RiAwardLine style={{ color: '#6366f1' }} /> Add New Certificate
          </h2>

          <form onSubmit={handleAddCertificate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Certificate Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Certificate Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g., AWS Certified Cloud Practitioner"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Link Type Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Credential Format
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="linkType"
                    checked={linkType === 'upload'}
                    onChange={() => setLinkType('upload')}
                    style={{ accentColor: '#6366f1' }}
                  />
                  Upload File (PDF/Image)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="linkType"
                    checked={linkType === 'url'}
                    onChange={() => setLinkType('url')}
                    style={{ accentColor: '#6366f1' }}
                  />
                  Paste Credential Link
                </label>
              </div>
            </div>

            {/* Input Options */}
            <AnimatePresence mode="wait">
              {linkType === 'upload' ? (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed rgba(99, 102, 241, 0.2)',
                      borderRadius: '0.75rem',
                      padding: '1.5rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'rgba(99, 102, 241, 0.02)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)'}
                  >
                    <RiUploadCloud2Line style={{ fontSize: '2rem', color: '#6366f1', marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                      {file ? file.name : 'Click to select Certificate File'}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      Supports PDF, PNG, JPG, JPEG (max 10MB)
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={e => setFile(e.target.files?.[0] || null)}
                      accept="application/pdf,image/*"
                      style={{ display: 'none' }}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="url"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <input
                    type="text"
                    placeholder="https://credentials.example.com/verify/..."
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="input-field"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={adding}
              className="btn-primary"
              style={{ width: '100%', padding: '0.8rem' }}
            >
              {adding ? (
                <>
                  <RiLoader5Line className="animate-spin" /> {uploading ? 'Uploading File…' : 'Adding Certificate…'}
                </>
              ) : (
                <>
                  <RiAddLine /> Add Certificate
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Certificates List Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="glass-card" 
          style={{ padding: '1.75rem' }}
        >
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <RiAwardLine style={{ color: '#10b981' }} /> My Certificates ({certificates.length})
          </h2>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <RiLoader5Line className="animate-spin" style={{ fontSize: '2rem', color: '#6366f1' }} />
            </div>
          ) : certificates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RiAwardLine style={{ fontSize: '2.5rem', color: '#94a3b8' }} />
              </div>
              <div>
                <p style={{ fontWeight: '700', fontSize: '1rem' }}>No certificates added yet</p>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.2rem' }}>Add your credentials to show them on your profile</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <AnimatePresence>
                {certificates.map((cert) => (
                  <motion.div
                    key={cert.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      borderRadius: '1rem',
                      background: 'rgba(99, 102, 241, 0.04)',
                      border: '1px solid rgba(99, 102, 241, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '12px', 
                        background: 'rgba(99, 102, 241, 0.1)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <RiFileTextLine style={{ color: '#6366f1', fontSize: '1.25rem' }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: '700', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {cert.name}
                        </p>
                        <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                          Added on {cert.createdAt ? format(new Date(cert.createdAt), 'MMM d, yyyy') : 'Recently'}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                      <a
                        href={ensureAbsoluteUrl(cert.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', gap: '0.25rem' }}
                      >
                        Open <RiExternalLinkLine style={{ fontSize: '0.85rem' }} />
                      </a>
                      <button
                        onClick={() => handleDeleteCertificate(cert.id)}
                        className="btn-secondary"
                        style={{ 
                          padding: '0.45rem', 
                          color: '#ef4444', 
                          borderColor: 'rgba(239, 68, 68, 0.2)',
                          background: 'none'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'none';
                        }}
                      >
                        <RiDeleteBinLine style={{ fontSize: '1.05rem' }} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .responsive-grid {
            grid-template-columns: 2fr 3fr !important;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
