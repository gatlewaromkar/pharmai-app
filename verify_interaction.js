// using global fetch

async function testInteraction() {
    const url = 'http://localhost:3001/api/check-interaction';

    // Test Case 1: Known Interaction (Aspirin + Warfarin)
    console.log('Testing Aspirin + Warfarin...');
    try {
        const res1 = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drug1: 'Aspirin', drug2: 'Warfarin' })
        });
        const data1 = await res1.json();
        console.log('Result:', data1);
        if (data1.risk === 'Critical' || data1.risk === 'Major' || data1.risk === 'High') {
            console.log('PASS: Correctly identified high risk.');
        } else {
            console.log('FAIL: Did not identify risk correctly.');
        }
    } catch (e) {
        console.error('FAIL: API Error', e);
    }

    console.log('\n-------------------\n');

    // Test Case 2: No Interaction (Vitamin C + Zinc) - AI Fallback
    console.log('Testing Vitamin C + Zinc...');
    try {
        const res2 = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drug1: 'Vitamin C', drug2: 'Zinc' })
        });
        const data2 = await res2.json();
        console.log('Result:', data2);
    } catch (e) {
        console.error('FAIL: API Error', e);
    }
}

testInteraction();
