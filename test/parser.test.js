// Verifies the inbound parser never turns a delivery/status callback
// or content-less payload into something the state machine would
// reply to. See src/handlers/parser.js.
const { parseInbound } = require('../src/handlers/parser');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ ' + m); } };

console.log('── Status/delivery events must not parse as a message ──');

ok(parseInbound({ data: { customerNumber: '919999999999', status: 'delivered' } }) === null,
  '"delivered" status callback should return null');
ok(parseInbound({ data: { customerNumber: '919999999999', status: 'read' } }) === null,
  '"read" status callback should return null');
ok(parseInbound({ data: { customerNumber: '919999999999', status: 'sent' } }) === null,
  '"sent" status callback should return null');
ok(parseInbound({ data: { customerNumber: '919999999999', statuses: [{ status: 'failed' }] } }) === null,
  'Cloud-API-shaped statuses[] array should return null');

console.log('── Content-less payloads must not parse as a message ──');
ok(parseInbound({ data: { customerNumber: '919999999999', contentType: 'text' } }) === null,
  'a text-type payload with no actual text should return null');

console.log('── A real inbound text message still parses ──');
const real = parseInbound({ data: { customerNumber: '919999999999', contentType: 'text', text: 'Hi', id: 'wamid.ABC' } });
ok(!!real, 'a real text message should parse');
ok(real && real.text === 'Hi', 'text should be extracted');
ok(real && real.msgId === 'wamid.ABC', 'msgId should be extracted');

console.log(fail === 0
  ? `\n✅ all ${pass} parser assertions passed`
  : `\n❌ ${fail} failed / ${pass} passed`);
process.exitCode = fail === 0 ? 0 : 1;
