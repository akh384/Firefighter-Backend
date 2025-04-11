import React, { useEffect, useState, useRef } from "react";
import "./styles.css";

function App() {
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");
    const [testimonials, setTestimonials] = useState([]);
    const [videoBlob, setVideoBlob] = useState(null);
    const [userId] = useState(() => Math.random().toString(36).substring(2));
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const [showInstructions, setShowInstructions] = useState(true);
    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        fetch("/api/testimonials")
            .then((res) => res.json())
            .then((data) => {
                console.log("Testimonials:", data);
                setTestimonials(data);
            })
            .catch((err) => console.error("Error loading testimonials:", err));
    }, []);

    const startRecording = async () => {
        console.log("▶ Requesting camera...");
        setIsRecording(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            setShowInstructions(false);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch((err) =>
                    console.error("⚠️ Error calling video.play():", err)
                );
            }
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks = [];
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) chunks.push(event.data);
            };
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: "video/webm" });
                setVideoBlob(blob);
                stream.getTracks().forEach((track) => track.stop());
            };
            mediaRecorder.start();
            console.log("🎥 Recording started");
        } catch (err) {
            console.error("❌ Failed to access media devices:", err);
            alert("Camera access failed. Please check your permissions or try a different browser.");
        }
    };

    const stopRecording = () => {
        setIsRecording(false);
        mediaRecorderRef.current?.stop();
    };

    const handleSubmit = () => {
        if (!name || !message || !videoBlob) {
            alert("Please fill out all fields and record a video.");
            return;
        }
        setUploadProgress(0);
        setIsUploading(true);

        const formData = new FormData();
        formData.append("file", videoBlob);
        formData.append("title", name);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/uploadVideo", true);
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                setUploadProgress((event.loaded / event.total) * 100);
            }
        };

        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    const uploadData = JSON.parse(xhr.responseText);
                    const videoUrl = uploadData.embedUrl;
                    // Submit the testimonial along with videoUrl
                    fetch("/api/testimonials", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name, message, videoUrl, userId }),
                    })
                        .then((res) => {
                            if (res.ok) {
                                window.location.reload();
                            } else {
                                alert("Failed to submit testimonial.");
                            }
                        })
                        .catch((err) => console.error("Error submitting testimonial:", err))
                        .finally(() => setIsUploading(false));
                } else {
                    alert("Upload failed");
                    setIsUploading(false);
                }
            }
        };
        xhr.send(formData);
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm("Are you sure you want to delete this testimonial?");
        if (!confirmed) return;
        try {
            const res = await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
            if (res.ok) {
                setTestimonials(testimonials.filter((t) => t._id !== id));
            } else {
                alert("Failed to delete testimonial.");
            }
        } catch (err) {
            console.error("❌ Delete error:", err);
        }
    };

    return (
        <div>
            <div className="accent-bar"></div>
            <header className="navbar">
                <div className="nav-title">MySite</div>
                <nav className="nav-links">
                    <a href="#">About</a>
                    <a href="#">Services</a>
                    <a href="#">Contact</a>
                </nav>
            </header>
            <section className="white-section">
                <section className="image-grid">
                    {/* Top row: 4 images */}
                    <div className="image-grid-row top">
                        <div className="image-item1">
                            <img src="src/images/firefighter1.png" alt="Firefighter 1" />
                            <div className="info-panel">
                                <h4 className="leader_title_1">Firefighter 1</h4>
                                <p className="leader_descrip_1">Chief</p>
                            </div>
                        </div>
                        <div className="image-item2">
                            <img src="src/images/firefighter2.png" alt="Firefighter 2" />
                            <div className="info-panel">
                                <h4 className="leader_title_2">Firefighter 2</h4>
                                <p className="leader_descrip_2">Captain</p> #TODO: return here
                            </div>
                        </div>
                        <div className="image-item3">
                            <img src="src/images/firefighter3.png" alt="Firefighter 3" />
                            <div className="info-panel">
                                <h4 className="leader_title_3">Firefighter 3</h4>
                                <p className="leader_descrip_3">Lieutenant</p>
                            </div>
                        </div>
                        <div className="image-item4">
                            <img src="src/images/firefighter4.png" alt="Firefighter 4" />
                            <div className="info-panel">
                                <h4 className="leader_title_4">Firefighter 4</h4>
                                <p className="leader_descrip_4">Sergeant</p>
                            </div>
                        </div>
                    </div>
                    {/* Bottom row: 3 images */}
                    <div className="image-grid-row bottom">
                        <div className="image-item">
                            <img src="src/images/firefighter5.png" alt="Firefighter 5" />
                            <div className="info-panel">
                                <h4 className="leader_title_5">Firefighter 5</h4>
                                <p className="leader_descrip_5">Firefighter</p>
                            </div>
                        </div>
                        <div className="image-item">
                            <img src="src/images/firefighter6.png" alt="Firefighter 6" />
                            <div className="info-panel">
                                <h4 className="leader_title_6">Sam Eaton</h4>
                                <p className="leader_descrip_6">Firefighter</p>
                            </div>
                        </div>
                        <div className="image-item">
                            <img src="src/images/firefighter7.png" alt="Firefighter 7" />
                            <div className="info-panel">
                                <h4 className="leader_title_7">Firefighter 7</h4>
                                <p className="leader_descrip_7">Firefighter</p>
                            </div>
                        </div>
                    </div>
                </section>
            </section>
            <section className="light-section">
                <h1>Submit a Testimonial</h1>
                <div className="app-container">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" />
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your Message" />
                    <div className="camera-box">
                        {isRecording && <div className="recording-badge">● Recording</div>}
                        <video ref={videoRef} autoPlay playsInline muted />
                        {showInstructions && (
                            <p className="camera-instructions">Click "Start Recording" to begin</p>
                        )}
                    </div>
                    <div className="button-row">
                        <button onClick={startRecording}>Start Recording</button>
                        <button onClick={stopRecording}>Stop Recording</button>
                        <button onClick={handleSubmit}>Submit Testimonial</button>
                    </div>
                    {isUploading && (
                        <div className="upload-progress-container">
                            <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                            <span className="upload-progress-text">{Math.round(uploadProgress)}%</span>
                        </div>
                    )}
                </div>
            </section>
            <section className="white-section testimonial-section">
                <h2>Submitted Testimonials</h2>
                <div className="testimonial-grid">
                    {testimonials.map((t) => (
                        <div
                            id={`testimonial-${t._id}`}
                            className={`testimonial-card ${t.approved ? "approved" : "pending"}`}
                            key={t._id}
                        >
                            {t.approved ? (
                                t.videoUrl.includes("youtube.com") ? (
                                    <iframe
                                        className="testimonial-video"
                                        src={t.videoUrl}
                                        title={t.name}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                ) : (
                                    <video className="testimonial-video" controls>
                                        <source src={t.videoUrl} type="video/webm" />
                                        Your browser does not support the video tag.
                                    </video>
                                )
                            ) : (
                                <div className="pending-placeholder">
                                    <p>This video is pending approval.</p>
                                </div>
                            )}
                            {/* Info panel placed immediately after the video/iframe */}
                            <div className="info-panel">
                                <h3>{t.name}</h3>
                                <p>{t.message}</p>
                            </div>
                            {t.userId === userId && (
                                <button className="delete-button" onClick={() => handleDelete(t._id)}>
                                    Delete
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </section>
            <footer className="footer">
                <p>
                    This project is part of the occupational cancer research initiative by the
                    University of Miami's <strong>Sylvester Comprehensive Cancer Center</strong>.
                </p>
            </footer>
        </div>
    );
}

export default App;
