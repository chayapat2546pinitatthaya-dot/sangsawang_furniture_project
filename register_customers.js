const http = require('http');

// ข้อมูลลูกค้า 10 คน
const customers = [
  {
    username: 'customer3',
    password: 'customer123',
    fname: 'ประเสริฐ',
    lname: 'ดีงาม',
    email: 'prasert@example.com',
    tel: '081-234-5678',
    address: '123 ถนนราชดำริ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330'
  },
  {
    username: 'customer4',
    password: 'customer123',
    fname: 'วิไล',
    lname: 'สวยงาม',
    email: 'wilai@example.com',
    tel: '082-345-6789',
    address: '456 ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพฯ 10500'
  },
  {
    username: 'customer5',
    password: 'customer123',
    fname: 'สมศักดิ์',
    lname: 'รวยทรัพย์',
    email: 'somsak@example.com',
    tel: '083-456-7890',
    address: '789 ถนนเพชรบุรี แขวงทุ่งพญาไท เขตราชเทวี กรุงเทพฯ 10400'
  },
  {
    username: 'customer6',
    password: 'customer123',
    fname: 'มาลี',
    lname: 'ใจดี',
    email: 'malee@example.com',
    tel: '084-567-8901',
    address: '321 ถนนสุขุมวิท แขวงคลองตัน เขตคลองตัน กรุงเทพฯ 10110'
  },
  {
    username: 'customer7',
    password: 'customer123',
    fname: 'วิทยา',
    lname: 'เก่งมาก',
    email: 'wittaya@example.com',
    tel: '085-678-9012',
    address: '654 ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900'
  },
  {
    username: 'customer8',
    password: 'customer123',
    fname: 'สุภาพ',
    lname: 'น่ารัก',
    email: 'supap@example.com',
    tel: '086-789-0123',
    address: '987 ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310'
  },
  {
    username: 'customer9',
    password: 'customer123',
    fname: 'ชาญชัย',
    lname: 'ฉลาดมาก',
    email: 'chanchai@example.com',
    tel: '087-890-1234',
    address: '147 ถนนลาดพร้าว แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพฯ 10230'
  },
  {
    username: 'customer10',
    password: 'customer123',
    fname: 'รัตนา',
    lname: 'สวยใส',
    email: 'rattana@example.com',
    tel: '088-901-2345',
    address: '258 ถนนบางนา-ตราด แขวงบางนา เขตบางนา กรุงเทพฯ 10260'
  },
  {
    username: 'customer11',
    password: 'customer123',
    fname: 'ธีรพงษ์',
    lname: 'เก่งกาจ',
    email: 'teerapong@example.com',
    tel: '089-012-3456',
    address: '369 ถนนรามคำแหง แขวงพลับพลา เขตวังทองหลาง กรุงเทพฯ 10310'
  },
  {
    username: 'customer12',
    password: 'customer123',
    fname: 'ปิยะ',
    lname: 'ดีใจ',
    email: 'piya@example.com',
    tel: '090-123-4567',
    address: '741 ถนนพระราม 2 แขวงบางมด เขตทุ่งครุ กรุงเทพฯ 10140'
  }
];

const API_URL = 'http://localhost:7100/api/customer/register';

function makeRequest(customer) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(customer);
    
    const url = new URL(API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error || 'Request failed'));
          }
        } catch (error) {
          reject(new Error('Failed to parse response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function registerCustomers() {
  console.log('เริ่มต้นการสมัครสมาชิกลูกค้า 10 คน...\n');
  
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    try {
      const response = await makeRequest(customer);
      console.log(`✅ [${i + 1}/${customers.length}] สมัครสำเร็จ: ${customer.username} (ID: ${response.customer_id})`);
      console.log(`   ชื่อ: ${customer.fname} ${customer.lname}`);
      console.log(`   อีเมล: ${customer.email}\n`);
      successCount++;
    } catch (error) {
      console.log(`❌ [${i + 1}/${customers.length}] สมัครไม่สำเร็จ: ${customer.username}`);
      console.log(`   ข้อผิดพลาด: ${error.message}\n`);
      failCount++;
    }
    
    // รอสักครู่เพื่อไม่ให้ server รับ request มากเกินไป
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n=== สรุปผล ===');
  console.log(`✅ สมัครสำเร็จ: ${successCount} คน`);
  console.log(`❌ สมัครไม่สำเร็จ: ${failCount} คน`);
  console.log(`📊 รวมทั้งหมด: ${customers.length} คน`);
}

// รันสคริปต์
registerCustomers().catch(error => {
  console.error('เกิดข้อผิดพลาด:', error.message);
  process.exit(1);
});

