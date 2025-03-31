import React, { useEffect, useState } from 'react';

const App = () => {
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    fetch('/api/testimonials')
        .then((res) => res.json())
        .then((data) => setTestimonials(data))
        .catch((err) => console.error("Error fetching testimonials:", err));
  }, []);

  return (
      <div style={{ padding: '2rem' }}>
        <h1>User Testimonials</h1>

        <form
            action="/uploadVideo"
            method="POST"
            encType="multipart/form-data"
            style={{ marginBottom: '2rem' }}
        >
          <div>
            <input type="text" name="name" placeholder="Your name" required />
          </div>
          <div>
            <textarea name="message" placeholder="Your message" required />
          </div>
          <div>
            <input type="file" name="file" accept="video/*" required />
          </div>
          <button type="submit">Upload Testimonial</button>
        </form>

        {testimonials.length === 0 ? (
            <p>No testimonials yet.</p>
        ) : (
            <ul>
              {testimonials.map((t, index) => (
                  <li key={index} style={{ marginBottom: '2rem' }}>
                    <p><strong>{t.name}</strong>: {t.message}</p>
                    {t.videoUrl && (
                        <iframe
                            width="560"
                            height="315"
                            src={t.videoUrl}
                            title="Testimonial Video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    )}
                  </li>
              ))}
            </ul>
        )}
      </div>
  );
};

export default App;
