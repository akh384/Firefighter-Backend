import React, { useState, useEffect } from 'react';

function App() {
    const [testimonials, setTestimonials] = useState([]);

    useEffect(() => {
        fetch('/api/testimonials')
            .then((res) => res.json())
            .then((data) => setTestimonials(data));
    }, []);

    return (
        <div>
            <h1>Video Testimonials</h1>
            <a href="/auth">
                <button>Authorize YouTube Upload</button>
            </a>
            <form
                action="/uploadVideo"
                method="POST"
                encType="multipart/form-data"
            >
                <input type="text" name="name" placeholder="Your name" />
                <textarea name="message" placeholder="Your message" />
                <input type="file" name="file" accept="video/*" />
                <button type="submit">Upload</button>
            </form>

            <div>
                <h2>Submitted Testimonials</h2>
                {testimonials.map((t, i) => (
                    <div key={i}>
                        <h3>{t.name}</h3>
                        <p>{t.message}</p>
                        <iframe
                            width="560"
                            height="315"
                            src={t.videoUrl}
                            title="YouTube video"
                            allowFullScreen
                        ></iframe>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
