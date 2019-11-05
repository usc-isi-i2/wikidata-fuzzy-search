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

export function getResultsData(response) {
  /**
   * Extract resultsData from response.
   * 
   * @param {array}   response
   * 
   * @return {array}  resultsData.
   */

  let resultsData = [];

  let temp = {};
  for (let i = 0; i < response.length; i++) {
    const alignments = response[i].alignments;
    for (let j = 0; j < alignments.length; j++) {
      const result = alignments[j];
      if (temp[result.name] === undefined) {
        // first time of this result
        temp[result.name] = result;
      } else {
        // if there is already a result with the same name, update score
        const prevScore = temp[result.name].score;
        if (result.score > prevScore) {
          temp[result.name] = result;
        }
      }
    }
  }

  resultsData = Object.values(temp);
  resultsData.sort((r1, r2) => (r2.score - r1.score))

  return resultsData;
}

export function formatTime(dateString, precision) {
  /**
   * Convert date string to date object, then format by given precision.
   * 
   * @param {string}  dateString e.g. '2017-01-01T00:00:00Z'
   * @param {int}     precision
   * 
   * @return {string}  formatted date string.
   */

  let formatted = '';
  const d = new Date(dateString);
  if (precision === null) precision = 11;

  // append year
  formatted += d.getUTCFullYear();
  if (precision <= 9) return formatted;

  // append month
  formatted += '-' + (d.getUTCMonth() + 1);
  if (precision === 10) return formatted;

  // append date
  formatted += '-' + d.getUTCDate();
  return formatted;
}

export function formatTimePrecision(precision) {
  /**
   * Convert time precision to string.
   * 
   * @param {int} precision
   * 
   * @return {string} formatted time precision.
   */

  // https://www.wikidata.org/wiki/Help:Dates#Precision
  const WIKIDATA_TIME_PRECISION = {
    14: 'second',
    13: 'minute',
    12: 'hour',
    11: 'day',
    10: 'month',
    9: 'year',
    8: 'decade',
    7: 'century',
    6: 'millennium',
    4: 'hundred thousand years',
    3: 'million years',
    0: 'billion years'
  }
  return WIKIDATA_TIME_PRECISION[precision];
}