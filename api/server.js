import app from './index.js';

// Gagamit ng port 5000 para sa local environment testing natin
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`🚀 SMS CLOUD BACKEND RUNNING ON PORT: ${PORT}`);
    console.log(`🔗 LOCAL API ENTRY: http://localhost:${PORT}/api`);
    console.log(`=================================================`);
});