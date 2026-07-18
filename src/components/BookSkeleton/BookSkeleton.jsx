import React from 'react';
import './BookSkeleton.css';

function BookSkeleton() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-image shimmer" />
            <div className="skeleton-content">
                <div className="skeleton-badge shimmer" />
                <div className="skeleton-title shimmer" />
                <div className="skeleton-author shimmer" />
                <div className="skeleton-isbn shimmer" />
            </div>
        </div>
    );
}

export default BookSkeleton;