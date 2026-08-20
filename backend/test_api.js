// Native fetch in Node 22

async function test() {
    try {
        console.log('Testing Registration...');
        const res = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Admin',
                email: 'test' + Date.now() + '@test.com',
                password: 'password123'
            })
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Data:', data);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

test();
