const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    // Don't render pagination if there's only one page (or no pages)
    if (totalPages <= 1) return null;

    return (
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button 
                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                style={{ padding: '5px 10px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
                Previous
            </button>
            <span style={{ alignSelf: 'center' }}>Page {currentPage} of {totalPages}</span>
            <button 
                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ padding: '5px 10px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
                Next
            </button>
        </div>
    );
};

export default Pagination;