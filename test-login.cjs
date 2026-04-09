const axios = require('axios');

async function test() {
    try {
        const res = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'customer@servicemate.com',
            password: '123456'
        });
        console.log('Success:', res.data);
    } catch (e) {
        if (e.response) {
            console.error('Error status:', e.response.status);
            console.error('Error data:', e.response.data);
        } else {
            console.error('Error:', e.message);
        }
    }
}
test();
