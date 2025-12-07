export default function PageContainer({ children, className = "" }) {
  return (
    <div className={`page-container page-switch ${className}`}>
      {children}
    </div>
  );
}
