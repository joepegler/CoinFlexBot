import { window } from "./sha";

/*
 * Converts an array of words in big-endian order (most significant word first)
 * into a string of bytes in big-endian order (most significant byte first).
 */
export function words_to_string(words) {
  var bytes = "";
  for (var i = 0; i < words.length; ++i) {
    var w = words[i];
    bytes += String.fromCharCode(
      (w >> 24) & 0xff,
      (w >> 16) & 0xff,
      (w >> 8) & 0xff,
      w & 0xff
    );
  }
  return bytes;
}

/*
 * Converts a string of bytes in big-endian order (most significant byte first)
 * into an array of words in big-endian order (most significant word first).
 */
export function string_to_words(string) {
  var words = [];
  for (var i = 0; i < string.length; i += 4) {
    words.push(
      (string.charCodeAt(i) << 24) |
        (string.charCodeAt(i + 1) << 16) |
        (string.charCodeAt(i + 2) << 8) |
        string.charCodeAt(i + 3)
    );
  }
  return words;
}

/*
 * Hashes a string and returns the resulting digest as an array of words in
 * big-endian order (most significant word first).
 */
export function hash_string_to_words(string) {
  var sha = new window.SHA224();
  sha.write(string);
  var view = new DataView(sha.digest().buffer);
  var digest = new Uint32Array(7);
  for (var i = 0; i < 7; ++i) {
    digest[i] = view.getUint32(i * 4);
  }
  return digest;
}
