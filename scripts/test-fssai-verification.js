import { FssaiVerificationService } from '../src/services/fssaiVerificationService.js';

console.log('================================================================');
console.log('FEEDALL FSSAI VERIFICATION & IDENTITY COMPLIANCE SUITE');
console.log('Testing 14 Mandatory Official Source & Validation Edge Cases');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(description, condition, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] Scenario ${totalTests}: ${description}`);
    if (details) console.log(`         Details: ${details}`);
  } else {
    console.error(`  [FAIL] Scenario ${totalTests}: ${description}`);
    if (details) console.error(`         Failed Details: ${details}`);
  }
}

async function runTestSuite() {
  FssaiVerificationService.resetRateLimiter();

  // Test 1: Empty license number (reject immediately client/server-side)
  {
    const res = await FssaiVerificationService.verifyFssaiLicense({
      licenseNo: '',
      orgName: 'The Grand Oberoi',
      location: 'New Delhi'
    });
    assert(
      'Empty license number input validation',
      res.status === 'invalid_format' && res.isVerified === false,
      `Result status: ${res.status}, Message: ${res.message}`
    );
  }

  // Test 2: Whitespace trimming and malformed non-numeric values
  {
    const res = await FssaiVerificationService.verifyFssaiLicense({
      licenseNo: '  100200110045A9  ',
      orgName: 'The Grand Oberoi',
      location: 'New Delhi'
    });
    assert(
      'Malformed license with alphanumeric characters and whitespace',
      res.status === 'invalid_format' && res.isVerified === false,
      `Trimmed and rejected: ${res.status}, Message: ${res.message}`
    );
  }

  // Test 3: Incorrect length (< 14 digits)
  {
    const res = await FssaiVerificationService.verifyFssaiLicense({
      licenseNo: '1002001100',
      orgName: 'The Grand Oberoi',
      location: 'New Delhi'
    });
    assert(
      'License length constraint (must be exactly 14 digits)',
      res.status === 'invalid_format' && res.isVerified === false,
      `Rejected ${'1002001100'.length} digit number: ${res.message}`
    );
  }

  // Test 4: Invalid starting license prefix digit (must be 1 for central, 2 for state)
  {
    const formatCheck = FssaiVerificationService.validateFssaiFormat('90020011004523');
    assert(
      'Invalid starting prefix digit (digit 1 must be 1 or 2)',
      formatCheck.isValid === false && (formatCheck.message.includes('1') || formatCheck.message.includes('prefix')),
      `Error detected: ${formatCheck.message}`
    );
  }

  // Test 5: Invalid state code in digits 2-3 (> 38)
  {
    const formatCheck = FssaiVerificationService.validateFssaiFormat('19920011004523');
    assert(
      'Invalid Indian State/UT code in digits 2-3',
      formatCheck.isValid === false && formatCheck.message.includes('state jurisdiction code'),
      `Error detected: ${formatCheck.message}`
    );
  }

  // Test 6: Valid 14-digit format but unindexed in registry (routes to FoSCoS portal & manual review)
  {
    const res = await FssaiVerificationService.verifyFssaiLicense({
      licenseNo: '11124001009999',
      orgName: 'Independent Bistro',
      location: 'Mumbai'
    });
    assert(
      'Valid format but unindexed record fallback (manual review with FoSCoS URL)',
      res.status === 'manual_review_required' && !!res.foscosUrl,
      `Status: ${res.status}, Action URL: ${res.foscosUrl}`
    );
  }

  // Test 7: Active verified license with matching business details
  {
    const res = await FssaiVerificationService.verifyFssaiLicense({
      licenseNo: '10020011004523',
      orgName: 'The Grand Oberoi Hotel & Suites',
      location: 'New Delhi'
    });
    assert(
      'Official record confirmed with matching entity details',
      res.status === 'verified' && res.isVerified === true && res.matchDetails.isMatch === true,
      `Status: ${res.status}, Registered FBO: ${res.officialRecord.fboName}, Similarity: ${(res.matchDetails.nameScore * 100).toFixed(0)}%`
    );
  }

  // Test 8: Expired license detection from authoritative source
  {
    const res = await FssaiVerificationService.verifyFssaiLicense({
      licenseNo: '10016011008891',
      orgName: 'Royal Heritage Banquet & Catering',
      location: 'New Delhi'
    });
    assert(
      'Authoritative expired license detection',
      res.status === 'expired' && res.isVerified === false,
      `Status: ${res.status}, Expired Date: ${res.officialRecord.validityDate}`
    );
  }

  // Test 9: Suspended license detection from statutory enforcement
  {
    const res = await FssaiVerificationService.verifyFssaiLicense({
      licenseNo: '20018011002341',
      orgName: 'Spice Symphony Commercial Kitchen',
      location: 'New Delhi'
    });
    assert(
      'Authoritative suspended license detection',
      res.status === 'suspended' && res.isVerified === false,
      `Status: ${res.status}, Regulatory note: ${res.message}`
    );
  }

  // Test 10: Inactive / cancelled license status
  {
    const res = await FssaiVerificationService.verifyFssaiLicense({
      licenseNo: '10017011005522',
      orgName: 'City Pride Banquet Kitchen',
      location: 'Gurugram'
    });
    assert(
      'Authoritative inactive license detection',
      res.status === 'inactive' && res.isVerified === false,
      `Status: ${res.status}, Message: ${res.message}`
    );
  }

  // Test 11: Business identity mismatch (Org name materially differs)
  {
    const res = await FssaiVerificationService.verifyFssaiLicense({
      licenseNo: '10020011004523', // Registered to The Grand Oberoi
      orgName: 'Burger King Express Food Cart',
      location: 'New Delhi'
    });
    assert(
      'Business entity name mismatch detection (prevents using other company licenses)',
      res.status === 'details_mismatch' && res.isVerified === false && res.matchDetails.isMatch === false,
      `Status: ${res.status}, Message: ${res.message}`
    );
  }

  // Test 12: Business location mismatch (City materially differs)
  {
    // Clear cache/rate limiter for independent scenario testing
    FssaiVerificationService.resetRateLimiter();

    const res = await FssaiVerificationService.verifyFssaiLicense({
      licenseNo: '10020011004523', // Registered in New Delhi
      orgName: 'The Grand Oberoi',
      location: 'Chennai' // Material location discrepancy
    });
    assert(
      'Business location mismatch detection (city mismatch triggers manual review)',
      res.status === 'details_mismatch' && res.isVerified === false,
      `Status: ${res.status}, Message: ${res.message}`
    );
  }

  // Test 13: Rate-limiting guard enforcement
  {
    let rateLimited = false;
    for (let i = 0; i < 15; i++) {
      const res = await FssaiVerificationService.verifyFssaiLicense({
        licenseNo: '10020011004523',
        orgName: 'The Grand Oberoi',
        location: 'New Delhi'
      });
      if (res.status === 'rate_limited') {
        rateLimited = true;
        break;
      }
    }
    assert(
      'Rate-limiting protection (guards official registry against automated scraping)',
      rateLimited === true,
      `Rate limiting triggered after exceeding 6 requests/minute`
    );
  }

  // Test 14: FoSCoS Search Portal URL Generation
  {
    const portalUrl = FssaiVerificationService.getFoscosSearchUrl('10020011004523');
    assert(
      'Official FoSCoS search portal bridge URL generation',
      portalUrl.includes('foscos.fssai.gov.in') && portalUrl.includes('10020011004523'),
      `Generated URL: ${portalUrl}`
    );
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} SCENARIOS PASSED`);
  if (passedTests === totalTests) {
    console.log('ALL VERIFICATION & STATUTORY COMPLIANCE TESTS COMPLETED SUCCESSFULLY.');
  } else {
    console.error('SOME TESTS FAILED.');
    process.exit(1);
  }
  console.log('================================================================\n');
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
