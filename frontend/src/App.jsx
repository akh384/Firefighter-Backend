import React, { useState, useRef, useEffect } from 'react';
import NavBar from './components/NavBar';
import { v4 as uuidv4 } from 'uuid';
import './styles.css';

function App() {
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [mediaBlob, setMediaBlob] = useState(null);
  const [recording, setRecording] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const videoPreviewRef = useRef(null);
  const [stream, setStream] = useState(null);

  // For local testing, point backendUrl to your local server.
  // When deploying to Azure, update this variable accordingly.
  const backendUrl = "http://localhost:3001/api";

  // 1. Set the userId on mount
  useEffect(() => {
    let storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      storedUserId = uuidv4();
      localStorage.setItem('userId', storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  // 2. Attach the stream to the video element when recording changes
  useEffect(() => {
    if (recording && videoPreviewRef.current && stream) {
      videoPreviewRef.current.srcObject = stream;
    }
  }, [recording, stream]);

  // 3. Fetch testimonials on component mount
  useEffect(() => {
    fetchTestimonials();
  }, []);

  // A. Start Recording
  const startRecording = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = mediaStream;
      }
      mediaRecorderRef.current = new MediaRecorder(mediaStream);
      mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setMediaBlob(blob);
        chunksRef.current = [];
        // Stop all tracks
        mediaStream.getTracks().forEach((track) => track.stop());
        setStream(null);
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      console.error('Error accessing camera/mic:', err);
    }
  };

  // B. Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // C. Submit a Testimonial using the YouTube upload endpoint
  const handleSubmit = async () => {
    if (!mediaBlob) return;
    const formData = new FormData();
    formData.append('file', mediaBlob, 'testimonial.webm');
    formData.append('name', name);
    formData.append('message', message);
    formData.append('userId', userId);

    try {
      const response = await fetch(`${backendUrl}/uploadVideo`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Video upload failed');
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      // Add the new testimonial using the returned embed URL
      setTestimonials(prev => [
        ...prev,
        { name, message, videoUrl: data.embedUrl, userId }
      ]);
      // Clear the fields and mediaBlob
      setName('');
      setMessage('');
      setMediaBlob(null);
    } catch (err) {
      console.error(err);
      // Optionally display an error message to the user
    }
  };

  // D. Fetch Testimonials
  const fetchTestimonials = async () => {
    try {
      const res = await fetch(`${backendUrl}/testimonials`);
      if (!res.ok) {
        setTestimonials([]);
        return;
      }
      const data = await res.json();
      setTestimonials(data);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    }
  };

  // E. Delete a Testimonial
  const handleDelete = async (index, id) => {
    try {
      const response = await fetch(`${backendUrl}/testimonials/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const updatedTestimonials = testimonials.filter((t) => t._id !== id);
        setTestimonials(updatedTestimonials);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Modal functions for popout video
  const openModal = (videoUrl) => setSelectedVideo(videoUrl);
  const closeModal = () => setSelectedVideo(null);

  return (
      <div className="app-container">
        <NavBar />

        {/* Image Grid (for static images) */}
        <div className="image-grid">
          {/* ... Your static images as before ... */}
        </div>

        <header>
          <h1>Testimonial Recorder</h1>
        </header>

        {/* Submission Container */}
        <div className="submission-container">
          <input
              className="name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
          />
          <textarea
              className="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message"
          />
          <div className="recording-controls">
            {!recording ? (
                <button className="btn orange-btn" onClick={startRecording}>
                  Start Recording
                </button>
            ) : (
                <div className="video-container">
                  <div className="recording-indicator">Recording</div>
                  <video ref={videoPreviewRef} autoPlay muted className="preview-video" />
                  <button className="btn" onClick={stopRecording}>
                    Stop Recording
                  </button>
                </div>
            )}
          </div>
          <button className="btn orange-btn submit-btn" onClick={handleSubmit} disabled={!mediaBlob}>
            Submit Testimonial
          </button>
        </div>

        {/* Testimonials List */}
        <h2 className="testimonials-header">Submitted Testimonials</h2>
        <div className="testimonial-list">
          {testimonials.map((t, i) => (
              <div key={t._id || i} className="testimonial-item">
                <p>
                  <strong>{t.name}</strong>: {t.message}
                </p>
                <div className="video-thumbnail" onClick={() => openModal(t.videoUrl)} title="Click to enlarge">
                  <iframe
                      width="300"
                      height="169"
                      src={t.videoUrl}
                      title="Testimonial Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                  ></iframe>
                </div>
                {(t.userId === userId ||
                    ((!t.name || t.name.trim() === '') && (!t.message || t.message.trim() === ''))) && (
                    <button className="btn delete-btn" onClick={() => handleDelete(i, t._id)}>
                      Delete
                    </button>
                )}
              </div>
          ))}
        </div>

        {/* Modal for popout video */}
        {selectedVideo && (
            <div className="modal-overlay" onClick={closeModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={closeModal}>&times;</button>
                {selectedVideo.includes("youtube.com") ? (
                    <iframe
                        src={selectedVideo}
                        title="Embedded Video"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="modal-video"
                    ></iframe>
                ) : (
                    <video src={selectedVideo} controls autoPlay className="modal-video" />
                )}
              </div>
            </div>
        )}
      </div>
  );
}

export default App;
