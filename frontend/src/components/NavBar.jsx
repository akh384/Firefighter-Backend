import React from 'react';
import './NavBar.css';

function NavBar() {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="logo">
                    <a href="/">MySite</a>
                </div>
                <ul className="nav-links">
                    <li><a href="/about">About</a></li>
                    <li><a href="/services">Services</a></li>
                    <li><a href="/contact">Contact</a></li>
                    {/* Add more links as needed */}
                </ul>
            </div>
        </nav>
    );
}

export default NavBar;