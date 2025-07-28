function getRandomBase64ID(length = 8) {
    const byteLength = Math.ceil((length * 6) / 8); 
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);

    const base64 = btoa(String.fromCharCode(...Array.from(bytes)));
  
    return base64.replace(/=/g, '').slice(0, length);
  }

  export default getRandomBase64ID;