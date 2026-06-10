import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

function Root() {
  return (
    <React.StrictMode><App /></React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);