import Sidebar from './Sidebar';

const Layout = ({ children }) => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-[#0a0a0f]">
            <Sidebar />
            <main className="ml-[240px] flex-1 p-10 overflow-x-hidden">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
