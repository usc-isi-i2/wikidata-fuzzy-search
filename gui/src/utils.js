export const log = {
  default: "background: ; color: ",
  highlight: "background: yellow; color: black",
  link: "background: white; color: blue"
}

export function truncateStr(str, maxLen) {
  /**
   * Truncate string by length.
   * 
   * @param {string}  str     Input string.
   * @param {int}     maxLen  Max length of output string.
   * 
   * @return {string} Output string.
   */
  if (str.length < maxLen) return str;
  else return str.substring(0, str.lastIndexOf(' ', maxLen)) + ' ...';
}

export function truncateQualifiers(arr, truncate = false) {
  /**
   * Truncate qualifiers and output string.
   * 
   * @param {string}  arr       Input qualifiers.
   * @param {bool}    truncate  Whether truncate or not.
   * 
   * @return {string} Output string.
   */
  if (truncate && arr.length > 3) {
    let str = '[';
    if (typeof arr[0] === "object") {
      // label
      str += String(arr[0].label);
      str += ', ' + String(arr[1].label);
      str += ', ' + String(arr[2].label);
    } else {
      // string
      str += String(arr[0]);
      str += ', ' + String(arr[1]);
      str += ', ' + String(arr[2]);
    }
    str += ', ...] (' + String(arr.length) + ' values)';
    return str;
  } else {
    let str = '[';
    if (typeof arr[0] === "object") {
      // label
      for (let i = 0; i < arr.length; i++) {
        if (i > 0) str += ', ';
        str += String(arr[i].label);
      }
    } else {
      // string
      for (let i = 0; i < arr.length; i++) {
        if (i > 0) str += ', ';
        str += String(arr[i]);
      }
    }
    str += ']';
    return str;
  }
}