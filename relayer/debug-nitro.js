
import * as NitroliteParams from '@erc7824/nitrolite';

console.log('--- Nitrolite Package Exports ---');
console.log('Keys:', Object.keys(NitroliteParams));

try {
    const { NitroliteClient } = NitroliteParams;
    console.log('NitroliteClient type:', typeof NitroliteClient);
    if (NitroliteClient) {
        console.log('Prototype props:', Object.getOwnPropertyNames(NitroliteClient.prototype || {}));
        console.log('Static props:', Object.getOwnPropertyNames(NitroliteClient));
    }
} catch (e) {
    console.error('Error inspecting:', e);
}
console.log('-------------------------------');
